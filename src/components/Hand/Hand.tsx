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
    <div className="h-[128px] flex items-center gap-[12px]">
      {processedHand?.map(({ piece, playable }) => (
        <DominoBlock
          as={playable ? "button" : "div"}
          key={`${piece.left}-${piece.right}`}
          onClick={playable ? (() => onPieceClick?.(piece)) : undefined}
          piece={piece}
          highlighted={playable}
          orientation="vertical"
        />
      ))}
    </div>
  );
}

export default Hand;
