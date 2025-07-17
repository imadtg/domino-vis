"use client";
import * as React from "react";

import { Move } from "@/lib/features/domino/dominoUtils";
import Button from "../Button";
import clsx from "clsx";
import { AiSearchCancellationResult } from "./use-domino-ai";
import { AiSearchResult } from "./aiWorker";

interface DominoAiMenuProps {
  className: string;
  setBestMove: (move?: Move) => void;
  getAiMove: (depth: number) => Promise<AiSearchResult>;
}

function DominoAiMenu({
  className,
  setBestMove,
  getAiMove,
}: DominoAiMenuProps) {
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
    // there is most likely a race condition here, for the brief moment where we have finished a search and we are proceeding to the next one
    // we have no way of knowing that a search is already ongoing via iterative deepening and thus we could not prevent another search from being interleaved, or worse, another iterative deepening!
    // perhaps a solution to this is to move iterative deepening inside of the useDominoAi hook and use a callback to set the best move...
    // if we decide to move this function to useDominoAi, we should accept a callback to set the bestMove and also return the bestMove (idk whether to use Move type or AiSearchResult type here though...)!
    if (iterativeDeepeningStatus === "ongoing") {
      window.alert("An AI search is already ongoing!");
      return;
    }
    setIterativeDeepeningStatusStatus("ongoing");
    let currentDepth = 1;
    let lastNumberOfExploredNodes;
    let currentNumberOfExploredNodes = 0;
    let searchResults: AiSearchResult;
    do {
      searchResults = await getAiMove(currentDepth);
      if (searchResults.status === "aborted") {
        console.log("AI search was cancelled!");
        setIterativeDeepeningStatusStatus("idle");
        setLatestSearchResult(undefined);
        setLatestDepth(undefined);
        return;
      }
      setLatestSearchResult(searchResults);
      setLatestDepth(currentDepth);
      setBestMove(searchResults.bestMove);
      currentDepth++;
      lastNumberOfExploredNodes = currentNumberOfExploredNodes;
      currentNumberOfExploredNodes = searchResults.numberOfExploredNodes;
    } while (currentNumberOfExploredNodes > lastNumberOfExploredNodes);
    setIterativeDeepeningStatusStatus("finished");
    console.log("Iterative deepening has finished!");
    // final depth is one more than max depth because a deeper search is needed to verify that the previous search was indeed with the maximum depth
    console.log(`Final depth: ${currentDepth}, Max depth: ${currentDepth - 1}`);
    console.log(`Final search results: ${JSON.stringify(searchResults)}`);
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
