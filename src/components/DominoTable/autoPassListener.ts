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

function autoPass(dispatch) {
  if (!processedHands[turn].some(({ playable }) => playable) && !isBlocked) {
    dispatch(pass());
  }
}

startAppListening({
  actionCreator: initialize,
  effect: async (action: PayloadAction<DominoIngameInfo>, listenerApi) => {},
});

startAppListening({
  actionCreator: playMove,
  effect: async (action: PayloadAction<Move>, listenerApi) => {},
});

startAppListening({
  actionCreator: pass,
  effect: async (action, listenerApi) => {},
});
