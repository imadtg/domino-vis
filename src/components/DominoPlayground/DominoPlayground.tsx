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
import styles from "./DominoPlayground.module.css";
import { DominoPiece } from "@/lib/features/domino/dominoUtils";

export default function DominoPlayground() {
  const dispatch = useAppDispatch();
  const [left, setLeft] = React.useState("");
  const [right, setRight] = React.useState("");
  const [player, setPlayer] = React.useState("");
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

  function handleSubmitPiece(event: React.SyntheticEvent) {
    event.preventDefault();
    setInitialGameInfo(
      produce((oldGameInfo) => {
        oldGameInfo.hands[parseInt(player)].push({
          left: parseInt(left),
          right: parseInt(right),
        });
      }, initialGameInfo)
    );
  }

  return (
    <div>
      <div className={styles.playGround}>
        <DominoTable />
      </div>
      <form onSubmit={handleSubmitPiece}>
        <label>
          left of pip:
          <input
            value={left}
            onChange={(event) => setLeft(event.target.value)}
          />
        </label>
        <label>
          right of pip:
          <input
            value={right}
            onChange={(event) => setRight(event.target.value)}
          />
        </label>
        <label>
          player of pip:
          <input
            value={player}
            onChange={(event) => setPlayer(event.target.value)}
          />
        </label>
        <button>Add piece!</button>
      </form>
      <button onClick={() => dispatch(initialize(initialGameInfo))}>
        Initialize!
      </button>
    </div>
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
    <div className={styles.hand}>
      {hand?.map((piece) => (
        <PieceTag
          className={styles.dominoPiece}
          key={`${piece.left}-${piece.right}`}
          onClick={() => onPieceClick?.(piece)}
        >{`[${piece.left}|${piece.right}]`}</PieceTag>
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
    <div className={styles.snake}>
      {onSideClick && <button onClick={() => onSideClick("left")}>left</button>}
      {snake?.map((piece) => (
        <PieceTag
          className={styles.dominoPiece}
          key={`${piece.left}-${piece.right}`}
          onClick={() => onPieceClick?.(piece)}
        >{`[${piece.left}|${piece.right}]`}</PieceTag>
      ))}
      {onSideClick && (
        <button onClick={() => onSideClick("right")}>right</button>
      )}
    </div>
  );
}
