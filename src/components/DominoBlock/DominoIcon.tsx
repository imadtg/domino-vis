import * as React from "react";
import { motion } from "framer-motion";
import DominoSvg from "./DominoSvg";

const DominoIcon = ({
  left,
  right,
  orientation,
  aspectRatio,
  dominoGroupId,
  ...delegated
}: any) => {
  const isHorizontal = orientation === "horizontal";
  const [bigPip, smallPip] = left > right ? [left, right] : [right, left];
  const rotate = isHorizontal ? (bigPip === right ? 90 : -90) : 0;

  return (
    <div className="pointer-events-none absolute inset-0 grid grid-cols-1 grid-rows-1 place-items-center">
      {/* this wrapper is needed to center the svg and span the margin box of the parent containing block */}
      <motion.div // i would have used motion.svg directly, but svg isn't supported well
        initial={false}
        layout="preserve-aspect"
        layoutId={`${dominoGroupId}:${bigPip}-${smallPip}`}
        animate={{
          rotate,
        }}
        style={{
          transform: `rotate(${rotate}deg)`,
          transformOrigin: "center",
          width: isHorizontal ? "50%" : "100%", // TODO: calculate this from the aspect ratio and a size variable
        }}
      >
        <DominoSvg topNumber={bigPip} bottomNumber={smallPip} />
      </motion.div>
    </div>
  );
};

export default DominoIcon;
