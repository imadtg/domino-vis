"use client";
import * as React from "react";

import { Move } from "@/lib/features/domino/dominoUtils";
import Button from "../Button";
import clsx from "clsx";
import { AiSearchResult, IterativeDeepeningProgressInfo } from "./aiWorker";

interface DominoAiMenuProps {
  className: string;
  doIterativeDeepening: (
    onProgress: (
      progressInfo: IterativeDeepeningProgressInfo,
      signal: AbortSignal,
    ) => Promise<void>,
  ) => Promise<void>;
}

function DominoAiMenu({ className, doIterativeDeepening }: DominoAiMenuProps) {
  // TODO: use a useReducer for these? because they are tightly coupled...
  const [iterativeDeepeningStatus, setIterativeDeepeningStatusStatus] =
    React.useState<"ongoing" | "idle" | "finished">("idle");
  const [latestSearchResult, setLatestSearchResult] =
    React.useState<AiSearchResult>();
  const [latestDepth, setLatestDepth] = React.useState<number>();

  async function submitMoveSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await startIterativeDeepening();
  }

  async function startIterativeDeepening() {
    if (iterativeDeepeningStatus === "ongoing") {
      window.alert("An AI search is already ongoing!");
      return;
    }
    setIterativeDeepeningStatusStatus("ongoing");
    await doIterativeDeepening(async (progressInfo, signal) => {
      if (signal.aborted) {
        return;
      }
      switch (progressInfo.status) {
        case "ongoing":
          setLatestSearchResult(progressInfo.searchResult);
          setLatestDepth(progressInfo.depth);
          break;
        case "interrupted":
          // this is unreachable with how we are reporting progress right now
          // and we shouldnt need it because we only interrupt the search as we pass the turn
          // thus hiding this menu
          setIterativeDeepeningStatusStatus("idle");
          setLatestSearchResult(undefined);
          setLatestDepth(undefined);
          break;
        case "finished":
          setIterativeDeepeningStatusStatus("finished");
          break;
      }
    });
  }

  return (
    <div className={clsx("flex flex-col", className)}>
      <form onSubmit={submitMoveSearch}>
        <fieldset className="flex flex-col gap-[8px] p-[8px]">
          <legend>Domino AI</legend>
          <Button className="whitespace-nowrap">Find best move!</Button>
        </fieldset>
      </form>
      {iterativeDeepeningStatus === "ongoing" ? (
        <p className="whitespace-nowrap">Searching...</p>
      ) : iterativeDeepeningStatus === "finished" ? (
        <p className="whitespace-nowrap">Search finished!</p>
      ) : null}
      {typeof latestSearchResult !== "undefined" &&
      latestSearchResult.status === "success" ? (
        <>
          <p className="whitespace-nowrap">Depth = {latestDepth}</p>
          <p className="whitespace-nowrap">
            Score = {latestSearchResult.score}
          </p>
          <p className="whitespace-nowrap">
            Explored nodes = {latestSearchResult.numberOfExploredNodes}
          </p>
        </>
      ) : null}
    </div>
  );
}
export default DominoAiMenu;
