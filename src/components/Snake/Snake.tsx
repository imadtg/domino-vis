"use client";
import * as React from "react";
import {
  comparePieces,
  turnAround,
  DominoPiece,
  Side,
} from "@/lib/features/domino/dominoUtils";
import DominoBlock, { Orientation, Variant } from "../DominoBlock";
import {
  detectElementOverflow,
  getRect,
  detectMaximumGap,
} from "./Snake.helpers";
import { css, styled } from "styled-components";

type Direction = "row" | "column" | "row-reverse" | "column-reverse";

// a repeating pattern of flex directions of segments.
// the pattern is reversed on left segments. to try to occupy more space.
const FLEX_DIRECTIONS: Direction[] = [
  "row",
  "column",
  "row-reverse",
  "column-reverse",
];

interface SnakeProps {
  snake: DominoPiece[];
  onSideClick?: (side: Side) => void;
  debug?: boolean; // this is for snake-playground. lets the user create arbitrary breakpoints instead of creating them based on layout.
}

function Snake({ snake, onSideClick, debug = false }: SnakeProps) {
  //console.log("render of snake started...");
  // all of the logic here assumes pieces are added incrementally...
  const firstPieceRef = React.useRef<DominoPiece>();

  if (!firstPieceRef.current && snake.length > 0) {
    firstPieceRef.current = snake[0];
  }

  // relative indices of pieces to know how to break the snake into segments at those indices.
  // priority of break is always to the right, ie breaking at [0|0] gives it to the right segment.
  const [segmentBreakpoints, setSegmentBreakpoints] = React.useState<number[]>(
    [],
  );

  const segmentRefs = React.useRef<HTMLDivElement[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const originPieceIndex = snake.findIndex((piece) =>
    firstPieceRef.current ? comparePieces(firstPieceRef.current, piece) : false,
  );

  function relativeIndex(relativePiece: DominoPiece) {
    return (
      snake.findIndex((piece) => comparePieces(relativePiece, piece)) -
      originPieceIndex
    );
  }

  function setBreakpoint(piece: DominoPiece) {
    setSegmentBreakpoints(
      [
        relativeIndex(piece), // set a new breakpoint at the index after the leftmost piece.
        ...segmentBreakpoints,
      ].sort((i, j) => i - j),
    );
  }

  function removeBreakpoint(piece: DominoPiece) {
    setSegmentBreakpoints(
      segmentBreakpoints.filter(
        (relativeIndex) =>
          !comparePieces(piece, snake[originPieceIndex + relativeIndex]),
      ),
    );
  }

  function pieceIsBreakpoint(piece: DominoPiece) {
    return segmentBreakpoints.some((relativeIndex) =>
      comparePieces(piece, snake[originPieceIndex + relativeIndex]),
    );
  }

  function toggleBreakpoint(piece: DominoPiece) {
    if (pieceIsBreakpoint(piece)) {
      removeBreakpoint(piece);
    } else {
      setBreakpoint(piece);
    }
  }

  let segments: DominoPiece[][] = [];
  let originSegmentIndex: number | undefined = undefined;
  let previousBreakpoint = -originPieceIndex;
  for (let i = 0; i < segmentBreakpoints.length; i++) {
    segments.push(
      snake.slice(
        originPieceIndex + previousBreakpoint,
        originPieceIndex + segmentBreakpoints[i],
      ),
    );
    if (previousBreakpoint <= 0 && segmentBreakpoints[i] > 0) {
      originSegmentIndex = i;
    }
    previousBreakpoint = segmentBreakpoints[i];
  }

  segments.push(snake.slice(originPieceIndex + previousBreakpoint));
  if (typeof originSegmentIndex === "undefined") {
    originSegmentIndex = segmentBreakpoints.length;
  }

  const directedSegments = segments.map((segment, index) => ({
    segment,
    direction:
      index < originSegmentIndex
        ? FLEX_DIRECTIONS[(originSegmentIndex - index) % FLEX_DIRECTIONS.length]
        : FLEX_DIRECTIONS[
            (index - originSegmentIndex) % FLEX_DIRECTIONS.length
          ],
  }));

  function segmentsIntersect(
    growingSegmentRef: HTMLElement,
    staticSegmentRef: HTMLElement,
    growingDirection: Direction,
    minDistance: number,
  ): boolean {
    const gapInfo = detectMaximumGap(growingSegmentRef, staticSegmentRef);
    const CALC_PERPENDICULAR_GAP: Record<Direction, () => number> = {
      row: () => gapInfo.columnGap,
      "row-reverse": () => gapInfo.columnGap,
      column: () => gapInfo.rowGap,
      "column-reverse": () => gapInfo.rowGap,
    };
    if (CALC_PERPENDICULAR_GAP[growingDirection]() > minDistance / 2) {
      return false;
    }
    const CALC_GROWING_GAP: Record<Direction, () => number> = {
      row: () => gapInfo.rowGap,
      "row-reverse": () => gapInfo.rowGap,
      column: () => gapInfo.columnGap,
      "column-reverse": () => gapInfo.columnGap,
    };
    return CALC_GROWING_GAP[growingDirection]() < minDistance;
  }

  function shouldSegment(segmentIndex: number): boolean {
    if (
      !segmentRefs.current[segmentIndex] ||
      !containerRef.current ||
      typeof originSegmentIndex === "undefined"
    ) {
      console.log("something is terribly wrong");
      console.log({segmentRefs: segmentRefs.current, containerRef: containerRef.current, originSegmentIndex})
      return false;
    }
    const { direction } = directedSegments[segmentIndex];

    const overflowInfo = detectElementOverflow(
      segmentRefs.current[segmentIndex],
      containerRef.current,
    );
    // NOTE: while this does detect overflow, it doesn't take into account if future doubles played on this segment would overflow
    // this can be trivially mitigated by artificial padding on the wrapper that will contain the container of the snake.
    const TEST_AGAINST_CONTAINER_LEFT: Record<Direction, () => boolean> = {
      row: () => overflowInfo.collidedLeft,
      "row-reverse": () => overflowInfo.collidedRight,
      column: () => overflowInfo.collidedTop,
      "column-reverse": () => overflowInfo.collidedBottom,
    };
    const TEST_AGAINST_CONTAINER_RIGHT: Record<Direction, () => boolean> = {
      row: () => overflowInfo.collidedRight,
      "row-reverse": () => overflowInfo.collidedLeft,
      column: () => overflowInfo.collidedBottom,
      "column-reverse": () => overflowInfo.collidedTop,
    };
    //console.log("Are we overflowing right?")
    if (segmentIndex >= originSegmentIndex && TEST_AGAINST_CONTAINER_RIGHT[direction]()) {
      return true;
    }
    //console.log("No...")
    //console.log("Are we overflowing left?")
    if (segmentIndex <= originSegmentIndex && TEST_AGAINST_CONTAINER_LEFT[direction]()) {
      return true;
    }
    //console.log("No...")
    const TEST_AGAINST_SEGMENTS_WITH_DIRECTION: Record<Direction, Direction[]> =
      {
        row: ["column", "column-reverse"],
        "row-reverse": ["column", "column-reverse"],
        column: ["row", "row-reverse"],
        "column-reverse": ["row", "row-reverse"],
      };
    const GET_MIN_DISTANCE: Record<
      Direction,
      (segmentRef: HTMLElement) => number
    > = {
      row: (segmentRef) => getRect(segmentRef).height / 2,
      "row-reverse": (segmentRef) => getRect(segmentRef).height / 2,
      column: (segmentRef) => getRect(segmentRef).width / 2,
      "column-reverse": (segmentRef) => getRect(segmentRef).width / 2,
    };
    return (
      directedSegments.some(
        ({ direction: againstSegmentDirection }, againstIndex) => {
          if (
            !TEST_AGAINST_SEGMENTS_WITH_DIRECTION[direction].includes(
              againstSegmentDirection,
            ) ||
            !segmentRefs.current[againstIndex] ||
            againstIndex === segmentIndex ||
            (againstIndex === segmentIndex + 1) || // skip detection on adjacent segments.
            (againstIndex === segmentIndex - 1)
          ) {
            return false;
          }
          /*let minDistance = 0;
          if (againstIndex != originSegmentIndex) {
            minDistance = GET_MIN_DISTANCE[againstSegmentDirection](
              segmentRefs.current[againstIndex],
            );
          }*/
          // temporarily going with safe distances, because the segments can sometimes overshoot the origin segment and cause trouble.
          const minDistance = GET_MIN_DISTANCE[againstSegmentDirection](
            segmentRefs.current[againstIndex],
          );
          //console.log("checking segment %d against %d", segmentIndex, againstIndex)
          return segmentsIntersect(
            segmentRefs.current[segmentIndex],
            segmentRefs.current[againstIndex],
            direction,
            minDistance,
          );
        },
      )
    );
  }

  // TODO: fix framer motion rotation animation of DominoBlock breaking after the effect below triggers a rerender.
  // perhaps we can use skeleton pieces until this effect finishes then use correct pieces?
  React.useLayoutEffect(() => {
    if (debug) {
      return;
    }
    //console.log("checking if should segment on the left...");
    if (shouldSegment(0)) {
      // leftmost segment
      //console.log("yes! checking if can segment on the left...");
      const segmentAtPiece = segments.at(0)?.at(1); // set a new breakpoint at the piece right after the leftmost piece.
      if (!segmentAtPiece || pieceIsBreakpoint(segmentAtPiece)) {
        // TODO: if segmenting is not possible, attempt sliding the entire snake at the opposite direction.
        return;
      }
      //console.log("yes! segmenting on the left...");
      setBreakpoint(segmentAtPiece);
      return;
    }
    //console.log("checking if should segment on the right...");
    if (shouldSegment(segments.length - 1)) {
      // rightmost segment
      //console.log("yes! checking if can segment on the right...");
      const segmentAtPiece = segments.at(-1)?.at(-1); // set a new breakpoint at the rightmost piece.
      if (!segmentAtPiece || pieceIsBreakpoint(segmentAtPiece)) {
        return;
      }
      //console.log("yes! segmenting on the right...");
      setBreakpoint(segmentAtPiece);
      return;
    }
  });

  function segmentIsAnchoredOnDouble(index: number) {
    if (
      index === originSegmentIndex ||
      typeof originSegmentIndex === "undefined"
    ) {
      return false;
    }
    if (index > originSegmentIndex) {
      const anchorPiece = segments[index - 1].at(-1) as DominoPiece;
      return anchorPiece.left === anchorPiece.right;
    }
    const anchorPiece = segments[index + 1][0];
    return anchorPiece.left === anchorPiece.right;
  }

  // we need a special DOM order for anchor positioning to work...
  const leftDirectedSegments = directedSegments
    .map((segmentInfo, index) => ({ ...segmentInfo, index }))
    .slice(0, originSegmentIndex)
    .reverse();
  const rightDirectedSegments = directedSegments
    .map((segmentInfo, index) => ({ ...segmentInfo, index }))
    .slice(originSegmentIndex); // this does include the starting segment

  const orderedDirectedSegments = [
    ...rightDirectedSegments,
    ...leftDirectedSegments,
  ];

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-4 outline-dashed outline-red-600"
      ref={containerRef}
    >
      {orderedDirectedSegments.map(({ segment, direction, index }) => (
        <SnakeSegment
          key={index - originSegmentIndex}
          index={index - originSegmentIndex}
          ref={(element: HTMLDivElement) => {
            segmentRefs.current[index] = element;
          }}
          segment={segment}
          direction={direction}
          onLeftSideClick={
            index === 0 && onSideClick ? () => onSideClick("left") : undefined
          }
          onRightSideClick={
            index === segments.length - 1 && onSideClick
              ? () => onSideClick("right")
              : undefined
          }
          debug={debug}
          onPieceClick={debug ? (piece) => toggleBreakpoint(piece) : undefined}
          highlightPiece={debug ? pieceIsBreakpoint : undefined}
          isAnchoredOnDouble={segmentIsAnchoredOnDouble(index)}
        />
      ))}
    </div>
  );
}

