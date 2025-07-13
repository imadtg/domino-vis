"use client";
import * as React from "react";

import { useAppDispatch } from "@/lib/hooks";

import { ModuleState } from "@/src/components/DominoAiMenu/dominoWasmStore";

import { Move } from "@/lib/features/domino/dominoUtils";
import Button from "../Button";
import clsx from "clsx";
import * as Comlink from "comlink";
import { WorkerType } from "./aiWorker";

interface DominoAiMenuProps {
  className: string;
  setBestMove: (move?: Move) => void;
}

function DominoAiMenu({ className, setBestMove }: DominoAiMenuProps) {
  const dispatch = useAppDispatch();
  const [depth, setDepth] = React.useState("");
  const id = React.useId();
  const aiWorkerRef = React.useRef<Worker>();
  const aiWorkerInstance = React.useRef<Comlink.Remote<WorkerType>>();

  React.useEffect(() => {
    aiWorkerRef.current = new Worker(new URL("./aiWorker.ts", import.meta.url));
    aiWorkerInstance.current = Comlink.wrap(aiWorkerRef.current);
    return () => {
      aiWorkerRef.current?.terminate();
    };
  }, []);

  async function startAiSearch(depth: number) {
    if (typeof aiWorkerInstance.current === "undefined") {
      window.alert("Worker instance is not ready yet...");
      return;
    }
    if (typeof ModuleState.game === "undefined") {
      window.alert("No ongoing game!");
      return;
    }
    if (!(await aiWorkerInstance.current.isInitialized())) {
      console.log("we will now check if our wasm memory is shared");
      console.log(
        ModuleState.Module.buffer instanceof SharedArrayBuffer,
      );
      await aiWorkerInstance.current.init(ModuleState.Module.wasmMemory);
    }
    setBestMove(
      await aiWorkerInstance.current.getAiMove(ModuleState.game, depth),
    );
  }

  function submitMoveSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startAiSearch(parseInt(depth));
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
