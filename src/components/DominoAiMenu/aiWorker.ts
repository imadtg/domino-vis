import { Move } from "@/lib/features/domino/dominoUtils";
import {
  extractLeft,
  extractRight,
  newMovesContext,
  extractType,
} from "@/public/wasm/cToJShelpers";
import { createConfiguredModule } from "@/public/wasm/cToJShelpers";
import * as Comlink from "comlink";

let Module: any;
let initialized = false;

async function init(wasmMemory: WebAssembly.Memory) {
  Module = await createConfiguredModule({
    wasmMemory,
  });
  initialized = true;
}

function isInitialized() {
  return initialized;
}

type AiSearchResult =
  | { status: "aborted" }
  | { status: "success"; bestMove: Move };

function getAiMove(game: number, depth: number): AiSearchResult {
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
  init,
  isInitialized,
  getAiMove,
};

Comlink.expose(workerFunctions);

export type WorkerType = typeof workerFunctions;
