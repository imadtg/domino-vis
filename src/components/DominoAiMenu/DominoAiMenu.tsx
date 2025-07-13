"use client";
import * as React from "react";

import { useAppDispatch } from "@/lib/hooks";

import { ModuleState } from "@/src/components/DominoAiMenu/dominoWasmStore";

import { Move } from "@/lib/features/domino/dominoUtils";
import Button from "../Button";
import clsx from "clsx";
import { getAiMove } from "./aiWorker";

// this whole component would ideally be just a button and then, with iterative deepening, highlight a move in DominoTable.
// perhaps we should add some global state / slice of highlighted move that we flush on every playMove

interface DominoAiMenuProps {
  className: string;
  setBestMove: (move?: Move) => void;
}

function DominoAiMenu({ className, setBestMove }: DominoAiMenuProps) {
  const dispatch = useAppDispatch();
  const [depth, setDepth] = React.useState("");
  /*const [searchStatus, setSearchStatus] = React.useState<
    "idle" | "searching" | "done"
  >("idle");*/
  const id = React.useId();
  /*const aiWorkerRef = React.useRef<Worker>();

  React.useEffect(() => {
    console.log('this is')
    aiWorkerRef.current = new Worker(new URL("./aiWorker.ts", import.meta.url));
    aiWorkerRef.current.onmessage = (event: MessageEvent<Move>) =>
      setBestMove(event.data)
    return () => {
      aiWorkerRef.current?.terminate();
    };
  }, []);

  function startAiSearch(depth: number) {
    aiWorkerRef.current?.postMessage(depth);
  }*/

  function submitMoveSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    //startAiSearch(parseInt(depth));
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

  return (
    <div className={clsx("flex flex-col", className)}>
      <form onSubmit={submitMoveSearch}>
        <fieldset className="flex flex-col gap-[8px] p-[8px]">
          <legend>Domino AI</legend>
          <label htmlFor={`${id}-depth`}>Depth of search</label>
          <input
            id={`${id}-depth`}
            type="text"
            value={depth}
            onChange={(event) => setDepth(event.target.value)}
            placeholder="20"
            pattern="[1-9][0-9]*"
          />
          <Button>Find best move!</Button>
        </fieldset>
      </form>
    </div>
  );
}
export default DominoAiMenu;
