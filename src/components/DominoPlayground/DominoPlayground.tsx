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
import {
  comparePieces,
  DominoIngameInfo,
  DominoPiece,
  getAllDominoes,
} from "@/lib/features/domino/dominoUtils";
import clsx from "clsx";

export default function DominoPlayground() {
  return (
    <div className="h-screen p-[64px] flex flex-col items-center justify-between gap-[32px]">
      <DominoTable />
      <GameInitMenu />
    </div>
  );
}

function GameInitMenu() {
  const dispatch = useAppDispatch();
  const [initialGameInfo, setInitialGameInfo] =
    React.useState<DominoIngameInfo>({
      turn: 0,
      snake: [],
      hands: [[], []],
    });

  const [player, setPlayer] = React.useState(0);

  function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    dispatch(initialize(initialGameInfo));
  }

  function handleCheck(event: React.SyntheticEvent, piece: DominoPiece) {
    if (event.target.checked) {
      if (
        initialGameInfo.hands[(player + 1) % 2].some((pieceOfHand) =>
          comparePieces(piece, pieceOfHand)
        )
      ) {
        window.alert("That piece is taken!");
        return;
      }
      setInitialGameInfo(
        produce((oldGameInfo) => {
          oldGameInfo.hands[player].push(piece);
        }, initialGameInfo)
      );
    } else {
      const index = initialGameInfo.hands[player].findIndex((pieceOfHand) =>
        comparePieces(piece, pieceOfHand)
      );
      setInitialGameInfo(
        produce((oldGameInfo) => {
          oldGameInfo.hands[player].splice(index, 1);
        }, initialGameInfo)
      );
    }
  }

  function handleRemoveAllSelection() {
    setInitialGameInfo(
      produce((oldGameInfo) => {
        oldGameInfo.hands = [[], []];
      }, initialGameInfo)
    );
  }

  function handleRemoveSelection() {
    setInitialGameInfo(
      produce((oldGameInfo) => {
        oldGameInfo.hands[player] = [];
      }, initialGameInfo)
    );
  }

  function handleSelectAll() {
    const dominoes = getAllDominoes();
    const remainingDominoes = dominoes.filter(
      (piece) =>
        !initialGameInfo.hands[(player + 1) % 2].some((handInOtherPiece) =>
          comparePieces(piece, handInOtherPiece)
        )
    );
    remainingDominoes.forEach(({ left, right }) => {
      console.log(`piece [${left}|${right}] is not present in the other hand`);
    });
    setInitialGameInfo(
      produce((oldGameInfo) => {
        oldGameInfo.hands[player] = remainingDominoes;
      }, initialGameInfo)
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="grid justify-items-center gap-y-[16px]"
      >
        <fieldset className="grid grid-cols-7 grid-rows-4 gap-[16px]">
          <legend className="absolute transform -translate-y-[120%] -translate-x-1/2">
            Choose dominoes for the {player === 0 ? "first" : "second"} player:
          </legend>
          {getAllDominoes().map((piece) => {
            const pieceId = `${piece.left}-${piece.right}`;
            const checked = initialGameInfo.hands[player].some((pieceOfHand) =>
              comparePieces(piece, pieceOfHand)
            );
            const isTaken = initialGameInfo.hands[(player + 1) % 2].some(
              (pieceOfHand) => comparePieces(piece, pieceOfHand)
            );
            const className = isTaken
              ? "bg-gray-800 text-white"
              : checked
                ? "bg-yellow-300"
                : "";
            return (
              <div key={pieceId} className="relative">
                <label htmlFor={pieceId}>
                  <DominoBlock piece={piece} className={className} />
                </label>
                <input
                  id={pieceId}
                  className="absolute inset-0 invisible"
                  type="checkbox"
                  value={`${piece.left}-${piece.right}`}
                  checked={checked}
                  onChange={(event) => handleCheck(event, piece)}
                />
              </div>
            );
          })}
        </fieldset>
        <div className="flex justify-between px-[8px] gap-[16px]">
          <Button type="button" onClick={() => setPlayer((player + 1) % 2)}>
            Switch player
          </Button>
          {initialGameInfo.hands[0].length + initialGameInfo.hands[1].length ===
          28 ? (
            <Button onClick={handleRemoveSelection} type="button">
              Remove {player === 0 ? "first" : "second"} player's selection
            </Button>
          ) : (
            <Button onClick={handleSelectAll} type="button">
              Select the rest for the {player === 0 ? "first" : "second"} player
            </Button>
          )}
          <Button onClick={handleRemoveAllSelection}>
            Remove all selection
          </Button>
          <Button>Initialize game</Button>
        </div>
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
  return (
    <div className="h-[64px] flex items-center gap-[8px]">
      {hand?.map((piece) => (
        <DominoBlock
          as={onPieceClick ? "button" : "div"}
          key={`${piece.left}-${piece.right}`}
          onClick={() => onPieceClick?.(piece)}
          piece={piece}
        />
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
  return (
    <div className="h-[64px] flex items-center gap-[8px]">
      {onSideClick && <button onClick={() => onSideClick("left")}>left</button>}
      {snake?.map((piece) => (
        <DominoBlock
          as={onPieceClick ? "button" : "div"}
          key={`${piece.left}-${piece.right}`}
          onClick={() => onPieceClick?.(piece)}
          piece={piece}
        />
      ))}
      {onSideClick && (
        <button onClick={() => onSideClick("right")}>right</button>
      )}
    </div>
  );
}

function DominoBlock({ piece, as: Tag = "div", className = "", ...delegated }) {
  return (
    <Tag
      className={clsx(
        "p-[8px] border-black border rounded-lg grid place-content-center",
        className
      )}
      {...delegated}
    >
      [{piece.left}|{piece.right}]
    </Tag>
  );
}

function Button({ className, ...delegated }) {
  return (
    <button
      className={clsx("p-[4px] bg-gray-300 rounded-sm", className)}
      {...delegated}
    />
  );
}
