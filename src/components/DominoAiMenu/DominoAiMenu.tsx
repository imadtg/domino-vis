"use client";
import * as React from "react";

import Button from "../Button";
import clsx from "clsx";
import { AiSearchResult, IterativeDeepeningProgressInfo } from "./aiWorker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DominoAiMenuProps {
  className?: string;
  doIterativeDeepening: (
    onProgress: (
      progressInfo: IterativeDeepeningProgressInfo,
      signal: AbortSignal,
    ) => Promise<void>,
  ) => Promise<void>;
}

function DominoAiMenu({
  className = "",
  doIterativeDeepening,
}: DominoAiMenuProps) {
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
    <Card className={clsx("w-fit min-w-[220px]", className)}>
      <CardHeader>
        <CardTitle>Domino AI</CardTitle>
        <CardDescription>
          Run a search and inspect the latest result.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-[8px]">
        <form onSubmit={submitMoveSearch}>
          <Button className="whitespace-nowrap" type="submit">
            Find best move!
          </Button>
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
      </CardContent>
    </Card>
  );
}
export default DominoAiMenu;
