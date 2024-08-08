"use client";
import * as React from "react";

import {
  pass,
  playMove,
  selectHands,
  selectIsBlocked,
  selectSnake,
  selectStatus,
  selectTurn,
} from "@/lib/features/domino/dominoSlice";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  DominoPiece,
  getPlayableSides,
} from "@/lib/features/domino/dominoUtils";

import Snake from "@/src/components/Snake";
import Hand from "@/src/components/Hand";
import Button from "../Button";

export interface ProcessedDominoPiece {
  piece: DominoPiece;
  playable: boolean;
}

function DominoTable() {
  const dispatch = useAppDispatch();
  const firstPlayer = 0;
  const secondPlayer = 1;
  const turn: number = useAppSelector(selectTurn);
  const hands = useAppSelector(selectHands);
  const snake = useAppSelector(selectSnake);
  const isBlocked = useAppSelector(selectIsBlocked);
  const [chosenPiece, setChosenPiece] = React.useState<DominoPiece>(); // this is used to store a piece that is playable on more than one side
  const gameStatus = useAppSelector(selectStatus);

  if (gameStatus === "uninitialized") {
    // this is supposed to give typescript more type narrowing power, but the tagged union needs to be fixed first in dominoSlice.
    return;
  }

  const processedHands: ProcessedDominoPiece[][] = hands?.map(
    (hand: DominoPiece[], player: number) =>
      hand.map((piece: DominoPiece) => {
        const sides = getPlayableSides(snake, piece);
        return {
          piece,
          playable: sides?.length > 0 && turn === player,
        };
      }),
  );

  if (!processedHands[turn].some(({ playable }) => playable) && !isBlocked) {
    dispatch(pass());
  }

  function handlePlayChosenPiece(side: "left" | "right") {
    if (!chosenPiece) {
      return;
    }
    dispatch(playMove({ piece: chosenPiece, side }));
    setChosenPiece(undefined);
  }

  function handleClickPiece(piece: DominoPiece) {
    // TODO: check if the piece is in the hand of the player whose turn it is.
    if (snake.length === 0) {
      // first move is played automatically
      dispatch(playMove({ piece, side: "left" })); // choosing left arbitrarily since it doesn't matter.
      return;
    }
    const sides = getPlayableSides(snake, piece);
    if (sides.length === 0) {
      // this should be an impossible state
      debugger; // TODO: remove this or remove branch.
      return;
    }
    if (sides.length > 1) {
      setChosenPiece(piece);
      return;
    }
    // automatically play domino if there is only one side for it to be played in
    dispatch(playMove({ piece, side: sides[0] }));
  }

  return (
    <div className="flex h-full flex-col items-center justify-between">
      <Hand
        processedHand={processedHands[firstPlayer]}
        onPieceClick={
          turn == firstPlayer ? (piece) => handleClickPiece(piece) : undefined
        }
      />
      <div className="relative flex items-center">
        {chosenPiece && (
          <Button
            className="absolute left-[-8px] -translate-x-full transform"
            onClick={() => handlePlayChosenPiece("left")}
          >
            left
          </Button>
        )}
        <Snake snake={snake} />
        {chosenPiece && (
          <Button
            className="absolute right-[-8px] translate-x-full transform"
            onClick={() => handlePlayChosenPiece("right")}
          >
            right
          </Button>
        )}
      </div>
      <Hand
        processedHand={processedHands[secondPlayer]}
        onPieceClick={
          turn == secondPlayer ? (piece) => handleClickPiece(piece) : undefined
        }
      />
    </div>
  );
}

export default DominoTable;
