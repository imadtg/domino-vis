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
