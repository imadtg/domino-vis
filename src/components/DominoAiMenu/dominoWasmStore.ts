import {
  initialize,
  playMove,
  pass,
  isPlaying,
  perfectPick,
  imperfectPick,
} from "../../../lib/features/domino/dominoSlice";
import {
  createConfiguredModule,
  newGame,
  printGame,
  newMovesContext,
} from "@/public/wasm/cToJShelpers";
import {
  DominoIngameInfo,
  Move,
  normalizeMove,
  turnAround,
} from "../../../lib/features/domino/dominoUtils";
import { startAppListening } from "../../../lib/listenerMiddleware";
import { PayloadAction } from "@reduxjs/toolkit";
import { USER } from "../GameInitMenu";
console.log("domino ai listener is going to attach itself...");
export let ModuleState: { Module?: any; game?: number } = {};

startAppListening({
  actionCreator: initialize,
  effect: async (action: PayloadAction<DominoIngameInfo>, listenerApi) => {
    // Run whatever additional side-effect-y logic you want here
    console.log("Wasm middleware listened for initialize: ", action.payload);
    if (typeof ModuleState.Module === "undefined") {
      ModuleState.Module = await createConfiguredModule();
      ModuleState.Module._init_fact();
    }
    ModuleState.game = newGame(ModuleState.Module); // THIS IS A FIXME: MEMORY LEAK!!!
    console.log("ModuleState :", ModuleState);
    [...action.payload.hands, action.payload.boneyard].forEach(
      ({ count }, playerIndex) =>
        ModuleState.Module._set_hand_size(ModuleState.game, playerIndex, count),
    );
    const hands = ModuleState.Module._get_hands(ModuleState.game);
    action.payload.hands[USER].pieces.forEach(({ piece }) =>
      ModuleState.Module._collapse_piece(USER, hands, piece.left, piece.right),
    );
    // HACK: this assumes there are only two players, and that all the remaining dominoes are possibly in the opponent's hand
    const OPPONENT = (USER + 1) % 2;
    action.payload.hands[OPPONENT].pieces.forEach(({ piece }) =>
      ModuleState.Module._absent_piece(USER, hands, piece.left, piece.right),
    );
    ModuleState.Module._emit_collapse(hands);
    printGame(ModuleState.Module, ModuleState.game);
  },
});

startAppListening({
  actionCreator: playMove,
  effect: async (action: PayloadAction<Move>, listenerApi) => {
    console.log("Wasm middleware listened for playMove: ", action.payload);
    console.log("ModuleState :", ModuleState);
    const { move } = newMovesContext(ModuleState.Module); // THIS IS A FIXME: MEMORY LEAK!!!
    const { dominoGame } = listenerApi.getOriginalState();
    if (!isPlaying(dominoGame)) {
      return;
    }
    const { gameInfo } = dominoGame;
    console.log(gameInfo);
    const { left, right } = normalizeMove(action.payload, gameInfo.snake).piece;
    console.log(`playing [${left}|${right}] on the ${action.payload.side}`);

    const LEFT = ModuleState.Module._get_LEFT();
    const RIGHT = ModuleState.Module._get_RIGHT();
    ModuleState.Module._populate_move_from_components(
      move,
      action.payload.side === "right" ? RIGHT : LEFT,
      left,
      right,
    );
    ModuleState.Module._play_move_by_pointer(ModuleState.game, move);
    printGame(ModuleState.Module, ModuleState.game);
  },
});

startAppListening({
  actionCreator: pass,
  effect: async (action, listenerApi) => {
    console.log("Wasm middleware listened for pass: ", action.payload);
    ModuleState.Module._pass(ModuleState.game);
    printGame(ModuleState.Module, ModuleState.game);
  },
});

startAppListening({
  actionCreator: perfectPick,
  effect: async (action, listenerApi) => {
    console.log("Wasm middleware listened for perfectPick: ", action.payload);
    const { move } = newMovesContext(ModuleState.Module); // THIS IS A FIXME: MEMORY LEAK!!!
    const { left, right } = action.payload;
    const PERFECT_PICK = ModuleState.Module._get_PERFECT_PICK();
    ModuleState.Module._populate_move_from_components(
      move,
      PERFECT_PICK,
      left,
      right,
    );
    ModuleState.Module._perfect_pick_by_pointer(ModuleState.game, move);
    printGame(ModuleState.Module, ModuleState.game);
  },
});

startAppListening({
  actionCreator: imperfectPick,
  effect: async (action, listenerApi) => {
    console.log("Wasm middleware listened for imperfectPick: ", action.payload);
    const { move } = newMovesContext(ModuleState.Module); // THIS IS A FIXME: MEMORY LEAK!!!
    ModuleState.Module._populate_imperfect_picking_move(move, action.payload);
    ModuleState.Module._imperfect_pick_by_pointer(ModuleState.game, move);
    printGame(ModuleState.Module, ModuleState.game);
  },
});

console.log("domino ai listener has attached itself!");
