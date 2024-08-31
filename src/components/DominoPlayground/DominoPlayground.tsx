"use client";
import * as React from "react";

import DominoTable from "@/src/components/DominoTable";
import GameInitMenu from "@/src/components/GameInitMenu";
import DominoAiMenu from "@/src/components/DominoAiMenu";
import Button from "../Button";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { addAppListener } from "@/lib/listenerMiddleware";
import { isAnyOf } from "@reduxjs/toolkit";
import { playMove, pass, initialize } from "@/lib/features/domino/dominoSlice";
import {
  selectGameInfo,
  selectIsBlocked,
} from "@/lib/features/domino/dominoSlice";
import { getPlayableSides } from "@/lib/features/domino/dominoUtils";

export type Gamemode = "14/14" | "7/7";

export default function DominoPlayground() {
  const [gamemode, setGamemode] = React.useState<Gamemode>();
  const gameStatus = useAppSelector(({ dominoGame }) => dominoGame.gameStatus);
  const dispatch = useAppDispatch();
  // TODOD: make this autopass functionality a configurable ingame option
  React.useEffect(() => {
    const unsubscribe = dispatch(
      addAppListener({
        matcher: isAnyOf(playMove, pass, initialize),
        effect: async (action, listenerApi) => {
          const { dominoGame } = listenerApi.getState();
          const gameInfo = selectGameInfo.unwrapped(dominoGame);
          if (!gameInfo) {
            return;
          }
          const isBlocked = selectIsBlocked.unwrapped(dominoGame);
          const { turn, hands, snake } = gameInfo;
          if (
            hands[turn].pieces.every(
              ({ piece }) => getPlayableSides(snake, piece).length === 0,
            ) &&
            !isBlocked
          ) {
            dispatch(pass());
          }
        },
      }),
    );
    return unsubscribe;
  });
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
          {/*<DominoAiMenu className="fixed bottom-0 right-[48px] top-0 my-auto h-1/2" />*/}
        </>
      )}
    </div>
  );
}
