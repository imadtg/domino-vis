import { createAppSlice } from "@/lib/createAppSlice";
import type { AppThunk } from "@/lib/store";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { DominoPiece, Move, DominoIngameInfo } from "./dominoUtils";
import { comparePieces } from "./dominoUtils";

export interface DominoGameSliceState {
  gameInfo: DominoIngameInfo | undefined;
  gameStatus: "uninitialized" | "playing";
}

const initialState: DominoGameSliceState = {
  gameInfo: undefined,
  gameStatus: "uninitialized",
};

export const dominoSlice = createAppSlice({
  name: "dominoGame",
  initialState,
  reducers: (create) => ({
    initialize: create.reducer(
      (state, action: PayloadAction<DominoIngameInfo>) => {
        return { gameInfo: action.payload, gameStatus: "playing" };
      }
    ),
    playMove: create.reducer(({ gameInfo }, action: PayloadAction<Move>) => {
      if (gameInfo === undefined) {
        return;
      }
      const index = gameInfo.hands[gameInfo.turn].findIndex((piece) =>
        comparePieces(piece, action.payload.piece)
      );
      gameInfo.hands[gameInfo.turn].splice(index, 1);
      switch (action.payload.side) {
        case "left": {
          gameInfo.snake.unshift(action.payload.piece);
          break;
        }
        case "right": {
          gameInfo.snake.push(action.payload.piece);
          break;
        }
      }
      gameInfo.turn = (gameInfo.turn + 1) % 2;
    }),
  }),
  selectors: {
    selectHand: ({ gameInfo }, player) => gameInfo?.hands[player],
    selectSnake: ({ gameInfo }) => gameInfo?.snake,
    selectTurn: ({ gameInfo }) => gameInfo?.turn,
    selectStatus: ({ gameStatus }) => gameStatus,
  },
});

export const { initialize, playMove } = dominoSlice.actions;

export const { selectHand, selectSnake, selectTurn, selectStatus } =
  dominoSlice.selectors;
