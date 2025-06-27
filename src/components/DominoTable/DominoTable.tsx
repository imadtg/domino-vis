"use client";
import * as React from "react";

import {
  imperfectPick,
  pass,
  perfectPick,
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
import Button from "../Button";

function DominoTable() {
  const dispatch = useAppDispatch();
  const gameInfo = useAppSelector(selectGameInfo);
  // TODO: add passing UI and endgame UI
  const isBlocked = useAppSelector(selectIsBlocked);
  const [chosenPiece, setChosenPiece] = React.useState<DominoPiece>(); // this is used to store a piece that is playable on more than one side
  const [boneyardIsShown, setBoneyardIsShown] = React.useState<boolean>(false);
  const [imperfectPickAmount, setImperfectPickAmount] =
    React.useState<number>(0); // TODO: move these and their form into another component
  const id = React.useId();

  if (typeof gameInfo === "undefined") {
    return;
  }

  const { turn, hands, snake, boneyard } = gameInfo;

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
    if (
      snake.length === 0 ||
      (snake.length === 1 && snake[0].left === snake[0].right)
    ) {
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
    // TODO: allow for the player to choose this side somehow to have the same orientation as the board IRL, perhaps through detecting whether the player clicks on the right or left of the piece using raw click event data
    // but for this to be consistent, we should inflate clickboxes, and have adequate feedback that the side on which you click matters
    dispatch(playMove({ piece, side: sides[0] })); 
  }

  function handlePerfectPick(piece: DominoPiece) {
    dispatch(perfectPick(piece));
  }

  // TODO: have a better UX guide on what imperfect picks are and how they should be done? this can be done in person for now...
  // TODO: fix all remaining any types in the codebase
  function handleImperfectPickSubmit(event: any) {
    event.preventDefault();
    dispatch(imperfectPick(imperfectPickAmount));
    setImperfectPickAmount(0);
  }

  return (
    <div className="relative flex h-full flex-col items-center">
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
      <Button
        className="absolute left-0"
        onClick={() => setBoneyardIsShown(!boneyardIsShown)}
      >
        toggle boneyard
      </Button>
      {boneyardIsShown && (
        <div className="absolute inset-20 grid place-content-center gap-4">
          <Hand
            hand={boneyard}
            onPieceClick={(piece) => () => handlePerfectPick(piece)}
          />
          <form onSubmit={handleImperfectPickSubmit}>
            <fieldset className="flex flex-col gap-[8px] p-[8px]">
              <legend>
                Unrevealed Dominoes Picker (does not include the last one that
                is to be played){" "}
                {/* TODO: have a better explanation of what this is... */}
              </legend>
              <label htmlFor={`${id}-depth`}>
                Amount of unrevealed dominoes picked
              </label>
              <input
                id={`${id}-depth`}
                type="text"
                value={imperfectPickAmount}
                onChange={(event) =>
                  setImperfectPickAmount(parseInt(event.target.value))
                }
                placeholder="3"
                pattern="[1-9][0-9]*"
              />
              <Button>Imperfect pick</Button>
            </fieldset>
          </form>
        </div>
      )}
    </div>
  );
}

export default DominoTable;
