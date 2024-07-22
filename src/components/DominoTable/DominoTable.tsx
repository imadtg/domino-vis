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
    <>
      <Hand
        hand={firstPlayerHand}
        onPieceClick={turn == 0 ? (piece) => setChosenPiece(piece) : undefined}
      />
      <Snake
        snake={snake}
        onSideClick={chosenPiece ? handlePlayChosenPiece : undefined}
      />
      <Hand
        hand={secondPlayerHand}
        onPieceClick={turn == 1 ? (piece) => setChosenPiece(piece) : undefined}
      />
    </>
  );
}

export default DominoTable;
