"use client";
import * as React from "react";

import { reset } from "@/lib/features/domino/dominoSlice";

import { useAppDispatch } from "@/lib/hooks";

import Button from "../Button";
import clsx from "clsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GameOverMenuProps {
  className: string;
  onReset?: () => void;
}

function GameOverMenu({ className, onReset }: GameOverMenuProps) {
  const dispatch = useAppDispatch();

  function submitGameReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onReset?.();
    dispatch(reset());
  }

  return (
    <Card className={clsx("w-fit min-w-[180px]", className)}>
      <CardHeader>
        <CardTitle>Game Over!</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submitGameReset}>
          <Button type="submit">Reset</Button>
        </form>
      </CardContent>
    </Card>
  );
}
export default GameOverMenu;
