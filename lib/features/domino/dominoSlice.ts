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
import posthog from "posthog-js";

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
  // HACK: this is absolute pain. this could break on RTK update, there has to be a better way to fix types than this...
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
        posthog.capture("game initialized", {
          stateBefore: state,
          initialGameInfo: action.payload,
        });
        const gameInfo = collapse(action.payload);
        if (isUninitialized(state)) {
          // Create and return a new state object with the "playing" status
          return {
            gameStatus: "playing",
            gameInfo,
            passCounter: 0,
          } as PlayingDominoGame;
        } else if (isPlaying(state)) {
          // Directly overwrite current gameInfo
          state.gameInfo = gameInfo;
        }
      },
    ),
    playMove: create.reducer(
      (state: DominoGame, action: PayloadAction<Move>) => {
        posthog.capture("move played", {
          stateBefore: state,
          move: action.payload,
        });
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
        posthog.capture("move played finished", {
          stateAfter: state,
          move: action.payload,
        });
      },
    ),
    pass: create.reducer((state: DominoGame) => {
      posthog.capture("turn passed", { stateBefore: state });
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
      posthog.capture("turn passed finished", { stateAfter: state });
    }),
    perfectPick: create.reducer(
      (state: DominoGame, action: PayloadAction<DominoPiece>) => {
        posthog.capture("boneyard perfect picked", {
          stateBefore: state,
          piece: action.payload,
        });
        if (!isPlaying(state)) {
          return;
        }
        [...state.gameInfo.hands, state.gameInfo.boneyard].forEach((hand) => {
          hand.pieces = hand.pieces.filter(
            ({ piece }) => !comparePieces(piece, action.payload),
          );
        }); // remove the picked piece from all the hands
        state.gameInfo.hands[state.gameInfo.turn].pieces = state.gameInfo.hands[
          state.gameInfo.turn
        ].pieces.filter(
          ({ piece }) =>
            getPlayableSides(state.gameInfo.snake, piece).length === 0,
        ); // remove all playable pieces from the current player's hand (because otherwise they wouldnt have picked)
        state.gameInfo.hands[state.gameInfo.turn].pieces.push({
          piece: { ...action.payload, origin: "boneyard" }, // to ensure that the animations work, we wont consider action.payload's origin, which should already be 'boneyard' in the regular circumstances... just in case somehow it comes in undefined or wrong...
          presence: "certain",
        }); // add the picked piece to the current player's hand with certainty
        state.gameInfo = collapse(state.gameInfo);
        posthog.capture("boneyard perfect picked finished", {
          stateAfter: state,
          piece: action.payload,
        });
      },
    ),
    imperfectPick: create.reducer(
      (state: DominoGame, action: PayloadAction<number>) => {
        posthog.capture("boneyard imperfect picked", {
          stateBefore: state,
          amount: action.payload,
        });
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
              // only pieces that cant be played because that is the definition of an imperfect pick, a pick which is not revealed
              // a playable pick is played (and thus revealed) immediately and thus should be a perfect pick
              getPlayableSides(state.gameInfo.snake, piece).length === 0 &&
              !state.gameInfo.hands[state.gameInfo.turn].pieces.some(
                ({ piece: handPiece }) => comparePieces(piece, handPiece),
              ),
          );

        state.gameInfo.hands[state.gameInfo.turn].pieces = state.gameInfo.hands[
          state.gameInfo.turn
        ].pieces.concat(
          pickableBoneyardPieces.map((piece) => ({
            piece,
            presence: "possible",
          })),
        );
        state.gameInfo = collapse(state.gameInfo);
        posthog.capture("boneyard imperfect picked finished", {
          stateAfter: state,
          amount: action.payload,
        });
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

export const { initialize, playMove, pass, perfectPick, imperfectPick } =
  dominoSlice.actions;

export const {
  selectHands,
  selectSnake,
  selectTurn,
  selectStatus,
  selectIsBlocked,
  selectGameInfo,
} = dominoSlice.selectors;