interface SnakeSegmentProps {
  segment: DominoPiece[];
  index: number;
  direction: Direction;
  onLeftSideClick?: () => void;
  onRightSideClick?: () => void;
  debug?: boolean;
  onPieceClick?: (piece: DominoPiece) => void;
  highlightPiece?: (piece: DominoPiece) => boolean;
  isAnchoredOnDouble?: boolean;
}

// TODO: unhardcode ref type being on a <div/>.
const SnakeSegment = React.forwardRef<HTMLDivElement, SnakeSegmentProps>(
  (
    {
      segment,
      index,
      direction,
      onRightSideClick,
      onLeftSideClick,
      onPieceClick,
      highlightPiece,
      isAnchoredOnDouble = false,
      debug,
    }: SnakeSegmentProps,
    ref,
  ) => {
    function flipOrientation(orientation: Orientation): Orientation {
      if (orientation === "horizontal") {
        return "vertical";
      }
      return "horizontal";
    }

    return (
      <SegmentWrapper
        $index={index}
        $direction={direction}
        $isAnchoredOnDouble={isAnchoredOnDouble}
        className="absolute flex items-center gap-[--spacing]"
        ref={ref}
      >
        {segment.map((piece, pieceIndex) => {
          const isLeftmostPiece = pieceIndex === 0;
          const isRightmostPiece = pieceIndex === segment.length - 1;

          let anchorName;
          if (segment.length === 1) {
            anchorName = `--left-${index}, --right-${index}`;
          } else if (isLeftmostPiece) {
            anchorName = `--left-${index}`;
          } else if (isRightmostPiece) {
            anchorName = `--right-${index}`;
          }

          let orientation: Orientation =
            direction === "row" || direction === "row-reverse"
              ? "horizontal"
              : "vertical";
          if (piece.left === piece.right) {
            orientation = flipOrientation(orientation);
          }

          let interactive = false;
          let onClick;
          let variant: Variant = "default";
          if (debug) {
            if (onPieceClick) {
              interactive = true;
              onClick = () => onPieceClick(piece);
            }
            if (highlightPiece?.(piece)) {
              variant = "highlighted";
            }
          } else {
            // TODO: give player a choice on which side to play on when playing on top of the first double.
            if (onLeftSideClick && isLeftmostPiece) {
              interactive = true;
              variant = "highlighted";
              onClick = onLeftSideClick;
            } else if (onRightSideClick && isRightmostPiece) {
              interactive = true;
              variant = "highlighted";
              onClick = onRightSideClick;
            }
          }

          return (
            <DominoBlockWrapper
              $anchorName={anchorName}
              key={`${piece.left}-${piece.right}`}
            >
              <DominoBlock
                piece={
                  direction === "row" || direction === "column"
                    ? piece
                    : turnAround(piece) // turn the piece around as the flow is reversed.
                }
                orientation={orientation}
                className="block"
                as={interactive ? "button" : "div"}
                onClick={onClick}
                variant={variant}
              />
            </DominoBlockWrapper>
          );
        })}
      </SegmentWrapper>
    );
  },
);

