import { Move } from "@/lib/features/domino/dominoUtils";
import {
  extractLeft,
  extractRight,
  newMovesContext,
  extractHead,
} from "@/public/wasm/cToJShelpers";

import { ModuleState } from "./dominoWasmStore";

export function getAiMove(Module: any, game: number, depth: number): Move {
  const { move } = newMovesContext(Module); // FIXME: MEMORY LEAK!!!
  Module.ccall(
    "populate_best_move",
    null,
    ["number", "number", "number"],
    [game, depth, move],
  );
  return {
    piece: {
      left: extractLeft(Module, move),
      right: extractRight(Module, move),
    },
    side: extractHead(Module, move) ? "right" : "left",
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
