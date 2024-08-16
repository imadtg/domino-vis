import {
  initialize,
  playMove,
  pass,
} from "../../../lib/features/domino/dominoSlice";
import {
  createConfiguredModule,
  newGame,
  printGame,
  newMovesContext,
  pass as wasmPass,
} from "@/public/wasm/cToJShelpers";
import {
  DominoIngameInfo,
  Move,
  turnAround,
} from "../../../lib/features/domino/dominoUtils";
import { startAppListening } from "../../../lib/listenerMiddleware";
import { PayloadAction } from "@reduxjs/toolkit";

export let ModuleState: { Module?: any; game?: number } = {};

startAppListening({
  actionCreator: initialize,
  effect: async (action: PayloadAction<DominoIngameInfo>, listenerApi) => {
    // Run whatever additional side-effect-y logic you want here
    //console.log("Wasm middleware listened for initialize: ", action.payload);
    if (typeof ModuleState.Module === "undefined") {
      ModuleState.Module = await createConfiguredModule();
    }
    ModuleState.game = newGame(ModuleState.Module); // THIS IS A MEMORY LEAK!!!
    //console.log("ModuleState :", ModuleState);
    action.payload.hands.map((hand, player) =>
      hand.map((piece) =>
        ModuleState.Module.ccall(
          "add_domino_to_player", // name of C function
          null, // return type
          ["number", "number", "number", "number"], // argument types
          [ModuleState.game, piece.left, piece.right, player], // arguments
        ),
      ),
    );
    //printGame(ModuleState.Module, ModuleState.game);
  },
});

startAppListening({
  actionCreator: playMove,
  effect: async (action: PayloadAction<Move>, listenerApi) => {
    //console.log("Wasm middleware listened for playMove: ", action.payload);
    //console.log("ModuleState :", ModuleState);
    const { move } = newMovesContext(ModuleState.Module); // THIS IS A MEMORY LEAK!!!
    const { dominoGame } = listenerApi.getState();
    if (dominoGame.gameStatus !== "playing") {
      return;
    }
    const { gameInfo } = dominoGame;
    let shouldTurnPieceAround: boolean;
    switch (action.payload.side) {
      case "left": {
        const leftPip = gameInfo.snake[0].left;
        shouldTurnPieceAround = leftPip === action.payload.piece.right;
        break;
      }
      case "right": {
        const rightPip = gameInfo.snake.at(-1)?.right;
        shouldTurnPieceAround = rightPip === action.payload.piece.left;
        break;
      }
    }
    const { left, right } = shouldTurnPieceAround
      ? turnAround(action.payload.piece)
      : action.payload.piece;
    ModuleState.Module.ccall(
      "populate_move_from_components",
      null,
      ["number", "number", "number", "number"],
      [move, left, right, action.payload.side === "right" ? 1 : 0],
    );
    ModuleState.Module.ccall(
      "em_do_move_pointer",
      null,
      ["number", "number"],
      [ModuleState.game, move],
    );
    //printGame(ModuleState.Module, ModuleState.game);
  },
});

startAppListening({
  actionCreator: pass,
  effect: async (action, listenerApi) => {
    //console.log("Wasm middleware listened for pass: ", action.payload);
    wasmPass(ModuleState.Module, ModuleState.game);
    //printGame(ModuleState.Module, ModuleState.game);
  },
});