// anchor madness...
const DominoBlockWrapper = styled.div<{ $anchorName?: string }>`
  flex-shrink: 0;
  anchor-name: ${(props) => (props.$anchorName ? props.$anchorName : "none")};
`;

interface SegmentWrapperProps {
  $index: number;
  $direction: Direction;
  $isAnchoredOnDouble: boolean;
}

const SegmentWrapper = styled.div<SegmentWrapperProps>`
  ${(props) =>
    props.$isAnchoredOnDouble
      ? css`
          background-color: hotpink;
        `
      : css``}
  --spacing: 2px;
  @media (min-width: 640px) {
    --spacing: 4px;
  }
  @media (min-width: 768px) {
    --spacing: 8px;
  }
  @media (min-width: 1024px) {
    --spacing: 12px;
  }

  flex-direction: ${(props) => props.$direction};
  position-anchor: ${(props) => {
    if (props.$index === 0) {
      return "auto";
    }
    if (props.$index < 0) {
      return `--left-${props.$index + 1}`;
    }
    return `--right-${props.$index - 1}`;
  }};

  ${(props) => {
    if (props.$index === 0) {
      return css``;
    }
    if (props.$index < 0) {
      return LEFT_STYLE_FOR_DIRECTION[props.$direction];
    }
    return RIGHT_STYLE_FOR_DIRECTION[props.$direction];
  }}
`;

