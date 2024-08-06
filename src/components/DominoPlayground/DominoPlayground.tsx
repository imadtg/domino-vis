"use client";
import * as React from "react";

import DominoTable from "@/src/components/DominoTable";
import GameInitMenu from "@/src/components/GameInitMenu";
import DominoAiMenu from "@/src/components/DominoAiMenu";
import { LayoutGroup } from "framer-motion";
import { useAppSelector } from "@/lib/hooks";

export default function DominoPlayground() {
  const gameStatus = useAppSelector(({ dominoGame }) => dominoGame.gameStatus);
  return (
    <LayoutGroup>
      <div className="grid h-screen place-items-center p-[32px]">
        {gameStatus === "uninitialized" ? (
          <GameInitMenu />
        ) : (
          <>
            <DominoTable />
            {/*<DominoAiMenu className="fixed bottom-0 right-[48px] top-0 my-auto h-1/2" />*/}
          </>
        )}
      </div>
    </LayoutGroup>
  );
}
