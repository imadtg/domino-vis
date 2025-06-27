import { produce } from "immer";

export interface DominoPiece {
  left: number;
  right: number;
  origin?: number | 'boneyard'; // keep track of each piece's origin (here, it simply means where it had certain presence for the first time) for animation purposes
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
  let collapsed = false;
  // so many bugs awaiting discovery in this jungle of arrays...
  // TODO: separate this into smaller collapse functions and utilities
  const nextGameInfo = produce(gameInfo, (oldGameInfo) => {
    [...oldGameInfo.hands, oldGameInfo.boneyard].forEach((hand, index) => {
      if (
        hand.pieces.length === hand.count &&
        hand.pieces.some(({ presence }) => presence === "possible")
      ) {
        collapsed = true;
        hand.pieces = hand.pieces.map(({ piece }) => ({
          piece,
          presence: "certain",
        }));

        [...oldGameInfo.hands, oldGameInfo.boneyard].forEach(
          (otherHand, otherIndex) => {
            if (index === otherIndex) {
              return;
            }
            otherHand.pieces = otherHand.pieces.filter(
              ({ piece: otherPiece }) =>
                !hand.pieces.some(({ piece }) =>
                  comparePieces(piece, otherPiece),
                ),
            );
          },
        );
      }
      const certainPiecePresences = hand.pieces.filter(({presence}) => presence === 'certain')
      if (hand.count === certainPiecePresences.length && hand.pieces.length > hand.count) {
        collapsed = true;
        hand.pieces = certainPiecePresences;
      }
    });
    // TODO: should this trigger another collapse?
    const piecePresences = [
      ...oldGameInfo.hands.flatMap(({ pieces }) => pieces),
      ...oldGameInfo.boneyard.pieces,
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
      }
    });
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

export function turnAround({ left, right, ...rest }: DominoPiece): DominoPiece { // rest is only holding the origin attribute for now but this is more future proof
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
