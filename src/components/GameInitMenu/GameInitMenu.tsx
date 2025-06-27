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
import { Gamemode } from "../DominoPlayground";

interface GameInitMenuProps {
  gamemode: Gamemode;
}

const INITIAL_GAME_INFO: Record<Gamemode, DominoIngameInfo> = {
  "7/7": {
    turn: 0,
    snake: [],
    hands: [
      { pieces: [], count: 7 },
      { pieces: [], count: 7 },
    ],
    boneyard: { pieces: [], count: 14 },
  },
  "14/14": {
    turn: 0,
    snake: [],
    hands: [
      { pieces: [], count: 14 },
      { pieces: [], count: 14 },
    ],
    boneyard: { pieces: [], count: 0 },
  },
};

const PLAYER = 1; // the ID of the player using the GUI against the opponent, the goal of this entire GUI being an AI assistant to this player

function GameInitMenu({ gamemode }: GameInitMenuProps) {
  const dispatch = useAppDispatch();
  const id = React.useId();
  const [initialGameInfo, setInitialGameInfo] = // TODO: move the temporary state into the domino slice.
    React.useState<DominoIngameInfo>(INITIAL_GAME_INFO[gamemode]);

  function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    if (
      initialGameInfo.hands[PLAYER].pieces.length !==
      initialGameInfo.hands[PLAYER].count
    ) {
      window.alert(
        `Please select ${initialGameInfo.hands[PLAYER].count} domino pieces!
        (You selected only ${initialGameInfo.hands[PLAYER].pieces.length}!)`,
      );
      return;
    }

    dispatch(initialize(withSelectRest(initialGameInfo)));
  }

  function handleCheck(
    event: React.FormEvent<HTMLInputElement>,
    piece: DominoPiece,
  ) {
    if (event.currentTarget.checked) {
      if (
        initialGameInfo.hands[PLAYER].pieces.length >=
        initialGameInfo.hands[PLAYER].count
      ) {
        window.alert(
          `You can't select more than ${initialGameInfo.hands[PLAYER].count} domino pieces!
          (Unselect another domino piece then try again!)`,
        );
        return;
      }
      setInitialGameInfo(
        produce(initialGameInfo, (oldGameInfo) => {
          oldGameInfo.hands[PLAYER].pieces.push({ piece, presence: "certain" });
        }),
      );
    } else {
      setInitialGameInfo(
        produce(initialGameInfo, (oldGameInfo) => {
          const piecesWithoutDeselected = oldGameInfo.hands[
            PLAYER
          ].pieces.filter(
            ({ piece: pieceOfHand }) => !comparePieces(piece, pieceOfHand),
          );
          oldGameInfo.hands[PLAYER].pieces = piecesWithoutDeselected;
        }),
      );
    }
  }

  function withSelectRest(gameInfo: DominoIngameInfo) {
    // spreads unselected dominoes on other hands.
    // TODO: rewrite this.
    const dominoes = getAllDominoes();
    const remainingDominoes = dominoes.filter(
      (piece) =>
        !gameInfo.hands[PLAYER].pieces.some(({ piece: selectedPiece }) =>
          comparePieces(piece, selectedPiece),
        ),
    );
    return produce(gameInfo, (oldGameInfo) => {
      const otherHands = [
        ...oldGameInfo.hands.filter((hand, index) => index !== PLAYER),
        oldGameInfo.boneyard,
      ];
      otherHands.forEach((hand) => {
        hand.pieces = remainingDominoes.map((piece) => ({
          piece: {...piece}, // make a shallow copy to differentiate pieces of different hands
          presence: "possible",
        }));
      });
      // Annotate pieces with their origins for animation purposes
      oldGameInfo.boneyard.pieces.forEach(
        ({ piece }) => (piece.origin = "boneyard"),
      );
      oldGameInfo.hands.forEach((hand, playerIndex) =>
        hand.pieces.forEach(({ piece }) => (piece.origin = playerIndex)),
      );
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-items-center gap-y-[16px] p-[8px]"
    >
      <fieldset className="flex flex-col justify-items-center gap-y-[16px]">
        <legend>
          Select {initialGameInfo.hands[PLAYER].count} domino pieces for your
          hand:
        </legend>
        <div className="grid grid-cols-4 grid-rows-7 gap-[16px] p-[1em] landscape:grid-cols-7 landscape:grid-rows-4">
          {getAllDominoes().map((piece) => {
            const pieceId = `${id}-${piece.left}-${piece.right}`;
            const checked = initialGameInfo.hands[PLAYER].pieces.some(
              ({ piece: pieceOfHand }) => comparePieces(piece, pieceOfHand),
            );
            return (
              <div
                key={pieceId}
                className="relative w-min focus-within:outline" // TODO: fix the tiny gaps between this wrapper and the DominoBlock
              >
                <label className="block" htmlFor={pieceId}>
                  <DominoBlock
                    piece={piece}
                    orientation="horizontal"
                    variant={checked ? "chosen" : "default"}
                  />
                </label>
                <input
                  id={pieceId}
                  className="absolute inset-0 block opacity-0"
                  type="checkbox"
                  value={`${piece.left}-${piece.right}`}
                  checked={checked}
                  onChange={(event) => handleCheck(event, piece)}
                />
              </div>
            );
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend>Select starting player:</legend>
        <label htmlFor={`${id}-${PLAYER}`}>You</label>
        <input
          id={`${id}-${PLAYER}`}
          type="radio"
          value={PLAYER}
          checked={initialGameInfo.turn === PLAYER}
          onChange={(event) => {
            setInitialGameInfo(
              produce(initialGameInfo, (oldGameInfo) => {
                oldGameInfo.turn = parseInt(event.target.value);
              }),
            );
          }}
        />
        <label htmlFor={`${id}-${(PLAYER + 1) % 2}`}>Opponent</label>
        <input
          id={`${id}-${(PLAYER + 1) % 2}`}
          type="radio"
          value={(PLAYER + 1) % 2}
          checked={initialGameInfo.turn === (PLAYER + 1) % 2}
          onChange={(event) => {
            setInitialGameInfo(
              produce(initialGameInfo, (oldGameInfo) => {
                oldGameInfo.turn = parseInt(event.target.value);
              }),
            );
          }}
        />
      </fieldset>
      <div className="flex basis-[48px] justify-center px-[32px]">
        <Button>Start game</Button>
      </div>
    </form>
  );
}

export default GameInitMenu;