const LEFT_STYLE_FOR_DIRECTION: Record<
  Direction,
  ReturnType<typeof css<SegmentWrapperProps>>
> = {
  column: css<SegmentWrapperProps>`
    bottom: anchor(top);
    margin-bottom: var(--spacing);
    left: anchor(left);
    ${(props) =>
      props.$isAnchoredOnDouble
        ? css`
            right: anchor(right);
          `
        : css`
            right: anchor(50%);
          `}
  `,

  "row-reverse": css<SegmentWrapperProps>`
    left: anchor(right);
    margin-left: var(--spacing);
    top: anchor(top);
    ${(props) =>
      props.$isAnchoredOnDouble
        ? css`
            bottom: anchor(bottom);
          `
        : css`
            bottom: anchor(50%);
          `}
  `,
  "column-reverse": css<SegmentWrapperProps>`
    top: anchor(bottom);
    margin-top: var(--spacing);
    right: anchor(right);
    ${(props) =>
      props.$isAnchoredOnDouble
        ? css`
            left: anchor(left);
          `
        : css`
            left: anchor(50%);
          `}
  `,
  row: css<SegmentWrapperProps>`
    right: anchor(left);
    margin-right: var(--spacing);
    bottom: anchor(bottom);
    ${(props) =>
      props.$isAnchoredOnDouble
        ? css`
            top: anchor(top);
          `
        : css`
            top: anchor(50%);
          `}
  `,
};

