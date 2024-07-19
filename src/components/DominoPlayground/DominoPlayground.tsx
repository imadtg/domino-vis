"use client";

import React from "react";
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
import { DominoPiece, getAllDominoes } from "@/lib/features/domino/dominoUtils";

export default function DominoPlayground() {
  return (
    <div className="h-screen p-[32px] flex flex-col items-center justify-between gap-[32px]">
      <DominoTable />
      <GameInitMenu />
    </div>
  );
}

function GameInitMenu() {
  const dispatch = useAppDispatch();
  const [initialGameInfo, setInitialGameInfo] = React.useState({
    turn: 0,
    snake: [],
    hands: [
      [
        { left: 0, right: 0 },
        { left: 6, right: 6 },
      ],
      [
        { left: 1, right: 5 },
        { left: 4, right: 2 },
      ],
    ],
  });

  function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    dispatch(initialize(initialGameInfo));
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <fieldset className="grid grid-cols-7 grid-rows-4 gap-4">
          {getAllDominoes().map((piece) => (
            <div key={`${piece.left}-${piece.right}`}>
              [{piece.left}|{piece.right}]
            </div>
          ))}
        </fieldset>
        <button>Initialize!</button>
      </form>
    </>
  );
}

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

function Hand({
  hand,
  onPieceClick,
}: {
  hand?: DominoPiece[];
  onPieceClick?: (piece: DominoPiece) => void;
}) {
  const PieceTag = onPieceClick ? "button" : "div";
  return (
    <div className="h-[64px] flex items-center gap-[8px]">
      {hand?.map((piece) => (
        <PieceTag
          className="p-[8px] bg-green-600"
          key={`${piece.left}-${piece.right}`}
          onClick={() => onPieceClick?.(piece)}
        >
          [{piece.left}|{piece.right}]
        </PieceTag>
      ))}
    </div>
  );
}
function Snake({
  snake,
  onPieceClick,
  onSideClick,
}: {
  snake?: DominoPiece[];
  onPieceClick?: (piece: DominoPiece) => void;
  onSideClick?: (side: "left" | "right") => void;
}) {
  const PieceTag = onPieceClick ? "button" : "div";
  return (
    <div className="h-[64px] flex items-center gap-[8px]">
      {onSideClick && <button onClick={() => onSideClick("left")}>left</button>}
      {snake?.map((piece) => (
        <PieceTag
          className="p-[8px] bg-green-600"
          key={`${piece.left}-${piece.right}`}
          onClick={() => onPieceClick?.(piece)}
        >
          [{piece.left}|{piece.right}]
        </PieceTag>
      ))}
      {onSideClick && (
        <button onClick={() => onSideClick("right")}>right</button>
      )}
    </div>
  );
}
