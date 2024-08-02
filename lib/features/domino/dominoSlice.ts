import { createAppSlice } from "@/lib/createAppSlice";
import type { AppThunk } from "@/lib/store";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { DominoPiece, Move, DominoIngameInfo } from "./dominoUtils";
import { comparePieces, turnAround } from "./dominoUtils";

type PlayingDominoGame = {
  gameStatus: "playing";
  gameInfo: DominoIngameInfo
}

type UninitializedDominoGame = {
  gameStatus: "uninitialized"
}

export type DominoGameSliceState = PlayingDominoGame | UninitializedDominoGame;

const initialState: DominoGameSliceState = {
  gameStatus: "uninitialized",
};

function isUninitialized(
  state: DominoGameSliceState
): state is UninitializedDominoGame {
  return state.gameStatus === "uninitialized";
}

function isPlaying(state: DominoGameSliceState): state is PlayingDominoGame {
  return state.gameStatus === "playing";
}

export const dominoSlice = createAppSlice({
  name: "dominoGame",
  initialState,
  reducers: (create) => ({
    initialize: create.reducer(/* @ts-ignore */
      (
        state: DominoGameSliceState,
        action: PayloadAction<DominoIngameInfo>
      ) => {
        if (isUninitialized(state)) {
          // Create and return a new state object with the "playing" status
          return {
            gameStatus: "playing",
            gameInfo: action.payload,
          } as PlayingDominoGame;
        } else if (isPlaying(state)) {
          // Directly mutate the playing state
          state.gameInfo = action.payload;
        }
      }
    ),
    playMove: create.reducer(
      (state: DominoGameSliceState, action: PayloadAction<Move>) => {
        if (!isPlaying(state)) {
          // Handle the case when the game is not in the "playing" state.
          // For example, return the state unchanged or throw an error.
          return;
        }
        // Now TypeScript knows `state` is a `RunningDominoGame`.
        const { gameInfo } = state;
        const index = gameInfo.hands[gameInfo.turn].findIndex((piece) =>
          comparePieces(piece, action.payload.piece)
        );
        // Continue with the rest of your reducer logic here.
        gameInfo.hands[gameInfo.turn].splice(index, 1);
        if (gameInfo.snake.length === 0) {
          gameInfo.snake.push(action.payload.piece);
        } else {
          switch (action.payload.side) {
            case "left": {
              const leftPip = gameInfo.snake[0].left;
              gameInfo.snake.unshift(
                leftPip === action.payload.piece.right
                  ? action.payload.piece
                  : turnAround(action.payload.piece)
              );
              break;
            }
            case "right": {
              const rightPip = gameInfo.snake.at(-1)?.right;
              gameInfo.snake.push(
                rightPip === action.payload.piece.left
                  ? action.payload.piece
                  : turnAround(action.payload.piece)
              );
              break;
            }
          }
        }
        gameInfo.turn = (gameInfo.turn + 1) % 2;
      }
    ),
    pass: create.reducer((state: DominoGameSliceState) => {
      if (state.gameStatus !== "playing") {
        return;
      }
      state.gameInfo.turn = (state.gameInfo.turn + 1) % 2;
    }),
  }),
  selectors: { 
    selectHand: (state, player) =>/* @ts-ignore */
      state.gameStatus === "playing" ? state.gameInfo.hands[player] : undefined,
    selectSnake: (state) =>/* @ts-ignore */
      state.gameStatus === "playing" ? state.gameInfo.snake : undefined,
    selectTurn: (state) => /* @ts-ignore */
      state.gameStatus === "playing" ? state.gameInfo.turn : undefined,
    selectStatus: (state) => /* @ts-ignore */
      state.gameStatus === "playing" ? state.gameStatus : undefined,
  },
});

export const { initialize, playMove } = dominoSlice.actions;

export const { selectHand, selectSnake, selectTurn, selectStatus } =
  dominoSlice.selectors;
