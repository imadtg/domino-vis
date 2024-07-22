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

function DominoTable() {
  const dispatch = useAppDispatch();
  const turn = useAppSelector(selectTurn);
  const firstPlayerHand = useAppSelector((state) => selectHand(state, 0));
  const secondPlayerHand = useAppSelector((state) => selectHand(state, 1));
  const snake = useAppSelector(selectSnake);
  const [chosenPiece, setChosenPiece] = React.useState<DominoPiece>();
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
        hand={firstPlayerHand}
        onPieceClick={turn == 0 ? (piece) => setChosenPiece(piece) : undefined}
      />
      <div className="relative">
        {chosenPiece && (
          <button className="absolute top-0 bottom-0 left-[-8px] transform -translate-x-full" onClick={() => handlePlayChosenPiece("left")}>left</button>
        )}
        <Snake
          snake={snake}
        />
        {chosenPiece && (
          <button className="absolute top-0 bottom-0 right-[-8px] transform translate-x-full" onClick={() => handlePlayChosenPiece("right")}>right</button>
        )}
      </div>
      <Hand
        hand={secondPlayerHand}
        onPieceClick={turn == 1 ? (piece) => setChosenPiece(piece) : undefined}
      />
    </div>
  );
}

export default DominoTable;
