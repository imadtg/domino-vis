"use client";
import * as React from "react";
import {
  comparePieces,
  turnAround,
  DominoPiece,
  Side,
} from "@/lib/features/domino/dominoUtils";
import DominoBlock from "../DominoBlock";
import detectElementOverflow from "detect-element-overflow";
import Button from "../Button";
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
  debug?: boolean;
}

function Snake({ snake, onSideClick, debug = false }: SnakeProps) {
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

  const leftSegmentRef = React.useRef<HTMLDivElement>();
  const rightSegmentRef = React.useRef<HTMLDivElement>();

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

  // TODO: fix framer motion animation skipping rotation after the effect below runs.
  React.useLayoutEffect(() => {
    if (debug) {
      return;
    }
    if (!leftSegmentRef.current || !leftSegmentRef.current.parentElement) {
      return;
    }
    const leftOverflowInfo = detectElementOverflow(
      leftSegmentRef.current,
      leftSegmentRef.current.parentElement,
    );
    console.log({
      leftOverflowInfo,
      segments,
      leftSegmentElement: leftSegmentRef.current,
    });
    if (
      leftOverflowInfo.collidedLeft ||
      leftOverflowInfo.collidedRight ||
      leftOverflowInfo.collidedTop ||
      leftOverflowInfo.collidedBottom
    ) {
      console.log("segmenting on the left");
      setSegmentBreakpoints([
        relativeIndex(segments[0][0]) + 1, // set a new breakpoint at the index after the leftmost piece.
        ...segmentBreakpoints,
      ]);
    }
    if (
      !rightSegmentRef.current ||
      !rightSegmentRef.current.parentElement ||
      rightSegmentRef.current === leftSegmentRef.current
    ) {
      return;
    }
    const rightOverflowInfo = detectElementOverflow(
      rightSegmentRef.current,
      rightSegmentRef.current.parentElement,
    );
    console.log({
      rightOverflowInfo,
      segments,
      rightSegmentElement: rightSegmentRef.current,
    });
    if (
      rightOverflowInfo.collidedLeft ||
      rightOverflowInfo.collidedRight ||
      rightOverflowInfo.collidedTop ||
      rightOverflowInfo.collidedBottom
    ) {
      console.log("segmenting on the right");
      setSegmentBreakpoints([
        ...segmentBreakpoints,
        // i have to figure out how to narrow this type without assertions
        relativeIndex((segments.at(-1) as DominoPiece[]).at(-1) as DominoPiece), // set a new breakpoint at the index of the rightmost piece. so the rightmost piece will be in a new segment.
      ]);
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

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 outline-dashed outline-red-600">
      {[...rightDirectedSegments, ...leftDirectedSegments].map(
        ({ segment, direction, index }) => (
          <SnakeSegment
            key={index - originSegmentIndex}
            index={index - originSegmentIndex}
            ref={(element: HTMLDivElement) => {
              if (index === 0) {
                leftSegmentRef.current = element;
              }
              if (index === segments.length - 1) {
                rightSegmentRef.current = element;
              }
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
            onPieceClick={
              debug ? (piece) => toggleBreakpoint(piece) : undefined
            }
            highlightPiece={debug ? pieceIsBreakpoint : undefined}
            isAnchoredOnDouble={segmentIsAnchoredOnDouble(index)}
          />
        ),
      )}
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
    }: SnakeSegmentProps,
    ref,
  ) => {
    return (
      <SegmentWrapper
        $index={index}
        $direction={direction}
        $isAnchoredOnDouble={isAnchoredOnDouble}
        className="absolute flex items-center gap-[--spacing]"
        ref={ref}
      >
        {onLeftSideClick && (
          <Button
            className="absolute -left-2 -translate-x-full transform"
            onClick={onLeftSideClick}
          >
            left
          </Button>
        )}
        {segment.map((piece, pieceIndex) => (
          <DominoBlockWrapper
            $anchorName={
              segment.length === 1
                ? `--left-${index}, --right-${index}`
                : pieceIndex === 0
                  ? `--left-${index}`
                  : pieceIndex === segment.length - 1
                    ? `--right-${index}`
                    : undefined
            }
            key={`${piece.left}-${piece.right}`}
          >
            <DominoBlock
              piece={
                direction === "row" || direction === "column
                  ? piece
                  : turnAround(piece)
              }
              orientation={
                direction === "row" || direction === "row-reverse"
                  ? piece.left !== piece.right
                    ? "horizontal"
                    : "vertical"
                  : piece.left !== piece.right
                    ? "vertical"
                    : "horizontal"
              }
              className="block"
              as={onPieceClick ? "button" : "div"}
              onClick={onPieceClick ? () => onPieceClick(piece) : undefined}
              variant={highlightPiece?.(piece) ? "highlighted" : "default"}
            />
          </DominoBlockWrapper>
        ))}
        {onRightSideClick && (
          <Button
            className="absolute -right-2 translate-x-full transform"
            onClick={onRightSideClick}
          >
            right
          </Button>
        )}
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
