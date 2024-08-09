"use client";
import DominoBlock, { Orientation } from "@/src/components/DominoBlock";
import React from "react";
import {
  comparePieces,
  DominoPiece,
  turnAround,
} from "@/lib/features/domino/dominoUtils";
import Button from "@/src/components/Button";

function PiecePlaygroundPage() {
  const [pieces, setPieces] = React.useState<DominoPiece[]>([]);
  const [pendingPiece, setPendingPiece] = React.useState<DominoPiece>();
  const [left, setLeft] = React.useState("0");
  const [right, setRight] = React.useState("0");
  function handleSubmitPiece(event: React.FormEvent) {
    event.preventDefault();
    const tentativePiece = { left: parseInt(left), right: parseInt(right) };
    if (pieces.find((piece) => comparePieces(piece, tentativePiece))) {
      window.alert("Piece already added!");
      return;
    }
    setPendingPiece(tentativePiece);
  }
  return (
    <div className="grid h-screen place-content-center">
      <form
        className="fixed left-0 right-0 top-0 m-auto flex w-fit flex-col"
        onSubmit={handleSubmitPiece}
      >
        <fieldset className="flex gap-[8px] p-[8px]">
          <legend>Enter Piece</legend>
          <label htmlFor="left">Left pip:</label>
          <input
            type="number"
            min={0}
            max={6}
            id="left"
            value={left}
            placeholder="0"
            onChange={(event) => setLeft(event.target.value)}
          />
          <label htmlFor="right">Right pip:</label>
          <input
            type="number"
            min={0}
            max={6}
            id="right"
            value={right}
            placeholder="0"
            onChange={(event) => setRight(event.target.value)}
          />
        </fieldset>
        <Button>Submit</Button>
      </form>
      <div className="relative flex items-center gap-[8px]">
        {pendingPiece && (
          <Button
            onClick={() => {
              setPieces([pendingPiece, ...pieces]);
              setPendingPiece(undefined);
            }}
            className="absolute left-[-8px] -translate-x-full"
          >
            left
          </Button>
        )}
        {pieces.map((piece) => (
          <PlayfullDominoBlock
            key={`${piece.left}-${piece.right}`}
            piece={piece}
          />
        ))}
        {pendingPiece && (
          <Button
            onClick={() => {
              setPieces([...pieces, pendingPiece]);
              setPendingPiece(undefined);
            }}
            className="absolute right-[-8px] translate-x-full"
          >
            right
          </Button>
        )}
      </div>
    </div>
  );
}

function PlayfullDominoBlock({ piece }: { piece: DominoPiece }) {
  const [orientation, setOrientation] =
    React.useState<Orientation>("horizontal");
  const [swap, setSwap] = React.useState(false);
  function handleClick() {
    if (orientation == "horizontal") {
      setOrientation("vertical");
    } else {
      setOrientation("horizontal");
    }
  }
  function handleContextMenu(event: React.MouseEvent) {
    event.preventDefault();
    setSwap(!swap);
  }
  return (
    <DominoBlock
      piece={swap ? turnAround(piece) : piece}
      orientation={orientation}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    />
  );
}

export default PiecePlaygroundPage;
