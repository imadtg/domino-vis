import * as React from "react";
import { DominoPiece } from "@/lib/features/domino/dominoUtils";

interface keyboardPiecePickerParams {
  onPick: (piece: DominoPiece) => void;
}

export default function useKeyboardPiecePicker({
  onPick,
}: keyboardPiecePickerParams) {
  const firstPip = React.useRef<number>();
  const secondPip = React.useRef<number>();

  React.useEffect(() => {
    function handlePipKeyDown(event: KeyboardEvent) {
      if (!["0", "1", "2", "3", "4", "5", "6"].includes(event.key)) return;
      // initially, first pip and second pip are undefined, on a pip keystroke,
      // we move the old value of firstPip to secondPip and put the keystroke as firstPip
      // and each time they constitute a piece we call onPick
      // and flush below will reset them to undefined
      // for example:
      // firstPip.current === undefined, secondPip.current === undefined (no pip number clicked yet)
      // firstPip.current === 3, secondPip.current === undefined (user clicked 3)
      // firstPip.current === 6, secondPip.current === 3 (user clicked 6), onPick called with piece [6|3]
      // firstPip.current === undefined, secondPip.current === undefined (consuming code calls flush (when a user selects the piece in the game init menu for example))
      if (typeof firstPip.current !== "undefined") {
        secondPip.current = firstPip.current;
        firstPip.current = parseInt(event.key);
        if (typeof secondPip.current !== "undefined") {
          onPick({ left: firstPip.current, right: secondPip.current });
        }
      } else {
        firstPip.current = parseInt(event.key);
      }
    }

    window.addEventListener("keydown", handlePipKeyDown);

    return () => {
      window.removeEventListener("keydown", handlePipKeyDown);
    };
  });

  function flush() {
    firstPip.current = undefined;
    secondPip.current = undefined;
  }

  return { flush };
}
