"use client";
import * as React from "react";

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
      await aiWorkerInstance.current.init(ModuleState.Module.wasmMemory);
    }
    const searchResults = await aiWorkerInstance.current.getAiMove(
      ModuleState.game,
      depth,
    );
    if (searchResults.status === "success") {
      setBestMove(searchResults.bestMove);
    } else {
      console.log("AI search was cancelled!");
    }
  }

  function submitMoveSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startAiSearch(parseInt(depth));
  }

  async function cancelAiSearch() {
    if (typeof ModuleState.game === "undefined") {
      window.alert("No ongoing game!");
      return;
    }
    if (typeof ModuleState.fallbackPtr === "undefined") {
      throw new Error(
        "Attempted to cancel search but UI thread does not have the FALLBACK pointer!",
      );
    }
    const sharedMemory = ModuleState.Module.wasmMemory as WebAssembly.Memory;
    const sab = sharedMemory.buffer as unknown as SharedArrayBuffer;
    const dv = new DataView(sab);
    if (dv.getInt32(ModuleState.fallbackPtr, true)) {
      window.alert("No ongoing AI search!");
      return;
    }
    dv.setInt32(ModuleState.fallbackPtr, 1, true);
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
          {/* TODO: this should not be here, but instead happen whenever the player plays a move while the AI search is ongoing */}
          <Button type="button" onClick={cancelAiSearch}>
            Cancel search!
          </Button>
        </fieldset>
      </form>
    </div>
  );
}
export default DominoAiMenu;
