"use client";
import * as React from "react";

import { playMove } from "@/lib/features/domino/dominoSlice";

import { useAppDispatch } from "@/lib/hooks";

import { ModuleState } from "@/lib/features/domino/dominoWasmMiddleware";

import {
  extractLeft,
  extractRight,
  extractHead,
  newMovesContext,
} from "@/public/wasm/cToJShelpers";

import { Move } from "@/lib/features/domino/dominoUtils";
import DominoBlock from "../DominoBlock";
import Button from "../Button";
import clsx from "clsx";

// this whole component would ideally be just a button and then, with iterative deepening, highlight a move in DominoTable.

function getAiMove(Module: any, game: number, depth: number): Move {
  const { move } = newMovesContext(Module); // MEMORY LEAK!!!
  Module.ccall(
    "populate_best_move",
    null,
    ["number", "number", "number"],
    [game, depth, move],
  );
  return {
    piece: {
      left: extractLeft(Module, move),
      right: extractRight(Module, move),
    },
    side: extractHead(Module, move) ? "right" : "left",
  };
}

function DominoAiMenu({ className }: { className: string }) {
  const dispatch = useAppDispatch();
  const [depth, setDepth] = React.useState("");
  const [bestMove, setBestMove] = React.useState<Move>();
  /*const [searchStatus, setSearchStatus] = React.useState<
    "idle" | "searching" | "done"
  >("idle");*/
  const id = React.useId();
  function submitMoveSearch(event: any) {
    event.preventDefault();
    if (
      typeof ModuleState.Module === "undefined" ||
      typeof ModuleState.game === "undefined"
    ) {
      return;
    }
    setBestMove(
      getAiMove(ModuleState.Module, ModuleState.game, parseInt(depth)),
    );
  }
  function playBestMove() {
    if (typeof bestMove === "undefined") {
      return;
    }
    dispatch(playMove(bestMove));
    setBestMove(undefined);
  }
  return (
    <div className={clsx("flex flex-col", className)}>
      <form onSubmit={submitMoveSearch}>
        <fieldset className="flex flex-col gap-[8px] p-[8px]">
          <legend>Domino AI</legend>
          <label htmlFor={`${id}-depth`}>Depth of search</label>
          <input
            type="text"
            value={depth}
            onChange={(event) => setDepth(event.target.value)}
            placeholder="20"
            pattern="[1-9][0-9]*"
          />
          <Button>Find best move!</Button>
        </fieldset>
      </form>
      {bestMove && (
        <div>
          Best move is{" "}
          <DominoBlock
            as="span"
            className="inline-block"
            dominoGroupId="ai-move-preview"
            piece={bestMove.piece}
          />{" "}
          on the {bestMove.side},{" "}
          <Button onClick={playBestMove}>Play it!</Button>
        </div>
      )}
    </div>
  );
}
export default DominoAiMenu;
