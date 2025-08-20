import {
  DominoIngameInfo,
  DominoPiece,
  Move,
} from "@/lib/features/domino/dominoUtils";
import * as Comlink from "comlink";
import {
  createConfiguredModule,
  newGame,
  printGame,
  extractLeft,
  extractRight,
  newMovesContext,
  extractType,
} from "@/public/wasm/cToJShelpers";
import { USER } from "../GameInitMenu";

let Module: any;
let fallbackPtr: number;
let game: number;
let initialized = false;
async function init() {
  // TODO: get a global worker lock and replace the throw new Errors in use-domino-ai.ts with Atomics.waitAsync of it
  Module = await createConfiguredModule();
  Module._init_fact();
  fallbackPtr = Module._get_fallback_ptr();
  initialized = true;
}

function isInitialized() {
  return initialized;
}

function getSharedArrayBuffer(): SharedArrayBuffer {
  return Module.wasmMemory.buffer;
}

function getFallbackPtr(): number {
  return fallbackPtr;
}

function initialize(initialGameInfo: DominoIngameInfo) {
  game = newGame(Module); // THIS IS A FIXME: MEMORY LEAK!!!
  [...initialGameInfo.hands, initialGameInfo.boneyard].forEach(
    ({ count }, playerIndex) => Module._set_hand_size(game, playerIndex, count),
  );
  const hands = Module._get_hands(game);
  initialGameInfo.hands[USER].pieces.forEach(({ piece }) =>
    Module._collapse_piece(USER, hands, piece.left, piece.right),
  );
  // HACK: this assumes there are only two players, and that all the remaining dominoes are possibly in the opponent's hand
  const OPPONENT = (USER + 1) % 2;
  initialGameInfo.hands[OPPONENT].pieces.forEach(({ piece }) =>
    Module._absent_piece(USER, hands, piece.left, piece.right),
  );
  Module._emit_collapse(hands);
  Module._set_turn(game, initialGameInfo.turn);
  printGame(Module, game);
}

function playMove(normalizedMove: Move) {
  const { move } = newMovesContext(Module); // THIS IS A FIXME: MEMORY LEAK!!!
  const { piece, side } = normalizedMove;
  const { left, right } = piece;
  console.log(`playing [${left}|${right}] on the ${side}`);
  const LEFT = Module._get_LEFT();
  const RIGHT = Module._get_RIGHT();
  Module._populate_move_from_components(
    move,
    side === "right" ? RIGHT : LEFT,
    left,
    right,
  );
  Module._play_move_by_pointer(game, move);
  printGame(Module, game);
}

function pass() {
  Module._pass(game);
  printGame(Module, game);
}

function perfectPick(piece: DominoPiece) {
  const { move } = newMovesContext(Module); // THIS IS A FIXME: MEMORY LEAK!!!
  const { left, right } = piece;
  const PERFECT_PICK = Module._get_PERFECT_PICK();
  Module._populate_move_from_components(move, PERFECT_PICK, left, right);
  Module._perfect_pick_by_pointer(game, move);
  printGame(Module, game);
}

function imperfectPick(amount: number) {
  const { move } = newMovesContext(Module); // THIS IS A FIXME: MEMORY LEAK!!!
  Module._populate_imperfect_picking_move(move, amount);
  Module._imperfect_pick_by_pointer(game, move);
  printGame(Module, game);
}

interface SuccessfulAiSearchResult {
  status: "success";
  bestMove: Move;
  score: number;
  numberOfExploredNodes: number;
}

interface AbortedAiSearchResult {
  status: "aborted";
}

export type AiSearchResult = SuccessfulAiSearchResult | AbortedAiSearchResult;

interface BareAiSearchContext {
  movePtr: number;
  scorePtr: number;
  numberOfExploredNodesPtr: number;
}

