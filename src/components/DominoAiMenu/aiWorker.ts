import { Move } from "@/lib/features/domino/dominoUtils";
import {
  extractLeft,
  extractRight,
  newMovesContext,
  extractType,
} from "@/public/wasm/cToJShelpers";

import { ModuleState } from "./dominoWasmStore";

export function getAiMove(Module: any, game: number, depth: number): Move {
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

  const LEFT = Module._get_LEFT();
  const RIGHT = Module._get_RIGHT();
  return {
    piece: {
      left: extractLeft(Module, move),
      right: extractRight(Module, move),
    },
    side: extractType(Module, move) === RIGHT ? "right" : "left",
  };
}
/*
addEventListener("message", (event: MessageEvent<number>) => {
  if (
    typeof ModuleState.Module === "undefined" ||
    typeof ModuleState.game === "undefined"
  ) {
    return;
  }
  postMessage(getAiMove(ModuleState.Module, ModuleState.game, event.data));
});*/
