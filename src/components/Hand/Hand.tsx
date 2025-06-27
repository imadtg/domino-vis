"use client";
import * as React from "react";
import { DominoPiece, HandInfo } from "@/lib/features/domino/dominoUtils";
import DominoBlock from "../DominoBlock";

interface HandProps {
  hand: HandInfo;
  onPieceClick?: (piece: DominoPiece) => React.MouseEventHandler | undefined;
}

function Hand({ hand, onPieceClick }: HandProps) {
  return (
    // idk if this is semantically correct, but i'm using abbr for displaying counts in a non-intrusive way.
    <abbr
      title={`count of hand is ${hand.count}`}
      className="flex flex-wrap items-center justify-center gap-[4px] sm:gap-[8px] md:gap-[12px] lg:gap-[16px]"
    >
      {hand.pieces.map(({ piece, presence }) => {
        const onClick = onPieceClick?.(piece);
        return (
          <DominoBlock
            as={onClick ? "button" : "div"}
            key={`${piece.left}-${piece.right}`}
            onClick={onClick}
            piece={piece}
            variant={onClick ? "highlighted" : "default"}
            orientation="vertical"
            style={{ opacity: presence === "possible" ? "0.5" : "1" }}
          />
        );
      })}
    </abbr>
  );
}

export default Hand;
