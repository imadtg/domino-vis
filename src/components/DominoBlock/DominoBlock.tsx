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

const previousRotationMap = new Map();

export type Variant = "greyed" | "highlighted" | "chosen" | "default";

export type Orientation = "horizontal" | "vertical";

type DominoBlockProps<E extends React.ElementType> = Omit<
  React.ComponentProps<E>,
  "as"
> & {
  piece: DominoPiece;
  as?: E;
  dominoGroupId?: string;
  variant?: Variant;
  orientation?: Orientation;
  reverse?: boolean;
};

function DominoBlock<E extends React.ElementType = "div">({
  piece,
  as,
  className = "",
  style = {},
  dominoGroupId = "global",
  variant = "default",
  orientation = "vertical",
  reverse = false,
  ...delegated
}: DominoBlockProps<E>) {
  const [layoutWidthFr, layoutHeightFr] =
    orientation === "horizontal"
      ? [BASE_HEIGHT_FR, BASE_WIDTH_FR]
      : [BASE_WIDTH_FR, BASE_HEIGHT_FR];

  const aspectRatio = layoutWidthFr / layoutHeightFr;

  const [bigPip, smallPip] =
    piece.left > piece.right
      ? [piece.left, piece.right]
      : [piece.right, piece.left];

  let rotate = 0;
  if (bigPip === piece.right) {
    rotate = congruentInRange(rotate + 180, 360, -180, 180);
  }
  if (orientation === "horizontal") {
    rotate = congruentInRange(rotate - 90, 360, -180, 180);
  }
  // even with this, doubles are acting strangely...
  if (reverse) {
    rotate = congruentInRange(rotate - 180, 360, -180, 180);
  }

  const id = `${dominoGroupId}:${bigPip}-${smallPip}:${typeof piece.origin === "undefined" ? "unknown" : piece.origin}-origin`;
  // there is no easier way to persist this for a specific domino piece, keys alone don't work when element changes parent.
  // TODO: try to implement how framer motion persists values like this from their source code.
  const previousRotation = previousRotationMap.get(id) ?? 0;
  // TODO: doubles sometime choose to take an opposite rotation to other dominos, making it uniform would be nice.
  const rotDiff = congruentInRange(rotate - previousRotation, 360, -180, 180);
  const appliedRotation = previousRotation + rotDiff; // this is to avoid rotations of over 180 degrees.
  React.useEffect(() => {
    previousRotationMap.set(id, appliedRotation);
  }, [appliedRotation]);

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
          width: `calc(clamp(6px , 1vw, 8px) * var(--domino-width-scale))`, // TODO: untangle this mess...
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
          layoutId={id}
          key={id}
          animate={{
            rotate: appliedRotation,
          }}
          /*onAnimationStart={() =>
            console.log(
              `started animating rotation of [${bigPip}|${smallPip}]: ${appliedRotation}`,
            )
          }
          onUpdate={() => console.log(`${appliedRotation}`)}
          onAnimationEnd={() =>
            console.log(
              `finished animating rotation of [${bigPip}|${smallPip}]: ${appliedRotation}`,
            )
          }*/
          style={{
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

function congruentInRange(
  dividend: number,
  divisor: number,
  low: number,
  high: number,
): number {
  // returns a number congruent to the remainder of the division on divisor but in the range [low, high]
  if (dividend < low) {
    return congruentInRange(dividend + divisor, divisor, low, high);
  }
  if (dividend > high) {
    return congruentInRange(dividend - divisor, divisor, low, high);
  }
  return dividend;
}

export default DominoBlock;
