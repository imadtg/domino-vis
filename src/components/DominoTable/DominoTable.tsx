"use client";
import * as React from "react";
import { produce } from "immer";

import {
  initialize,
  playMove,
  selectHand,
  selectSnake,
  selectStatus,
  selectTurn,
} from "@/lib/features/domino/dominoSlice";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  comparePieces,
  DominoIngameInfo,
  DominoPiece,
  Side,
  getAllDominoes,
  getPlayableSides,
} from "@/lib/features/domino/dominoUtils";
import clsx from "clsx";

import Snake from "@/src/components/Snake";
import Hand from "@/src/components/Hand";
import Button from "../Button";

export interface ProcessedDominoPiece {
  piece: DominoPiece;
  playable: boolean;
}

function DominoTable() {
  const dispatch = useAppDispatch();
  const turn = useAppSelector(selectTurn);
  const firstPlayerHand = useAppSelector((state) => selectHand(state, 0));
  const secondPlayerHand = useAppSelector((state) => selectHand(state, 1));
  const snake = useAppSelector(selectSnake);
  const [chosenPiece, setChosenPiece] = React.useState<DominoPiece>(); // this is used to store a piece that is playable on more than one side
  const processedFirstHand = firstPlayerHand?.map((piece: DominoPiece) => {
    const sides = getPlayableSides(snake, piece);
    return { piece, playable: sides?.length > 0 && turn === 0 };
  });
  const processedSecondHand = secondPlayerHand?.map((piece: DominoPiece) => {
    const sides = getPlayableSides(snake, piece);
    return { piece, playable: sides?.length > 0 && turn === 1 };
  });
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
        processedHand={processedFirstHand}
        onPieceClick={
          turn == 0 ? (piece) => handleClickPiece(piece) : undefined
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
        processedHand={processedSecondHand}
        onPieceClick={
          turn == 1 ? (piece) => handleClickPiece(piece) : undefined
        }
      />
    </div>
  );
}

export default DominoTable;
