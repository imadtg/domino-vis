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
  cancelAiSearch: () => AiSearchCancellationResult;
  aiSearchIsOngoing: boolean;
}

function DominoAiMenu({
  className,
  setBestMove,
  getAiMove,
  cancelAiSearch,
  aiSearchIsOngoing,
}: DominoAiMenuProps) {
  const [depth, setDepth] = React.useState("");
  const id = React.useId();

  async function startAiSearch(depth: number) {
    if (aiSearchIsOngoing) {
      window.alert("An AI search is already ongoing!");
      return;
    }
    const searchResults = await getAiMove(depth);
    if (searchResults.status === "success") {
      setBestMove(searchResults.bestMove);
    } else if (searchResults.status === "aborted") {
      console.log("AI search was cancelled!");
    }
  }

  function submitMoveSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startAiSearch(parseInt(depth));
  }

  function onCancelSearch() {
    const result = cancelAiSearch();
    if (result === "no ongoing search") {
      window.alert("No ongoing AI search!");
    }
  }

  async function startIterativeDeepening() {
    // there is most likely a race condition here, for the brief moment where we have finished a search and we are proceeding to the next one
    // we have no way of knowing that a search is already ongoing via iterative deepening and thus we could not prevent another search from being interleaved, or worse, another iterative deepening!
    // perhaps a solution to this is to move iterative deepening inside of the useDominoAi hook and use a callback to set the best move...
    // if we decide to move this function to useDominoAi, we should accept a callback to set the bestMove and also return the bestMove (idk whether to use Move type or AiSearchResult type here though...)!
    if (aiSearchIsOngoing) {
      window.alert("An AI search is already ongoing!");
      return;
    }
    let currentDepth = 1;
    let lastNumberOfExploredNodes;
    let currentNumberOfExploredNodes = 0;
    let searchResults: AiSearchResult;
    do {
      searchResults = await getAiMove(currentDepth);
      if (searchResults.status === "aborted") {
        console.log("AI search was cancelled!");
        return;
      }
      setBestMove(searchResults.bestMove);
      currentDepth++;
      lastNumberOfExploredNodes = currentNumberOfExploredNodes;
      currentNumberOfExploredNodes = searchResults.numberOfExploredNodes;
    } while (currentNumberOfExploredNodes > lastNumberOfExploredNodes);
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
          <Button type="button" onClick={onCancelSearch}>
            Cancel search!
          </Button>
          <Button type="button" onClick={startIterativeDeepening}>
            Do Iterative Deepening!
          </Button>
        </fieldset>
      </form>
    </div>
  );
}
export default DominoAiMenu;
