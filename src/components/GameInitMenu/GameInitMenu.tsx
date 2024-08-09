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
  const [initialGameInfo, setInitialGameInfo] = // TODO: move the temporary state into the domino slice.
    React.useState<DominoIngameInfo>({
      turn: 0,
      snake: [],
      hands: [[], []],
    });

  const player = 0;

  function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    if (
      initialGameInfo.hands[0].length + initialGameInfo.hands[1].length ===
      0
    ) {
      if (
        !window.confirm(
          "Not selecting any domino will give all the dominoes to one player, do you wish proceed?",
        )
      ) {
        return;
      }
    }
    dispatch(initialize(withSelectRest(initialGameInfo)));
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

  function withSelectRest(gameInfo: DominoIngameInfo) {
    // TODO: rewrite this.
    const dominoes = getAllDominoes();
    const remainingDominoes = dominoes.filter(
      (piece) =>
        !gameInfo.hands[player].some((handInOtherPiece) =>
          comparePieces(piece, handInOtherPiece),
        ),
    );
    return produce((oldGameInfo) => {
      oldGameInfo.hands[(player + 1) % 2] = remainingDominoes;
    })(gameInfo); // i wonder how produce doesn't break in the other overloads used in the codebase...
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-items-center gap-y-[16px] p-[8px]"
    >
      <fieldset className="grid grid-cols-4 grid-rows-7 gap-[16px] p-[1em] landscape:grid-cols-7 landscape:grid-rows-4">
        <legend className="absolute -translate-y-[100%] transform">
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
          return (
            <div key={pieceId} className="relative w-max focus-within:outline">
              <label htmlFor={pieceId}>
                <DominoBlock
                  piece={piece}
                  orientation="horizontal"
                  variant={
                    isTaken ? "greyed" : checked ? "chosen" : "default"
                  }
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
      <div className="flex basis-[48px] justify-between gap-[16px] px-[32px]">
        <Button type="button" onClick={handleRemoveAllSelection}>Remove all selection</Button>
        <Button>Initialize game</Button>
      </div>
    </form>
  );
}

export default GameInitMenu;
