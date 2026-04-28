"use client";
import React from "react";
import {
  comparePieces,
  DominoPiece,
  getAllDominoes,
  Side,
} from "@/lib/features/domino/dominoUtils";
import Button from "@/src/components/Button";
import Snake from "@/src/components/Snake";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SnakePlaygroundPage() {
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
  function autoPiece(side: Side) {
    const generatedPiece = getAllDominoes().find(
      (piece) => !pieces.some((takenPiece) => comparePieces(takenPiece, piece)),
    );
    if (!generatedPiece) {
      return;
    }
    if (side === "right") {
      setPieces([...pieces, generatedPiece]);
    } else {
      setPieces([generatedPiece, ...pieces]);
    }
  }
  return (
    <div className="grid h-screen place-content-center">
      <div className="fixed inset-0 grid place-items-center p-16">
        <Snake
          snake={pieces}
          onSideClick={(side) =>
            pendingPiece
              ? () => {
                  if (side === "left") {
                    setPieces([pendingPiece, ...pieces]);
                    setPendingPiece(undefined);
                  } else {
                    setPieces([...pieces, pendingPiece]);
                    setPendingPiece(undefined);
                  }
                }
              : undefined
          }
          debug={true}
        />
      </div>
      <form
        className="fixed left-0 right-0 top-0 m-auto flex w-fit flex-col"
        onSubmit={handleSubmitPiece}
      >
        <fieldset className="flex gap-[8px] p-[8px]">
          <legend>Enter Piece</legend>
          <Label htmlFor="left">Left pip:</Label>
          <Input
            type="number"
            min={0}
            max={6}
            id="left"
            value={left}
            placeholder="0"
            onChange={(event) => setLeft(event.target.value)}
          />
          <Label htmlFor="right">Right pip:</Label>
          <Input
            type="number"
            min={0}
            max={6}
            id="right"
            value={right}
            placeholder="0"
            onChange={(event) => setRight(event.target.value)}
          />
        </fieldset>
        <Button type="submit">Submit</Button>
      </form>
      <Button
        className="fixed bottom-0 left-0 top-0 my-auto h-fit"
        onClick={() => autoPiece("left")}
      >
        auto left
      </Button>
      <Button
        className="fixed bottom-0 right-0 top-0 my-auto h-fit"
        onClick={() => autoPiece("right")}
      >
        auto right
      </Button>
    </div>
  );
}

export default SnakePlaygroundPage;
