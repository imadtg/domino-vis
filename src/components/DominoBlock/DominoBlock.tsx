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

function DominoBlock({
  piece,
  as: Tag = "div",
  className = "",
  ...delegated
}: any) {
  /* any type is TEMPORARY!!! */
  return (
    <Tag
      className={clsx(
        "p-[8px] border-black border rounded-lg grid place-content-center",
        className
      )}
      {...delegated}
    >
      [{piece.left}|{piece.right}]
    </Tag>
  );
}
export default DominoBlock;