function _getAiMove(depth: number): BareAiSearchContext {
  const { move } = newMovesContext(Module); // FIXME: MEMORY LEAK!!!
  function deref_c_int(ptr: number) {
    return Module._deref_int(ptr);
  }

  function alloc_c_int() {
    return Module._alloc_int();
  }

  function deref_c_float(ptr: number) {
    return Module._deref_float(ptr);
  }

  function alloc_c_float() {
    return Module._alloc_float();
  }

  const cantPassPtr = alloc_c_int();

  const numberOfPlayingMovesPtr = alloc_c_int();
  const playingMovesArrPtr = Module._alloc_max_move_arr();

  Module._get_playing_moves(
    game,
    playingMovesArrPtr,
    numberOfPlayingMovesPtr,
    cantPassPtr,
  );

  const numberOfExploredNodesPtr = alloc_c_int();
  const scorePtr = alloc_c_float();
  Module._populate_move_by_ai(
    game,
    move,
    playingMovesArrPtr,
    deref_c_int(numberOfPlayingMovesPtr),
    depth,
    scorePtr,
    numberOfExploredNodesPtr,
  );
  return {
    movePtr: move,
    scorePtr,
    numberOfExploredNodesPtr,
  };
}

function getAiMove(depth: number): AiSearchResult {
  function deref_c_int(ptr: number) {
    return Module._deref_int(ptr);
  }

  function deref_c_float(ptr: number) {
    return Module._deref_float(ptr);
  }
  const { movePtr, scorePtr, numberOfExploredNodesPtr } = _getAiMove(depth);
  if (Module._get_fallback()) {
    Module._reset_fallback();
    return { status: "aborted" };
  }
  const LEFT = Module._get_LEFT();
  const RIGHT = Module._get_RIGHT();
  const score = deref_c_float(scorePtr);
  const numberOfExploredNodes = deref_c_int(numberOfExploredNodesPtr);
  console.log(
    `JS: found this move with score = ${score} and number of explored nodes = ${numberOfExploredNodes}`,
  );
  return {
    status: "success",
    bestMove: {
      piece: {
        left: extractLeft(Module, movePtr),
        right: extractRight(Module, movePtr),
      },
      side: extractType(Module, movePtr) === RIGHT ? "right" : "left",
    },
    score,
    numberOfExploredNodes,
  };
}

export type IterativeDeepeningProgressInfo =
  | { status: "ongoing"; searchResult: SuccessfulAiSearchResult; depth: number }
  | { status: "interrupted" }
  | { status: "finished" };

async function doIterativeDeepening(
  onProgress: (progressInfo: IterativeDeepeningProgressInfo) => Promise<void>,
) {
  function deref_c_int(ptr: number) {
    return Module._deref_int(ptr);
  }

  function deref_c_float(ptr: number) {
    return Module._deref_float(ptr);
  }
  const LEFT = Module._get_LEFT();
  const RIGHT = Module._get_RIGHT();
  let currentDepth = 1;
  let lastNumberOfExploredNodes;
  let currentNumberOfExploredNodes = 0;
  let searchResult: AiSearchResult;
  do {
    const { movePtr, scorePtr, numberOfExploredNodesPtr } =
      _getAiMove(currentDepth);
    if (Module._get_fallback()) {
      Module._reset_fallback();
      await onProgress({ status: "interrupted" });
      return;
    }
    const score = deref_c_float(scorePtr);
    const numberOfExploredNodes = deref_c_int(numberOfExploredNodesPtr);
    searchResult = {
      status: "success",
      bestMove: {
        piece: {
          left: extractLeft(Module, movePtr),
          right: extractRight(Module, movePtr),
        },
        side: extractType(Module, movePtr) === RIGHT ? "right" : "left",
      },
      score,
      numberOfExploredNodes,
    };
    await onProgress({
      status: "ongoing",
      searchResult,
      depth: currentDepth,
    });
    currentDepth++;
    lastNumberOfExploredNodes = currentNumberOfExploredNodes;
    currentNumberOfExploredNodes = searchResult.numberOfExploredNodes;
  } while (currentNumberOfExploredNodes > lastNumberOfExploredNodes);
  await onProgress({ status: "finished" });
}

const workerFunctions = {
  // this is not the same as initialize below, this initializes the worker and its environment,
  // the one below is just a 'reducer' of the initialize action of dominoSlice.ts
  init,
  isInitialized,
  // shared memory stuff to allow AI search to be cancellable
  getFallbackPtr,
  getSharedArrayBuffer,
  // these are just equivalents of the reducers of dominoSlice.ts to synchronize the UI state with the AI engine state
  initialize,
  playMove,
  pass,
  perfectPick,
  imperfectPick,
  // this is the AI search
  getAiMove,
  doIterativeDeepening,
};

Comlink.expose(workerFunctions);

export type WorkerType = typeof workerFunctions;
