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

export type AiSearchResult =
  | { status: "aborted" }
  | { status: "success"; bestMove: Move };

function getAiMove(depth: number): AiSearchResult {
  // I know that i really should use Atomics... FALLBACK serves to indicate whether no search is ongoing right now...
  // a bit overloaded from its first purpose of just cancelling searches i know...
  Module._reset_fallback();
  const { move } = newMovesContext(Module); // FIXME: MEMORY LEAK!!!
  function deref_c_int(ptr: number) {
    return Module._deref_int(ptr);
  }

  function alloc_c_int() {
    return Module._alloc_int();
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
  Module._populate_move_by_ai(
    game,
    move,
    playingMovesArrPtr,
    deref_c_int(numberOfPlayingMovesPtr),
    depth,
  );
  if (Module._get_fallback()) {
    return { status: "aborted" };
  }
  Module._set_fallback(); // again, i should really use Atomics... but FALLBACK right now still represents whether a search is ongoing...
  // while also acting as a way to do early returns inside the search if this is set elsewhere (which triggers the if statement above)...
  const LEFT = Module._get_LEFT();
  const RIGHT = Module._get_RIGHT();
  return {
    status: "success",
    bestMove: {
      piece: {
        left: extractLeft(Module, move),
        right: extractRight(Module, move),
      },
      side: extractType(Module, move) === RIGHT ? "right" : "left",
    },
  };
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
};

Comlink.expose(workerFunctions);

export type WorkerType = typeof workerFunctions;
