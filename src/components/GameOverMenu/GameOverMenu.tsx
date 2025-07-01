"use client";
import * as React from "react";

import { reset } from "@/lib/features/domino/dominoSlice";

import { useAppDispatch } from "@/lib/hooks";

import Button from "../Button";
import clsx from "clsx";

interface GameOverMenuProps {
  className: string;
  onReset?: () => void;
}

function GameOverMenu({ className, onReset }: GameOverMenuProps) {
  const dispatch = useAppDispatch();

  function submitGameReset(event: any) {
    event.preventDefault();
    onReset?.();
    dispatch(reset());
  }

  return (
    <div className={clsx("flex flex-col", className)}>
      <form onSubmit={submitGameReset}>
        <fieldset className="flex flex-col gap-[8px] p-[8px]">
          <legend>Game Over!</legend>
          <Button>Reset</Button>
        </fieldset>
      </form>
    </div>
  );
}
export default GameOverMenu;
