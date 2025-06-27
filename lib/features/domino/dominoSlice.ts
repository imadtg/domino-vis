import { createAppSlice } from "@/lib/createAppSlice";
import type { AppThunk } from "@/lib/store";
import type {
  CreateSliceOptions,
  PayloadAction,
  SliceCaseReducers,
  SliceSelectors,
} from "@reduxjs/toolkit";
import type { DominoPiece, Move, DominoIngameInfo } from "./dominoUtils";
import {
  collapse,
  comparePieces,
  getPlayableSides,
  normalizeMove,
  turnAround,
} from "./dominoUtils";

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

export function isUninitialized(
  state: DominoGame,
): state is UninitializedDominoGame {
  return state.gameStatus === "uninitialized";
}

export function isPlaying(state: DominoGame): state is PlayingDominoGame {
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
        const gameInfo = collapse(action.payload);
        if (isUninitialized(state)) {
          // Create and return a new state object with the "playing" status
          return {
            gameStatus: "playing",
            gameInfo,
            passCounter: 0,
          } as PlayingDominoGame;
        } else if (isPlaying(state)) {
          // Directly mutate the playing state
          state.gameInfo = gameInfo;
        }
      },
    ),
    playMove: create.reducer(
      (state: DominoGame, action: PayloadAction<Move>) => {
        if (!isPlaying(state)) {
          return;
        }
        [...state.gameInfo.hands, state.gameInfo.boneyard].forEach((hand) => {
          hand.pieces = hand.pieces.filter(
            ({ piece }) => !comparePieces(piece, action.payload.piece),
          );
        });
        state.gameInfo.hands[state.gameInfo.turn].count--;
        state.gameInfo = collapse(state.gameInfo);
        const { gameInfo } = state;
        const move = normalizeMove(action.payload, gameInfo.snake);
        switch (move.side) {
          case "left": {
            gameInfo.snake.unshift(move.piece);
            break;
          }
          case "right": {
            gameInfo.snake.push(move.piece);
            break;
          }
        }
        state.passCounter = 0;
        gameInfo.turn = (gameInfo.turn + 1) % 2; // HACK: hardcoded for two players for now
      },
    ),
    pass: create.reducer((state: DominoGame) => {
      // TODO: move this first part into a separate action of 'absenting', this would make it hard to synchronize the wasm listener middleware though...
      if (!isPlaying(state)) {
        return;
      }
      state.gameInfo.hands[state.gameInfo.turn].pieces = state.gameInfo.hands[
        state.gameInfo.turn
      ].pieces.filter(
        ({ piece }) =>
          getPlayableSides(state.gameInfo.snake, piece).length === 0,
      );
      state.gameInfo = collapse(state.gameInfo);
      state.gameInfo.turn = (state.gameInfo.turn + 1) % 2;
      state.passCounter++;
    }),
    perfectPick: create.reducer(
      (state: DominoGame, action: PayloadAction<DominoPiece>) => {
        if (!isPlaying(state)) {
          return;
        }
        state.gameInfo.hands[state.gameInfo.turn].pieces = state.gameInfo.hands[
          state.gameInfo.turn
        ].pieces.filter(
          ({ piece }) =>
            getPlayableSides(state.gameInfo.snake, piece).length === 0,
        );
        state.gameInfo.boneyard.pieces = state.gameInfo.boneyard.pieces.filter(
          ({ piece }) => !comparePieces(piece, action.payload),
        );
        state.gameInfo.hands[state.gameInfo.turn].pieces.push({
          piece: { ...action.payload, origin: "boneyard" }, // to ensure that the animations work, we wont consider action.payload's origin, which should already be 'boneyard' in the regular circumstances... just in case somehow it comes in undefined or wrong...
          presence: "certain",
        });
        state.gameInfo = collapse(state.gameInfo);
      },
    ),
    imperfectPick: create.reducer(
      (state: DominoGame, action: PayloadAction<number>) => {
        if (!isPlaying(state)) {
          return;
        }
        state.gameInfo.hands[state.gameInfo.turn].pieces = state.gameInfo.hands[
          state.gameInfo.turn
        ].pieces.filter(
          ({ piece }) =>
            getPlayableSides(state.gameInfo.snake, piece).length === 0,
        );

        state.gameInfo.boneyard.count -= action.payload;
        state.gameInfo.hands[state.gameInfo.turn].count += action.payload;
        const pickableBoneyardPieces = state.gameInfo.boneyard.pieces
          .map(({ piece }) => piece)
          .filter(
            (piece) =>
              getPlayableSides(state.gameInfo.snake, piece).length === 0 && // only pieces that cant be played because that is the definition of an imperfect pick, a pick which is not revealed, a playable pick is played immediately and thus should be a perfect pick
              !state.gameInfo.hands[state.gameInfo.turn].pieces.some(
                ({ piece: handPiece }) => comparePieces(piece, handPiece),
              ),
          );

        state.gameInfo.hands[state.gameInfo.turn].pieces.concat(
          pickableBoneyardPieces.map((piece) => ({
            piece,
            presence: "possible",
          })),
        );
        state.gameInfo = collapse(state.gameInfo);
      },
    ),
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
      state.gameStatus === "playing" ? state.gameInfo : undefined,
  },
});

export const { initialize, playMove, pass, perfectPick, imperfectPick } = dominoSlice.actions;

export const {
  selectHands,
  selectSnake,
  selectTurn,
  selectStatus,
  selectIsBlocked,
  selectGameInfo,
} = dominoSlice.selectors;