const RIGHT_STYLE_FOR_DIRECTION: Record<
  Direction,
  ReturnType<typeof css<SegmentWrapperProps>>
> = {
  column: css<SegmentWrapperProps>`
    top: anchor(bottom);
    margin-top: var(--spacing);
    right: anchor(right);
    ${(props) =>
      props.$isAnchoredOnDouble
        ? css`
            left: anchor(left);
          `
        : css`
            left: anchor(50%);
          `}
  `,
  "row-reverse": css<SegmentWrapperProps>`
    right: anchor(left);
    margin-right: var(--spacing);
    bottom: anchor(bottom);
    ${(props) =>
      props.$isAnchoredOnDouble
        ? css`
            top: anchor(top);
          `
        : css`
            top: anchor(50%);
          `}
  `,
  "column-reverse": css<SegmentWrapperProps>`
    bottom: anchor(top);
    margin-bottom: var(--spacing);
    left: anchor(left);
    ${(props) =>
      props.$isAnchoredOnDouble
        ? css`
            right: anchor(right);
          `
        : css`
            right: anchor(50%);
          `}
  `,
  row: css<SegmentWrapperProps>`
    left: anchor(right);
    margin-left: var(--spacing);
    top: anchor(top);
    ${(props) =>
      props.$isAnchoredOnDouble
        ? css`
            bottom: anchor(bottom);
          `
        : css`
            bottom: anchor(50%);
          `}
  `,
};

export default Snake;
