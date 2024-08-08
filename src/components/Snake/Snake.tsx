"use client";
import * as React from "react";
import {
  DominoPiece,
} from "@/lib/features/domino/dominoUtils";
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
    <div className="flex h-[64px] items-center gap-[2px] sm:gap-[4px] md:gap-[8px] lg:gap-[12px]">
      {onSideClick && <button onClick={() => onSideClick("left")}>left</button>}
      {snake?.map((piece) => (
        <DominoBlock
          as={onPieceClick ? "button" : "div"}
          key={`${piece.left}-${piece.right}`}
          onClick={() => onPieceClick?.(piece)}
          piece={piece}
          orientation={piece.left !== piece.right ? "horizontal" : "vertical"}
        />
      ))}
      {onSideClick && (
        <button onClick={() => onSideClick("right")}>right</button>
      )}
    </div>
  );
}

export default Snake;
