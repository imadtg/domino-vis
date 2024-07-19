export interface DominoPiece {
  left: number;
  right: number;
}

export interface Move {
  piece: DominoPiece;
  side: "left" | "right";
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

export function getAllDominoes(): DominoPiece[] {
  let dominoes: DominoPiece[] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = 0; j <= i; j++) {
      dominoes.push({ left: i, right: j });
    }
  }
  return dominoes;
}
