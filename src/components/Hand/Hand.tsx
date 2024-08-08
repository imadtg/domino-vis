"use client";
import * as React from "react";
import {
  DominoPiece,
} from "@/lib/features/domino/dominoUtils";
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
