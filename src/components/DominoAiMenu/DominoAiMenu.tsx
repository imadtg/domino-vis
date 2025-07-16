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
        </fieldset>
      </form>
    </div>
  );
}
export default DominoAiMenu;
