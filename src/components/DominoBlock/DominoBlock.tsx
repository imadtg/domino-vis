"use client";
import * as React from "react";
import clsx from "clsx";
import { DominoPiece } from "@/lib/features/domino/dominoUtils";
import { motion } from "framer-motion";
import DominoSvg from "./DominoSvg";

const VARIANT_COLORS = {
  greyed: "#181717",
  highlighted: "#76d9eb",
  chosen: "#fbff00",
  default: "#D9D9D9", // this is here for additional redunduncy, see DominoSvg
};

// the following are the fractions of width and height of a vertical domino (the default).
const BASE_WIDTH_FR = 1;
const BASE_HEIGHT_FR = 2;

// this is proportional the base size of the domino block.
const SIZE_SCALE = 6;

type Variants = "greyed" | "highlighted" | "chosen" | "default";

export type Orientation = "horizontal" | "vertical";

type DominoBlockProps<E extends React.ElementType> = Omit<
  React.ComponentProps<E>,
  "as"
> & {
  piece: DominoPiece;
  as?: E;
  dominoGroupId?: string;
  variant?: Variants;
  orientation?: Orientation;
};

function DominoBlock<E extends React.ElementType = "div">({
  piece,
  as,
  className = "",
  style = {},
  dominoGroupId = "global",
  variant = "default",
  orientation = "vertical",
  ...delegated
}: DominoBlockProps<E>) {
  const isHorizontal = orientation === "horizontal";
  const [layoutWidthFr, layoutHeightFr] = isHorizontal
    ? [BASE_HEIGHT_FR, BASE_WIDTH_FR]
    : [BASE_WIDTH_FR, BASE_HEIGHT_FR];
  const aspectRatio = layoutWidthFr / layoutHeightFr;

  const [bigPip, smallPip] =
    piece.left > piece.right
      ? [piece.left, piece.right]
      : [piece.right, piece.left];
  const rotate = isHorizontal ? (bigPip === piece.right ? 90 : 270) : (bigPip === piece.right ? 0 : 180);

  const Tag = as || "div";
  return (
    <Tag
      // i'm starting to miss styled-components...
      className={clsx("relative outline-offset-2", className)}
      style={
        {
          "--domino-size": SIZE_SCALE,
          "--domino-width-scale": SIZE_SCALE * layoutWidthFr,
          "--domino-body-color": VARIANT_COLORS[variant],
          ...style,
          width: `calc(clamp(4px , 1vw, 10px) * var(--domino-width-scale))`, // TODO: untangle this mess...
          aspectRatio,
        } as React.CSSProperties
      }
      {...delegated}
    >
      {/* center the icon within the tag and make it incosequential on layout.
        we determined layout manually above, we apply transforms to fit the svg to the layout.
      */}
      <div className="pointer-events-none absolute inset-0 grid grid-cols-1 grid-rows-1 place-items-center">
        <motion.div // i would have used motion.svg directly, but it isn't supported by framer motion.
          initial={false}
          layout="preserve-aspect"
          layoutId={`${dominoGroupId}:${bigPip}-${smallPip}`}
          animate={{
            rotate,
          }}
          style={{
            transform: `rotate(${rotate}deg)`,
            transformOrigin: "center",
            width: `${(BASE_WIDTH_FR / layoutWidthFr) * 100}%`,
          }}
        >
          <DominoSvg topNumber={bigPip} bottomNumber={smallPip} />
        </motion.div>
      </div>
    </Tag>
  );
}
export default DominoBlock;
