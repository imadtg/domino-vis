import { USER } from "@/src/components/GameInitMenu";
import { produce } from "immer";
import next from "next";
import posthog from "posthog-js";

export interface DominoPiece {
  left: number;
  right: number;
  origin?: number | "boneyard"; // keep track of each piece's origin (here, it simply means where it had certain presence for the first time) for animation purposes
}

export type Side = "left" | "right";

export interface Move {
  piece: DominoPiece;
  side: Side;
}

export type Presence = "certain" | "possible";

// i need a better name for this...
export interface DominoPiecePresence {
  piece: DominoPiece;
  presence: Presence;
}

export type SnakeInfo = DominoPiece[];

export interface HandInfo {
  pieces: DominoPiecePresence[];
  count: number;
}
export interface DominoIngameInfo {
  turn: number;
  snake: SnakeInfo;
  hands: HandInfo[];
  boneyard: HandInfo;
}

export function collapse(gameInfo: DominoIngameInfo): DominoIngameInfo {
  posthog.capture("collapse round attempted", { gameInfoBefore: gameInfo });
  let collapsed = false;
  // so many bugs awaiting discovery in this jungle of arrays...
  // TODO: separate this into smaller collapse functions and utilities
  const nextGameInfo = produce(gameInfo, (oldGameInfo) => {
    [oldGameInfo.boneyard, ...oldGameInfo.hands].forEach((hand, index) => {
      if (
        hand.pieces.length === hand.count &&
        hand.pieces.some(({ presence }) => presence === "possible")
      ) {
        collapsed = true;
        hand.pieces = hand.pieces.map(({ piece }) => ({
          piece,
          presence: "certain",
        }));
        posthog.capture("collapse happened", {
          reason:
            "piece presence count is the same as hand piece count, while still some piece presences are not certain",
          collapsedHandOf:
            index === 0 ? "boneyard" : index - 1 === USER ? "user" : "opponent",
          collapsedHandIndex: index,
          // NOTE: original isnt the same as before, since we are doing multitudes of collapses per round,
          // you really have to check the timeline of events to see the full picture... original is given here just as a nicety...
          // TODO: perhaps do deep copies to track before if it becomes cumbersome to track?
          collapsedHandOriginal:
            index === 0 ? gameInfo.boneyard : gameInfo.hands[index - 1],
          collapsedHandAfter: hand,
          gameInfoOriginal: gameInfo,
        });

        [oldGameInfo.boneyard, ...oldGameInfo.hands].forEach(
          (otherHand, otherIndex) => {
            if (index === otherIndex) {
              return;
            }
            if (
              otherHand.pieces.some(({ piece: otherPiece }) =>
                hand.pieces.some(({ piece }) =>
                  comparePieces(piece, otherPiece),
                ),
              )
            ) {
              otherHand.pieces = otherHand.pieces.filter(
                ({ piece: otherPiece }) =>
                  !hand.pieces.some(({ piece }) =>
                    comparePieces(piece, otherPiece),
                  ),
              );
              posthog.capture("collapse happened", {
                reason:
                  "after a hand that had all its possible piece presences made certain, those piece presences are removed from other hands",
                collapsedHandOf:
                  otherIndex === 0
                    ? "boneyard"
                    : otherIndex - 1 === USER
                      ? "user"
                      : "opponent",
                collapsedHandIndex: otherIndex,
                collapsedHandOriginal:
                  otherIndex === 0
                    ? gameInfo.boneyard
                    : gameInfo.hands[otherIndex - 1],
                collapsedHandAfter: otherHand,
                gameInfoOriginal: gameInfo,
              });
            }
          },
        );
      }
      const certainPiecePresences = hand.pieces.filter(
        ({ presence }) => presence === "certain",
      );
      if (
        hand.count === certainPiecePresences.length &&
        hand.pieces.length > hand.count
      ) {
        collapsed = true;
        hand.pieces = certainPiecePresences;
        posthog.capture("collapse happened", {
          reason:
            "the amount of certain piece presences reached the hand piece count, thus all other possible piece presences are removed",
          collapsedHandOf:
            index === 0 ? "boneyard" : index - 1 === USER ? "user" : "opponent",
          collapsedHandIndex: index,
          collapsedHandOriginal:
            index === 0 ? gameInfo.boneyard : gameInfo.hands[index - 1],
          collapsedHandAfter: hand,
          gameInfoOriginal: gameInfo,
        });
      }
    });
    const piecePresences = [
      ...oldGameInfo.boneyard.pieces,
      ...oldGameInfo.hands.flatMap(({ pieces }) => pieces),
    ];
    const possiblePiecePresences = piecePresences.filter(
      ({ presence }) => presence === "possible",
    );
    possiblePiecePresences.forEach((piecePresence) => {
      if (
        possiblePiecePresences.filter(({ piece }) =>
          comparePieces(piece, piecePresence.piece),
        ).length === 1
      ) {
        piecePresence.presence = "certain";
        collapsed = true;
        posthog.capture("collapse happened", {
          reason:
            "there was a possible piece presence unique to one hand, then it should be a certain piece presence",
          piecePresence,
        });
      }
    });
  });
  posthog.capture("collapse round finished", {
    roundGameInfoOriginal: gameInfo,
    roundGameInfoAfter: nextGameInfo,
    final: !collapsed, // the final round is one where gameInfo doesnt update at all, basically a sanity check that no more collapses can propagate
  });
  if (collapsed) {
    return collapse(nextGameInfo);
  }
  return nextGameInfo;
}

export function normalizeMove(move: Move, snake: SnakeInfo): Move {
  // assumes move is valid
  if (
    snake.length === 0 ||
    (move.side === "left" && snake.at(0)?.left === move.piece.right) ||
    (move.side === "right" && snake.at(-1)?.right === move.piece.left)
  ) {
    return move;
  }
  return { ...move, piece: turnAround(move.piece) };
}

export function comparePieces( // TODO: rename to piecesAreSame or something more significative of its return value
  piece1: DominoPiece,
  piece2: DominoPiece,
): boolean {
  if (piece1.left === piece2.left && piece1.right === piece2.right) {
    return true;
  }
  if (piece1.left === piece2.right && piece1.right === piece2.left) {
    return true;
  }
  return false;
}

export function turnAround({ left, right, ...rest }: DominoPiece): DominoPiece {
  // rest is only holding the origin attribute for now but this is more future proof
  return { left: right, right: left, ...rest };
}

export function getAllDominoes(): DominoPiece[] {
  let dominoes: DominoPiece[] = [];
  // pieces are hardcoded to be of a double six set
  for (let i = 0; i <= 6; i++) {
    for (let j = 0; j <= i; j++) {
      dominoes.push({ left: i, right: j });
    }
  }
  return dominoes;
}

export function getPlayableSides(
  snake: DominoPiece[],
  piece: DominoPiece,
): Side[] {
  if (snake.length === 0) {
    return ["left", "right"];
  }
  let sides = [] as Side[];
  if (snake[0].left === piece.right || snake[0].left === piece.left) {
    sides.push("left");
  }
  if (
    snake.at(-1)?.right === piece.right ||
    snake.at(-1)?.right === piece.left
  ) {
    sides.push("right");
  }
  return sides;
}
