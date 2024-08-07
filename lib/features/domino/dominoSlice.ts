import { createAppSlice } from "@/lib/createAppSlice";
import type { AppThunk } from "@/lib/store";
import type {
  CreateSliceOptions,
  PayloadAction,
  SliceCaseReducers,
  SliceSelectors,
} from "@reduxjs/toolkit";
import type { DominoPiece, Move, DominoIngameInfo } from "./dominoUtils";
import { comparePieces, turnAround } from "./dominoUtils";

interface PlayingDominoGame {
  gameStatus: "playing";
  gameInfo: DominoIngameInfo;
  passCounter: number;
}

interface UninitializedDominoGame {
  gameStatus: "uninitialized";
}

export type DominoGame = PlayingDominoGame | UninitializedDominoGame;

const initialState: DominoGame = {
  gameStatus: "uninitialized",
};

function isUninitialized(state: DominoGame): state is UninitializedDominoGame {
  return state.gameStatus === "uninitialized";
}

function isPlaying(state: DominoGame): state is PlayingDominoGame {
  return state.gameStatus === "playing";
}

const partialGenericCreateAppSlice = <T>() => {
  // this is absolute pain. this could break on RTK update, there has to be a better way...
  return <
    U extends SliceCaseReducers<T>,
    V extends string,
    W extends SliceSelectors<T>,
  >(
    config: CreateSliceOptions<T, U, V, V, W>,
  ) => createAppSlice<T, U, V, W>(config);
};

export const dominoSlice = partialGenericCreateAppSlice<DominoGame>()({
  name: "dominoGame",
  initialState,
  reducers: (create) => ({
    initialize: create.reducer(
      (
        state: DominoGame,
        action: PayloadAction<DominoIngameInfo>,
      ): PlayingDominoGame | undefined => {
        if (isUninitialized(state)) {
          // Create and return a new state object with the "playing" status
          return {
            gameStatus: "playing",
            gameInfo: action.payload,
            passCounter: 0,
          } as PlayingDominoGame;
        } else if (isPlaying(state)) {
          // Directly mutate the playing state
          state.gameInfo = action.payload;
        }
      },
    ),
    playMove: create.reducer(
      (state: DominoGame, action: PayloadAction<Move>) => {
        if (!isPlaying(state)) {
          // Handle the case when the game is not in the "playing" state.
          // For example, return the state unchanged or throw an error.
          return;
        }
        // Now TypeScript knows `state` is a `RunningDominoGame`.
        const index = state.gameInfo.hands[state.gameInfo.turn].findIndex(
          (piece) => comparePieces(piece, action.payload.piece),
        );
        // Continue with the rest of your reducer logic here.
        state.gameInfo.hands[state.gameInfo.turn].splice(index, 1);
        if (state.gameInfo.snake.length === 0) {
          state.gameInfo.snake.push(action.payload.piece);
        } else {
          switch (action.payload.side) {
            case "left": {
              const leftPip = state.gameInfo.snake[0].left;
              state.gameInfo.snake.unshift(
                leftPip === action.payload.piece.right
                  ? action.payload.piece
                  : turnAround(action.payload.piece),
              );
              break;
            }
            case "right": {
              const rightPip = state.gameInfo.snake.at(-1)?.right;
              state.gameInfo.snake.push(
                rightPip === action.payload.piece.left
                  ? action.payload.piece
                  : turnAround(action.payload.piece),
              );
              break;
            }
          }
        }
        state.passCounter = 0;
        state.gameInfo.turn = (state.gameInfo.turn + 1) % 2;
      },
    ),
    pass: create.reducer((state: DominoGame) => {
      if (state.gameStatus !== "playing") {
        return;
      }
      state.gameInfo.turn = (state.gameInfo.turn + 1) % 2;
      state.passCounter++;
    }),
  }),
  selectors: {
    selectHands: (state) =>
      state.gameStatus === "playing" ? state.gameInfo.hands : undefined,
    selectSnake: (state) =>
      state.gameStatus === "playing" ? state.gameInfo.snake : undefined,
    selectTurn: (state) =>
      state.gameStatus === "playing" ? state.gameInfo.turn : undefined,
    selectIsBlocked: (state) =>
      state.gameStatus === "playing" ? state.passCounter >= 2 : undefined,
    selectStatus: (state) => state.gameStatus,
    selectGameInfo: (state) =>
      state.gameStatus === "playing"
        ? state.gameInfo
        : undefined,
  },
});

export const { initialize, playMove, pass } = dominoSlice.actions;

export const {
  selectHands,
  selectSnake,
  selectTurn,
  selectStatus,
  selectIsBlocked,
  selectGameInfo,
} = dominoSlice.selectors;
