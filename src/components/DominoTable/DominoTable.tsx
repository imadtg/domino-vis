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
  const [chosenPiece, setChosenPiece] = React.useState<DominoPiece>();
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

  return (
    <div className="flex h-full flex-col items-center justify-between">
      <Hand
        processedHand={processedFirstHand}
        onPieceClick={turn == 0 ? (piece) => setChosenPiece(piece) : undefined}
      />
      <div className="relative">
        {chosenPiece &&
          getPlayableSides(snake, chosenPiece).includes("left") && (
            <button
              className="absolute bottom-0 left-[-8px] top-0 -translate-x-full transform"
              onClick={() => handlePlayChosenPiece("left")}
            >
              left
            </button>
          )}
        <Snake snake={snake} />
        {chosenPiece &&
          getPlayableSides(snake, chosenPiece).includes("right") && (
            <button
              className="absolute bottom-0 right-[-8px] top-0 translate-x-full transform"
              onClick={() => handlePlayChosenPiece("right")}
            >
              right
            </button>
          )}
      </div>
      <Hand
        processedHand={processedSecondHand}
        onPieceClick={turn == 1 ? (piece) => setChosenPiece(piece) : undefined}
      />
    </div>
  );
}

export default DominoTable;
