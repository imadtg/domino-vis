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
} from "@/lib/features/domino/dominoSlice";
import {
  selectGameInfo,
  selectIsBlocked,
} from "@/lib/features/domino/dominoSlice";
import { getPlayableSides } from "@/lib/features/domino/dominoUtils";
import { USER } from "@/src/components/GameInitMenu";
import "../DominoAiMenu/dominoWasmStore";

export type Gamemode = "14/14" | "7/7";

export default function DominoPlayground() {
  // TODO: rename this to DominoGame as to not confuse it with the playground pages
  const [gamemode, setGamemode] = React.useState<Gamemode>();
  const gameStatus = useAppSelector(({ dominoGame }) => dominoGame.gameStatus);
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
              dispatch(pass());
            } else if (
              boneyard.count === 1 &&
              boneyard.pieces.length === 1 &&
              boneyard.pieces[0].presence === "certain"
            ) {
              // this means there is only one piece left in the boneyard, just perfect pick it (btw only the boneyard.pieces.length === 1 clause is necessary, the rest are just a sanity check)
              dispatch(perfectPick(boneyard.pieces[0].piece));
            } else if (
              boneyard.pieces.every(
                ({ piece }) => getPlayableSides(snake, piece).length === 0,
              ) &&
              (turn !== USER ||
                boneyard.pieces.every(({ presence }) => presence === "certain")) // this is a guard safe so that we dont pick the entirety of the boneyard before knowing what is in it in the turn of the user
            ) {
              dispatch(imperfectPick(boneyard.count));
            }
          }
        },
      }),
    );
    return unsubscribe;
  }, [dispatch]);
  return (
    <div className="grid h-dvh place-items-center p-[16px] lg:p-[32px]">
      {!gamemode ? (
        <div className="flex gap-2">
          <p>Choose mode: </p>
          <Button onClick={() => setGamemode("14/14")}>14 vs 14</Button>
          <Button onClick={() => setGamemode("7/7")}>7 vs 7</Button>
        </div>
      ) : gameStatus === "uninitialized" ? (
        <GameInitMenu gamemode={gamemode} />
      ) : (
        <>
          <DominoTable />
          <DominoAiMenu className="fixed bottom-0 right-[48px] top-0 my-auto h-1/2" />
        </>
      )}
    </div>
  );
}
