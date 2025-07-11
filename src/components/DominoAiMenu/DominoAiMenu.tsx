"use client";
import * as React from "react";

import { playMove } from "@/lib/features/domino/dominoSlice";

import { useAppDispatch } from "@/lib/hooks";
import { addAppListener } from "@/lib/listenerMiddleware";

import { ModuleState } from "@/src/components/DominoAiMenu/dominoWasmStore";

import { Move } from "@/lib/features/domino/dominoUtils";
import DominoBlock from "../DominoBlock";
import Button from "../Button";
import clsx from "clsx";
import * as Comlink from "comlink";
import { WorkerType } from "./aiWorker";

// this whole component would ideally be just a button and then, with iterative deepening, highlight a move in DominoTable.
// perhaps we should add some global state / slice of highlighted move that we flush on every playMove, or just prop drill it from DominoPlayground...

function DominoAiMenu({ className }: { className: string }) {
  const dispatch = useAppDispatch();
  const [depth, setDepth] = React.useState("");
  const [bestMove, setBestMove] = React.useState<Move>();
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

  function playBestMove() {
    if (typeof bestMove === "undefined") {
      return;
    }
    dispatch(playMove(bestMove));
    setBestMove(undefined);
  }

  React.useEffect(() => {
    const unsubscribe = dispatch(
      addAppListener({
        actionCreator: playMove,
        effect: async () => {
          setBestMove(undefined);
        },
      }),
    );
    return unsubscribe;
  }, [dispatch]);

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
