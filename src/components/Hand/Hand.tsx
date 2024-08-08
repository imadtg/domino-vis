"use client";
import * as React from "react";
import { produce } from "immer";

import {
  initialize,
  playMove,
  selectHand,
  selectSnake,
  selectStatus,
  selectTurn,
} from "@/lib/features/domino/dominoSlice";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  comparePieces,
  DominoIngameInfo,
  DominoPiece,
  getAllDominoes,
} from "@/lib/features/domino/dominoUtils";
import clsx from "clsx";
import DominoBlock from "../DominoBlock";
import { ProcessedDominoPiece } from "../DominoTable";

function Hand({
  processedHand,
  onPieceClick,
}: {
  processedHand?: ProcessedDominoPiece[];
  onPieceClick?: (piece: DominoPiece) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-[4px] sm:gap-[8px] md:gap-[12px] lg:gap-[16px]">
      {processedHand?.map(({ piece, playable }) => (
        <DominoBlock
          as={playable ? "button" : "div"}
          key={`${piece.left}-${piece.right}`}
          onClick={playable ? () => onPieceClick?.(piece) : undefined}
          piece={piece}
          variant={playable ? "highlighted" : "default"}
          orientation="vertical"
        />
      ))}
    </div>
  );
}

export default Hand;
