export interface DominoPiece {
  left: number;
  right: number;
}

export type Side = "left" | "right";

export interface Move {
  piece: DominoPiece;
  side: Side;
}

export interface DominoIngameInfo {
  turn: number;
  snake: DominoPiece[];
  hands: DominoPiece[][];
}

export function comparePieces(
  piece1: DominoPiece,
  piece2: DominoPiece
): boolean {
  if (piece1.left === piece2.left && piece1.right === piece2.right) {
    return true;
  }
  if (piece1.left === piece2.right && piece1.right === piece2.left) {
    return true;
  }
  return false;
}

export function turnAround({left, right}: DominoPiece): DominoPiece {
  return {left: right, right: left};
}

export function getAllDominoes(): DominoPiece[] {
  let dominoes: DominoPiece[] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = 0; j <= i; j++) {
      dominoes.push({ left: i, right: j });
    }
  }
  return dominoes;
}

export function getPlayableSides(snake: DominoPiece[], piece: DominoPiece): Side[] {
  if (snake.length === 0) {
    return ["left", "right"];
  }
  let sides = [] as Side[];
  if (snake[0].left === piece.right || snake[0].left === piece.left) {
    sides.push("left");
  }
  if (snake.at(-1)?.right === piece.right || snake.at(-1)?.right === piece.left) {
    sides.push("right");
  } 
  return sides;
}