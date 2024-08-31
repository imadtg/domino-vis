"use client";
import * as React from "react";

import {
  pass,
  playMove,
  selectGameInfo,
  selectIsBlocked,
} from "@/lib/features/domino/dominoSlice";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  DominoPiece,
  DominoPiecePresence,
  getPlayableSides,
} from "@/lib/features/domino/dominoUtils";

import Snake from "@/src/components/Snake";
import Hand from "@/src/components/Hand";

function DominoTable() {
  const dispatch = useAppDispatch();
  const gameInfo = useAppSelector(selectGameInfo);
  // TODO: add passing UI and endgame UI
  const isBlocked = useAppSelector(selectIsBlocked);
  const [chosenPiece, setChosenPiece] = React.useState<DominoPiece>(); // this is used to store a piece that is playable on more than one side

  if (typeof gameInfo === "undefined") {
    return;
  }

  const { turn, hands, snake } = gameInfo;

  const firstPlayer = 0;
  const secondPlayer = 1;

  function handlePlayChosenPiece(side: "left" | "right") {
    if (!chosenPiece) {
      return;
    }
    dispatch(playMove({ piece: chosenPiece, side }));
    setChosenPiece(undefined);
  }

  function handleClickPiece(piece: DominoPiece) {
    // TODO: check if the piece is in the hand of the player whose turn it is.
    setChosenPiece(undefined);
    if (snake.length === 0 || snake.length === 1 && snake[0].left === snake[0].right) {
      // first move is played automatically
      // the move on a first double is also automatic, until i get a better playing UI...
      dispatch(playMove({ piece, side: "right" })); // choosing right arbitrarily since it doesn't matter.
      return;
    }
    const sides = getPlayableSides(snake, piece);
    if (sides.length === 0) {
      // this should be an impossible state
      debugger; // TODO: remove this or remove branch.
      return;
    }
    if (sides.length > 1) {
      setChosenPiece(piece);
      return;
    }
    // automatically play domino if there is only one side for it to be played in
    dispatch(playMove({ piece, side: sides[0] }));
  }

  return (
    <div className="grid grid-rows-[auto_1fr_auto] grid-cols-1 h-full items-center">
      <Hand
        hand={hands[firstPlayer]}
        onPieceClick={(piece) =>
          turn == firstPlayer && getPlayableSides(snake, piece).length > 0
            ? () => handleClickPiece(piece)
            : undefined
        }
      />
      <div className="relative w-screen flex-1 px-16 outline outline-offset-4 outline-pink-400">
        <Snake
          snake={snake}
          onSideClick={chosenPiece ? handlePlayChosenPiece : undefined}
        />
      </div>
      <Hand
        hand={hands[secondPlayer]}
        onPieceClick={(piece) =>
          turn == secondPlayer && getPlayableSides(snake, piece).length > 0
            ? () => handleClickPiece(piece)
            : undefined
        }
      />
    </div>
  );
}

export default DominoTable;
