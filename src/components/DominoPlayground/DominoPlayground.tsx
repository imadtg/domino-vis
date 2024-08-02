"use client";
import * as React from "react";

import DominoTable from "@/src/components/DominoTable";
import GameInitMenu from "@/src/components/GameInitMenu";
import DominoAiMenu from "@/src/components/DominoAiMenu";

export default function DominoPlayground() {
  return (
    <div className="flex h-screen w-fit flex-col items-center justify-between gap-[32px] p-[64px]">
      <DominoAiMenu className="fixed bottom-0 right-[48px] top-0 my-auto h-1/2" />
      <DominoTable />
      <GameInitMenu />
    </div>
  );
}
