"use client";
import * as React from "react";
import DominoIcon from "./DominoIcon";
import clsx from "clsx";
import { DominoPiece } from "@/lib/features/domino/dominoUtils";
const VARIANT_COLORS = {
  greyed: "#181717",
  highlighted: "#76d9eb",
  chosen: "#fbff00",
  default: "#D9D9D9", // this is here for additional redunduncy, see DominoSvg
};

type Variants = "greyed" | "highlighted" | "chosen" | "default";

export type Orientation = "horizontal" | "vertical"

type DominoBlockProps<E extends React.ElementType> = Omit<React.ComponentProps<E>, 'as'> & {
  piece: DominoPiece;
  as?: E;
  dominoGroupId?: string;
  variant?: Variants;
  orientation?: Orientation;
}

function DominoBlock<E extends React.ElementType = 'div'>({
  piece,
  as,
  className = "",
  style = {},
  dominoGroupId = "global",
  variant = "default" /* greyed-out | highlighted | chosen | default */,
  orientation = "vertical",
  ...delegated
}: DominoBlockProps<E>) {
  const isHorizontal = orientation === "horizontal";
  const aspectRatio = isHorizontal ? 2 : 0.5;
  const size = 6;
  const widthFraction = isHorizontal ? 2 : 1; // TODO: calculate this and aspect ratio from eachother or another source, this feels redundant
  
  const Tag = as || "div";
  return (
    <Tag
      className={clsx("outline-offset-2", className)}
      style={
        {
          "--domino-size": size,
          "--domino-width-scale": size * widthFraction,
          "--domino-body-color": VARIANT_COLORS[variant],
          ...style,
          // i'm starting to miss styled-components...
          width: `calc(clamp(6px , 1vw, 10px) * var(--domino-width-scale))`, // TODO: untangle unitless and unit mess
        } as React.CSSProperties
      }
      {...delegated}
    >
      <div // a hacky way to implement aspect ratios, this acts as the containing block for the icon and dynamically changes aspect ratio to respect layout.
        style={{
          // not using tailwind because we need interpolation and most of these properties serve the same purpose.
          position: "relative",
          boxSizing: "content-box",
          height: 0,
          paddingBottom: `${100 / aspectRatio}%`,
        }}
      >
        <DominoIcon
          left={piece.left}
          right={piece.right}
          dominoGroupId={dominoGroupId}
          orientation={orientation}
          aspectRatio={aspectRatio}
        />
      </div>
    </Tag>
  );
}
export default DominoBlock;
