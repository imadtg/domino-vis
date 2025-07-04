"use client";
import * as React from "react";

import DominoTable from "@/src/components/DominoTable";
import GameInitMenu from "@/src/components/GameInitMenu";
import DominoAiMenu from "@/src/components/DominoAiMenu";
import Button from "../Button";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { addAppListener } from "@/lib/listenerMiddleware";
import { isAnyOf } from "@reduxjs/toolkit";
import {
  playMove,
  pass,
  initialize,
  perfectPick,
  imperfectPick,
  selectIsOver,
} from "@/lib/features/domino/dominoSlice";
import {
  selectGameInfo,
  selectIsBlocked,
} from "@/lib/features/domino/dominoSlice";
import { getPlayableSides } from "@/lib/features/domino/dominoUtils";
import { USER } from "@/src/components/GameInitMenu";
import "../DominoAiMenu/dominoWasmStore";
import posthog from "posthog-js";
import GameOverMenu from "../GameOverMenu";

export type Gamemode = "14/14" | "7/7";

export default function DominoPlayground() {
  // TODO: rename this to DominoGame as to not confuse it with the playground pages
  const [gamemode, setGamemode] = React.useState<Gamemode>();
  const gameStatus = useAppSelector(({ dominoGame }) => dominoGame.gameStatus);
  const isOver = useAppSelector(selectIsOver);
  const dispatch = useAppDispatch();
  // TODO: make this autopass functionality a configurable ingame option, or atleast give enough feedback that a player has passed
  // After more thought, this is a good default because the purpose of this entire App is to be a GUI to a domino ai, not a multiplayer game, thats another rabbit hole (hint: P2P)
  // but visible feedback is still welcome...
  React.useEffect(() => {
    const unsubscribe = dispatch(
      addAppListener({
        matcher: isAnyOf(
          playMove,
          pass,
          initialize,
          perfectPick,
          imperfectPick,
        ),
        effect: async (action, listenerApi) => {
          const { dominoGame } = listenerApi.getState();
          const gameInfo = selectGameInfo.unwrapped(dominoGame);
          if (!gameInfo) {
            return;
          }
          const isBlocked = selectIsBlocked.unwrapped(dominoGame);
          const { turn, hands, snake, boneyard } = gameInfo;
          if (
            hands[turn].pieces.every(
              ({ piece }) => getPlayableSides(snake, piece).length === 0,
            ) &&
            !isBlocked
          ) {
            if (boneyard.count === 0) {
              posthog.capture("auto-pass happened", {
                gameInfoBefore: gameInfo,
              });
              dispatch(pass());
            } else if (
              boneyard.count === 1 &&
              boneyard.pieces.length === 1 &&
              boneyard.pieces[0].presence === "certain"
            ) {
              // this means there is only one piece left in the boneyard, just perfect pick it (btw only the boneyard.pieces.length === 1 clause is necessary, the rest are just a sanity check)
              posthog.capture("auto-perfect-pick happened", {
                gameInfoBefore: gameInfo,
                piece: boneyard.pieces[0].piece,
              });
              dispatch(perfectPick(boneyard.pieces[0].piece));
            } else if (
              boneyard.pieces.every(
                ({ piece }) => getPlayableSides(snake, piece).length === 0,
              ) &&
              (turn !== USER ||
                boneyard.pieces.every(({ presence }) => presence === "certain")) // this is a guard safe so that we dont pick the entirety of the boneyard before knowing what is in it in the turn of the user
            ) {
              posthog.capture("auto-imperfect-pick happened", {
                gameInfoBefore: gameInfo,
                amount: boneyard.count,
              });
              dispatch(imperfectPick(boneyard.count));
            }
          }
        },
      }),
    );
    return unsubscribe;
  }, [dispatch]);
  const gameInfo = useAppSelector(selectGameInfo);
  let showAIMenu = false;
  if (typeof gameInfo !== "undefined") {
    const { turn, hands, snake } = gameInfo;
    // TODO: detect when there is only one playable move and hide the AI Menu then since it is forced
    // this would involve also detecting equivalent moves, like when the snake sides have the same pip numbers, playing a piece on the left is equivalent to the right
    // it should then be treated as only one move, also detect when there are two distinct moves with one piece, for when the snake side pip numbers are the same as the piece's pip numbers
    showAIMenu =
      turn === USER &&
      hands[turn].pieces.filter(
        ({ piece }) => getPlayableSides(snake, piece).length > 0,
      ).length > 0; // only show the AI menu for the USER and when they can play a move
  }
  return (
    <div className="grid h-dvh place-items-center p-[16px] lg:p-[32px]">
      {!gamemode ? (
        <div className="flex gap-2">
          <p>Choose mode: </p>
          <Button
            onClick={() => {
              posthog.capture("gamemode set", { gamemode: "14 vs 14" });
              setGamemode("14/14");
            }}
          >
            14 vs 14
          </Button>
          <Button
            onClick={() => {
              posthog.capture("gamemode set", {
                gamemode: "7 vs 7 + boneyard",
              });
              setGamemode("7/7");
            }}
          >
            7 vs 7 + boneyard
          </Button>
        </div>
      ) : gameStatus === "uninitialized" ? (
        <GameInitMenu gamemode={gamemode} />
      ) : (
        <>
          <DominoTable />
          {isOver && (
            <GameOverMenu
              className="fixed bottom-0 left-[48px] top-0 my-auto h-1/2"
              onReset={() => setGamemode(undefined)}
            />
          )}
          {/* we hide the menu while still rendering it to preserve depth of search across turns */}
          <DominoAiMenu
            className={
              showAIMenu
                ? "fixed bottom-0 right-[48px] top-0 my-auto h-1/2"
                : "hidden"
            }
          />
        </>
      )}
    </div>
  );
}
