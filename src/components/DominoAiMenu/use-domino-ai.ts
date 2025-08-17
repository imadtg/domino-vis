import {
  initialize,
  playMove,
  pass,
  isPlaying,
  perfectPick,
  imperfectPick,
} from "../../../lib/features/domino/dominoSlice";
import {
  DominoIngameInfo,
  Move,
  normalizeMove,
} from "../../../lib/features/domino/dominoUtils";
import { PayloadAction } from "@reduxjs/toolkit";

import * as Comlink from "comlink";
import { WorkerType } from "./aiWorker";
import { useAppDispatch } from "@/lib/hooks";
import * as React from "react";
import { addAppListener } from "@/lib/listenerMiddleware";
import { IterativeDeepeningProgressInfo } from "./aiWorker";

interface AiWorkerContext {
  aiWorker: Comlink.Remote<WorkerType>;
  sab: SharedArrayBuffer;
  fallbackPtr: number;
}

export type AiSearchCancellationResult = "success" | "no ongoing search";

export default function useDominoAi() {
  const dispatch = useAppDispatch();
  const aiWorkerContextRef = React.useRef<AiWorkerContext>();

  React.useEffect(() => {
    const bareAiWorker = new Worker(new URL("./aiWorker.ts", import.meta.url));
    async function initAiWorkerContextEnv() {
      const aiWorker = Comlink.wrap<WorkerType>(bareAiWorker);
      await aiWorker.init();
      const sab = await aiWorker.getSharedArrayBuffer();
      const fallbackPtr = await aiWorker.getFallbackPtr();
      aiWorkerContextRef.current = { aiWorker, sab, fallbackPtr };
    }
    const aiWorkerInitPromise = initAiWorkerContextEnv();
    // should we save this promise in a ref and await it instead of erroring when AI worker context is not ready?
    // due to the nature of awaiting, we would not have the guarantee that the listeners below will postMessage their actions to the worker in order if we start awaiting inside of the listener...
    return () => {
      // we await this because we have no nice way of cancelling it
      // and calling the rpc style wrapper functions of the worker with it terminated causes problems
      console.log("debug 1");
      aiWorkerInitPromise.then(() => {
        console.log("debug 2");
        bareAiWorker.terminate();
        console.log("debug 3");
      });
    };
  }, []);

  // the following listeners rely HEAVILY on being set up before any dominoSlice reducers are called!
  // TODO: we should probably add a useEffect that would initialize engine state with current dominoSlice state so that we would be freed from having to call this hook before any dominoSlice actions!
  // perhaps by simply calling aiWorkerContextRef.current.aiWorker.initialize(state.dominoIngameInfo)

  React.useEffect(() => {
    const unsubscribe = dispatch(
      addAppListener({
        actionCreator: initialize,
        effect: async (action: PayloadAction<DominoIngameInfo>) => {
          console.log(
            "Wasm middleware listened for initialize: ",
            action.payload,
          );
          if (typeof aiWorkerContextRef.current === "undefined") {
            throw new Error("AI Worker is not ready!");
          }
          await aiWorkerContextRef.current.aiWorker.initialize(action.payload);
        },
      }),
    );
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    const unsubscribe = dispatch(
      addAppListener({
        actionCreator: playMove,
        effect: async (action: PayloadAction<Move>, listenerApi) => {
          console.log(
            "Wasm middleware listened for playMove: ",
            action.payload,
          );
          const { dominoGame } = listenerApi.getOriginalState();
          if (!isPlaying(dominoGame)) {
            throw new Error(
              "playMove action was dispatched with no ongoing game!",
            ); // this should NEVER happen
          }
          const { gameInfo } = dominoGame;
          console.log(gameInfo);
          const normalizedMove = normalizeMove(action.payload, gameInfo.snake);
          if (typeof aiWorkerContextRef.current === "undefined") {
            throw new Error("AI Worker is not ready!");
          }
          await aiWorkerContextRef.current.aiWorker.playMove(normalizedMove);
        },
      }),
    );
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    const unsubscribe = dispatch(
      addAppListener({
        actionCreator: pass,
        effect: async (action) => {
          console.log("Wasm middleware listened for pass: ", action.payload);
          if (typeof aiWorkerContextRef.current === "undefined") {
            throw new Error("AI Worker is not ready!");
          }
          await aiWorkerContextRef.current.aiWorker.pass();
        },
      }),
    );
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    const unsubscribe = dispatch(
      addAppListener({
        actionCreator: perfectPick,
        effect: async (action) => {
          console.log(
            "Wasm middleware listened for perfectPick: ",
            action.payload,
          );
          if (typeof aiWorkerContextRef.current === "undefined") {
            throw new Error("AI Worker is not ready!");
          }
          await aiWorkerContextRef.current.aiWorker.perfectPick(action.payload);
        },
      }),
    );
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    const unsubscribe = dispatch(
      addAppListener({
        actionCreator: imperfectPick,
        effect: async (action) => {
          console.log(
            "Wasm middleware listened for imperfectPick: ",
            action.payload,
          );
          if (typeof aiWorkerContextRef.current === "undefined") {
            throw new Error("AI Worker is not ready!");
          }
          await aiWorkerContextRef.current.aiWorker.imperfectPick(
            action.payload,
          );
        },
      }),
    );
    return unsubscribe;
  }, []);

  const aiSearchAbortControllerRef = React.useRef<AbortController>(
    new AbortController(),
  );

  function cancelAiSearch(): AiSearchCancellationResult {
    if (typeof aiWorkerContextRef.current === "undefined") {
      throw new Error("AI Worker is not ready!");
    }
    console.log("Cancelling ai search!");
    const i32 = new Int32Array(aiWorkerContextRef.current.sab);
    const idx = aiWorkerContextRef.current.fallbackPtr >>> 2; // divide by 4 because we are converting a byte pointer to a 4 byte index
    const prev = Atomics.exchange(i32, idx, 1);
    if (prev === 1) {
      console.log("Turns out, no search was ongoing!");
      return "no ongoing search";
    }
    aiSearchAbortControllerRef.current.abort();
    console.log("Search cancelled!");
    return "success";
  }

  const [aiSearchIsOngoing, setAiSearchIsOngoing] =
    React.useState<boolean>(false); // this may be a performance bottleneck when we do iterative deepening...

  const [bestMove, setBestMove] = React.useState<Move>();
  React.useEffect(() => {
    const unsubscribe = dispatch(
      addAppListener({
        actionCreator: playMove,
        effect: async () => {
          cancelAiSearch();
          setBestMove(undefined);
          aiSearchAbortControllerRef.current = new AbortController();
        },
      }),
    );
    return unsubscribe;
  }, [cancelAiSearch]);

  return {
    getAiMove: async (depth: number) => {
      if (typeof aiWorkerContextRef.current === "undefined") {
        throw new Error("AI Worker is not ready!");
      }
      setAiSearchIsOngoing(true);
      const result = await aiWorkerContextRef.current.aiWorker.getAiMove(depth);
      if (result.status === "success") {
        setBestMove(result.bestMove);
      }
      setAiSearchIsOngoing(false);
      return result;
    },
    doIterativeDeepening: async (
      onProgress: (
        progressInfo: IterativeDeepeningProgressInfo,
        { signal }: { signal: AbortSignal },
      ) => Promise<void>,
    ) => {
      if (typeof aiWorkerContextRef.current === "undefined") {
        throw new Error("AI Worker is not ready!");
      }
      setAiSearchIsOngoing(true);
      const abortSignal = aiSearchAbortControllerRef.current.signal;
      async function onProgressWrapper(
        progressInfo: IterativeDeepeningProgressInfo,
      ) {
        // is this sufficient? do we not need to setup an onabort thing here?
        if (abortSignal.aborted) {
          return;
        }
        if (progressInfo.status === "ongoing") {
          setBestMove(progressInfo.searchResult.bestMove);
        }
        return await onProgress(progressInfo, { signal: abortSignal });
      }
      await aiWorkerContextRef.current.aiWorker.doIterativeDeepening(
        Comlink.proxy(onProgressWrapper),
      );
      setAiSearchIsOngoing(false);
    },
    cancelAiSearch,
    aiSearchIsOngoing,
    bestMove,
  };
}
