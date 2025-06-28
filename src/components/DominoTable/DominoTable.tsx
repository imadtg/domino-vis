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
import { USER } from "../GameInitMenu";

function DominoTable() {
  const dispatch = useAppDispatch();
  const gameInfo = useAppSelector(selectGameInfo);
  // TODO: add passing UI and endgame UI
  const [chosenPiece, setChosenPiece] = React.useState<DominoPiece>(); // this is used to store a piece that is playable on more than one side
  const [boneyardIsShown, setBoneyardIsShown] = React.useState<boolean>(false);

  if (typeof gameInfo === "undefined") {
    return;
  }

  const { turn, hands, snake, boneyard } = gameInfo;

  const OPPONENT = (USER + 1) % 2; // hardcoded for two players for now

  const boneyardIsPickable = boneyard.count > 0;

  const canPickFromBoneyard =
    boneyardIsPickable &&
    !hands[turn].pieces.some(
      ({ piece, presence }) =>
        presence === "certain" && getPlayableSides(snake, piece).length > 0,
    );

  const mustPickFromBoneyard =
    boneyardIsPickable &&
    hands[turn].pieces.every(
      ({ piece }) => getPlayableSides(snake, piece).length === 0,
    );

  function handlePlayChosenPiece(side: "left" | "right") {
    if (!chosenPiece) {
      return;
    }
    dispatch(playMove({ piece: chosenPiece, side }));
    setChosenPiece(undefined);
  }

  function handleClickPiece(piece: DominoPiece) {
    setBoneyardIsShown(false); // upon clicking a piece, hide the boneyard
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

  return (
    <div className="relative flex h-full flex-col items-center">
      <Hand
        hand={hands[OPPONENT]}
        onPieceClick={(piece) =>
          turn == OPPONENT && getPlayableSides(snake, piece).length > 0
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
        hand={hands[USER]}
        onPieceClick={(piece) =>
          turn == USER && getPlayableSides(snake, piece).length > 0
            ? () => handleClickPiece(piece)
            : undefined
        }
      />
      {canPickFromBoneyard && (
        <>
          {!mustPickFromBoneyard && (
            <Button
              className="absolute left-0"
              onClick={() => setBoneyardIsShown(!boneyardIsShown)}
            >
              toggle boneyard
            </Button>
          )}
          {(boneyardIsShown || mustPickFromBoneyard) && (
            <div className="absolute inset-20 grid place-content-center gap-4">
              <Boneyard
                key={
                  `turn-${turn}` /* this is so that state variables get reset when passing the turn (relevant for the hasImperfectPicked state variable) */
                }
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// TODO: move this and ImperfectPicker into their own component files
function Boneyard() {
  // we will assume this is only rendered when the player can actually pick from the boneyard
  const dispatch = useAppDispatch();
  const gameInfo = useAppSelector(selectGameInfo);
  const [hasImperfectPicked, setHasImperfectPicked] =
    React.useState<boolean>(false); // this will get reset by the change of key in DominoTable

  if (typeof gameInfo === "undefined") {
    return;
  }

  const { turn, snake, boneyard } = gameInfo;

  const canImperfectPick = boneyard.pieces.some(
    ({ piece }) => getPlayableSides(snake, piece).length === 0,
  );

  function handlePerfectPick(piece: DominoPiece) {
    dispatch(perfectPick(piece));
  }

  function handleImperfectPick(amount: number) {
    dispatch(imperfectPick(amount));
    setHasImperfectPicked(true);
  }

  return turn !== USER && canImperfectPick && !hasImperfectPicked ? (
    <ImperfectPicker onImperfectPick={handleImperfectPick} />
  ) : (
    <Hand
      hand={boneyard}
      onPieceClick={(piece) => () => handlePerfectPick(piece)}
    />
  );
}

interface ImperfectPickerProps {
  onImperfectPick: (amount: number) => void;
}

function ImperfectPicker({ onImperfectPick }: ImperfectPickerProps) {
  // we will assume this is only rendered when the player can actually do imperfect picks
  const [imperfectPickAmount, setImperfectPickAmount] =
    React.useState<number>(0);
  const id = React.useId();

  // TODO: have a better UX guide on what imperfect picks are and how they should be done? this can be done in person for now...
  // TODO: fix all remaining any types in the codebase
  function handleImperfectPickSubmit(event: any) {
    event.preventDefault();
    onImperfectPick(imperfectPickAmount);
    setImperfectPickAmount(0);
  }

  return (
    <form className="w-fit" onSubmit={handleImperfectPickSubmit}>
      <fieldset className="flex flex-col gap-[8px] p-[8px]">
        <legend>
          Unrevealed Dominoes Picker (does not include the last one that is to
          be played) {/* TODO: have a better explanation of what this is... */}
        </legend>
        <label htmlFor={`${id}-imperfect-pick`}>
          Amount of unrevealed dominoes picked
        </label>
        <input
          id={`${id}-imperfect-pick`}
          type="number"
          value={imperfectPickAmount}
          onChange={(event) =>
            setImperfectPickAmount(parseInt(event.target.value))
          }
          required={true}
          min="1"
        />
        <Button>Imperfect pick</Button>
      </fieldset>
    </form>
  );
}

export default DominoTable;
