"use client";
import * as React from "react";
import clsx from "clsx";
import DominoIcon from "./DominoIcon";

function DominoBlock({
  piece,
  as: Tag = "div",
  className = "",
  dominoGroupId = "global",
  highlighted = false,
  orientation = "vertical",
  ...delegated
}: any) {
  const isHorizontal = orientation === "horizontal";
  const aspectRatio = isHorizontal ? 2 : 0.5;

  return (
    <Tag
      className={clsx(
        "focus:outline-black",
        highlighted && "outline outline-[4px] outline-blue-500",
        isHorizontal ? "w-32" : "w-16", // TODO: calculate this from the aspect ratio and a size variable
        className,
      )}
      {...delegated}
    >
      <div // a hacky way to implement aspect ratios, this acts as the containing block for the icon and dynamically changes aspect ratio to respect layout.
        style={{ // not using tailwind because we need interpolation and most of these properties serve the same purpose.
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
