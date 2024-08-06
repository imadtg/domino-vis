import * as React from "react";

/*
 * maybe i should dehardcode the size of the domino piece?
 * it is 100x200 now. maybe would make the code cleaner if it was a constant?
 */

type VerticalAlignment = "top" | "center" | "bottom";
type HorizontalAlignment = "left" | "center" | "right";
type PipGroup = "top" | "bottom";

// the gaps are between the centers of the pips
const VERTICAL_GAP = 31.28;
const HORIZONTAL_GAP = 26; // this isn't a gap between leftmost and rightmost pips, it's a gap between left/right pip and the center pip
const PIP_WIDTH = 11;

const CENTER_AXIS = {
  cy: 46.46, // this isn't perfectly centered because of the separator, maybe i should refactor this into some sort of padding around the pip group?
};

interface PipAlignment {
  horizontalAlign: HorizontalAlignment;
  verticalAlign: VerticalAlignment;
}

interface PipConfig extends PipAlignment {
  pipGroup: PipGroup;
}

interface PipSvgProps extends PipConfig {}

function PipSvg({
  horizontalAlign,
  verticalAlign,
  pipGroup,
  ...delegated
}: PipSvgProps) {
  // calculate the center of the pip
  let cx = 100 / 2;
  let cy = CENTER_AXIS.cy;
  if (pipGroup === "bottom") {
    cy = 200 - cy;
  }
  if (horizontalAlign === "left") {
    cx -= HORIZONTAL_GAP;
  } else if (horizontalAlign === "right") {
    cx += HORIZONTAL_GAP;
  }
  if (verticalAlign === "top") {
    cy -= VERTICAL_GAP;
  } else if (verticalAlign === "bottom") {
    cy += VERTICAL_GAP;
  }
  return <circle r={PIP_WIDTH} fill="#F81F1F" cx={cx} cy={cy} {...delegated} />;
}

interface PipInfo extends PipAlignment {}

interface PipGroupInfo {
  pipInfos: PipInfo[];
  globalPipConfig?: PipConfig;
}

interface PipGroupInfoForNumber {
  [key: number]: PipGroupInfo;
}

const PIP_MAP: PipGroupInfoForNumber = {
  [0]: { pipInfos: [] },
  [1]: { pipInfos: [{ verticalAlign: "center", horizontalAlign: "center" }] },
  [2]: {
    pipInfos: [
      { verticalAlign: "top", horizontalAlign: "left" },
      { verticalAlign: "bottom", horizontalAlign: "right" },
    ],
  },
  [3]: {
    pipInfos: [
      { verticalAlign: "top", horizontalAlign: "left" },
      { verticalAlign: "bottom", horizontalAlign: "right" },
      { verticalAlign: "center", horizontalAlign: "center" },
    ],
  },
  [4]: {
    pipInfos: [
      { verticalAlign: "top", horizontalAlign: "left" },
      { verticalAlign: "top", horizontalAlign: "right" },
      { verticalAlign: "bottom", horizontalAlign: "right" },
      { verticalAlign: "bottom", horizontalAlign: "left" },
    ],
  },
  [5]: {
    pipInfos: [
      { verticalAlign: "top", horizontalAlign: "left" },
      { verticalAlign: "top", horizontalAlign: "right" },
      { verticalAlign: "bottom", horizontalAlign: "right" },
      { verticalAlign: "bottom", horizontalAlign: "left" },
      { verticalAlign: "center", horizontalAlign: "center" },
    ],
  },
  [6]: {
    pipInfos: [
      { verticalAlign: "top", horizontalAlign: "left" },
      { verticalAlign: "top", horizontalAlign: "right" },
      { verticalAlign: "center", horizontalAlign: "right" },
      { verticalAlign: "center", horizontalAlign: "left" },
      { verticalAlign: "bottom", horizontalAlign: "right" },
      { verticalAlign: "bottom", horizontalAlign: "left" },
    ],
  },
};

interface DominoSvgProps {
  topNumber: number;
  bottomNumber: number;
}

function DominoSvg({ topNumber, bottomNumber }: DominoSvgProps) {
  return (
    <svg // TODO: refactor this svg (and maybe animate it's properties directly?).
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 200" // TODO: calculate this from the aspect ratio, or flip control and somehow give the parent information about this
      fill="none"
    >
      <rect
        data-label="body"
        x="0"
        y="0"
        width="100"
        height="200"
        rx="20"
        fill="#D9D9D9"
      />
      {(() => {
        // TODO: refactor this logic into CSS variables.
        const width = 92;
        const height = 10;
        return (
          <rect
            data-label="separator"
            x={50 - width / 2}
            y={100 - height / 2}
            width={width}
            height={height}
            rx={Math.min(height, width) / 2}
            fill="#210B0B"
          />
        );
      })()}
      <g>
        {PIP_MAP[topNumber].pipInfos.map(
          ({ verticalAlign, horizontalAlign }) => (
            <PipSvg
              key={`${verticalAlign}-${horizontalAlign}`}
              verticalAlign={verticalAlign}
              horizontalAlign={horizontalAlign}
              pipGroup="top"
            />
          ),
        )}
      </g>
      <g>
        {PIP_MAP[bottomNumber].pipInfos.map(
          ({ verticalAlign, horizontalAlign }) => (
            <PipSvg
              key={`${verticalAlign}-${horizontalAlign}`}
              verticalAlign={verticalAlign}
              horizontalAlign={horizontalAlign}
              pipGroup="bottom"
            />
          ),
        )}
      </g>
    </svg>
  );
}

export default DominoSvg;
