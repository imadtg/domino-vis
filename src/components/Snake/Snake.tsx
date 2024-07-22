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

function Snake({
  snake,
  onPieceClick,
  onSideClick,
}: {
  snake?: DominoPiece[];
  onPieceClick?: (piece: DominoPiece) => void;
  onSideClick?: (side: "left" | "right") => void;
}) {
  return (
    <div className="h-[64px] flex items-center gap-[8px]">
      {onSideClick && <button onClick={() => onSideClick("left")}>left</button>}
      {snake?.map((piece) => (
        <DominoBlock
          as={onPieceClick ? "button" : "div"}
          key={`${piece.left}-${piece.right}`}
          onClick={() => onPieceClick?.(piece)}
          piece={piece}
        />
      ))}
      {onSideClick && (
        <button onClick={() => onSideClick("right")}>right</button>
      )}
    </div>
  );
}

export default Snake;
