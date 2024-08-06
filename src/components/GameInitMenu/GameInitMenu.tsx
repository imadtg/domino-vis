"use client";
import * as React from "react";
import { produce } from "immer";

import { initialize } from "@/lib/features/domino/dominoSlice";

import { useAppDispatch } from "@/lib/hooks";
import {
  comparePieces,
  DominoIngameInfo,
  DominoPiece,
  getAllDominoes,
} from "@/lib/features/domino/dominoUtils";
import DominoBlock from "../DominoBlock";
import Button from "../Button";

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
    event.preventDefault(); /* @ts-ignore */
    dispatch(initialize(initialGameInfo));
  }

  function handleCheck(event: React.SyntheticEvent, piece: DominoPiece) {
    if ((event.target as HTMLInputElement).checked) {
      if (
        initialGameInfo.hands[(player + 1) % 2].some((pieceOfHand) =>
          comparePieces(piece, pieceOfHand),
        )
      ) {
        window.alert("That piece is taken!");
        return;
      }
      setInitialGameInfo(
        produce((oldGameInfo) => {
          oldGameInfo.hands[player].push(piece);
        }, initialGameInfo),
      );
    } else {
      const index = initialGameInfo.hands[player].findIndex((pieceOfHand) =>
        comparePieces(piece, pieceOfHand),
      );
      setInitialGameInfo(
        produce((oldGameInfo) => {
          oldGameInfo.hands[player].splice(index, 1);
        }, initialGameInfo),
      );
    }
  }

  function handleRemoveAllSelection() {
    setInitialGameInfo(
      produce((oldGameInfo) => {
        oldGameInfo.hands = [[], []];
      }, initialGameInfo),
    );
  }

  function handleRemoveSelection() {
    setInitialGameInfo(
      produce((oldGameInfo) => {
        oldGameInfo.hands[player] = [];
      }, initialGameInfo),
    );
  }

  function handleSelectAll() {
    const dominoes = getAllDominoes();
    const remainingDominoes = dominoes.filter(
      (piece) =>
        !initialGameInfo.hands[(player + 1) % 2].some((handInOtherPiece) =>
          comparePieces(piece, handInOtherPiece),
        ),
    );
    setInitialGameInfo(
      produce((oldGameInfo) => {
        oldGameInfo.hands[player] = remainingDominoes;
      }, initialGameInfo),
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="grid justify-items-center gap-y-[16px] p-[8px]"
      >
        <fieldset className="grid grid-cols-7 grid-rows-4 gap-[16px]">
          <legend className="absolute -translate-x-1/2 -translate-y-[120%] transform">
            Choose dominoes for the {player === 0 ? "first" : "second"} player:
          </legend>
          {getAllDominoes().map((piece) => {
            const pieceId = `${piece.left}-${piece.right}`;
            const checked = initialGameInfo.hands[player].some((pieceOfHand) =>
              comparePieces(piece, pieceOfHand),
            );
            const isTaken = initialGameInfo.hands[(player + 1) % 2].some(
              (pieceOfHand) => comparePieces(piece, pieceOfHand),
            );
            const className = isTaken
              ? "bg-gray-800 text-white"
              : checked
                ? "bg-yellow-300"
                : "";
            return (
              <div
                key={pieceId}
                className="relative w-[128px] focus-within:outline"
              >
                <label htmlFor={pieceId}>
                  <DominoBlock
                    piece={piece}
                    className={className}
                    orientation="horizontal"
                  />
                </label>
                <input
                  id={pieceId}
                  className="absolute inset-0 opacity-0"
                  type="checkbox"
                  value={`${piece.left}-${piece.right}`}
                  checked={checked}
                  onChange={(event) => handleCheck(event, piece)}
                />
              </div>
            );
          })}
        </fieldset>
        <div className="flex justify-between gap-[16px] px-[8px]">
          <Button type="button" onClick={() => setPlayer((player + 1) % 2)}>
            Switch player
          </Button>
          {initialGameInfo.hands[0].length + initialGameInfo.hands[1].length ===
          28 ? (
            <Button onClick={handleRemoveSelection} type="button">
              Remove current player selection
            </Button>
          ) : (
            <Button onClick={handleSelectAll} type="button">
              Select the rest
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

export default GameInitMenu;
