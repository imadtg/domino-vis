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
  getAllDominoes,
} from "@/lib/features/domino/dominoUtils";
import clsx from "clsx";

import Snake from "@/src/components/Snake";
import Hand from "@/src/components/Hand";

export interface ProcessedDominoPiece {
  piece: DominoPiece;
  playable: boolean;
}

type Side = "left" | "right";

function DominoTable() {
  const dispatch = useAppDispatch();
  const turn = useAppSelector(selectTurn);
  const firstPlayerHand = useAppSelector((state) => selectHand(state, 0));
  const secondPlayerHand = useAppSelector((state) => selectHand(state, 1));
  const snake = useAppSelector(selectSnake);
  const [chosenPiece, setChosenPiece] = React.useState<DominoPiece>();
  const processedFirstHand = firstPlayerHand?.map((piece) => {
    const sides = getPlayableSides(piece);
    return { piece, playable: sides?.length > 0 && turn === 0};
  });
  const processedSecondHand = secondPlayerHand?.map((piece) => {
    const sides = getPlayableSides(piece);
    return { piece, playable: sides?.length > 0 && turn === 1};
  });
  function getPlayableSides(piece: DominoPiece): Side[] {
    if (snake === undefined || snake.length === 0) {
      return ["left", "right"];
    }
    let sides = [];
    if (snake[0].left === piece.right || snake[0].left === piece.left) {
      sides.push("left");
    }
    if (
      snake.at(-1).right === piece.right ||
      snake.at(-1).right === piece.left
    ) {
      sides.push("right");
    }
    return sides;
  }
  function handlePlayChosenPiece(side: "left" | "right") {
    if (!chosenPiece) {
      return;
    }
    dispatch(playMove({ piece: chosenPiece, side }));
    setChosenPiece(undefined);
  }

  return (
    <div className="min-h-10 flex flex-col items-center flex-1 justify-between">
      <Hand
        processedHand={processedFirstHand}
        onPieceClick={turn == 0 ? (piece) => setChosenPiece(piece) : undefined}
      />
      <div className="relative">
        {chosenPiece && (
          <button
            className="absolute top-0 bottom-0 left-[-8px] transform -translate-x-full"
            onClick={() => handlePlayChosenPiece("left")}
          >
            left
          </button>
        )}
        <Snake snake={snake} />
        {chosenPiece && (
          <button
            className="absolute top-0 bottom-0 right-[-8px] transform translate-x-full"
            onClick={() => handlePlayChosenPiece("right")}
          >
            right
          </button>
        )}
      </div>
      <Hand
        processedHand = {
          processedSecondHand
        }
        onPieceClick={turn == 1 ? (piece) => setChosenPiece(piece) : undefined}
      />
    </div>
  );
}

export default DominoTable;
