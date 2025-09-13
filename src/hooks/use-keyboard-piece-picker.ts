import * as React from "react";
import { DominoPiece } from "@/lib/features/domino/dominoUtils";

interface keyboardPiecePickerParams {
  onPick: (piece: DominoPiece) => void;
}

export default function useKeyboardPiecePicker({
  onPick,
}: keyboardPiecePickerParams) {
  const [firstPip, setFirstPip] = React.useState<number>();
  const [secondPip, setSecondPip] = React.useState<number>();

  React.useEffect(() => {
    function handlePipKeyDown(event: KeyboardEvent) {
      if (!["0", "1", "2", "3", "4", "5", "6"].includes(event.key)) return;
      if (typeof firstPip !== "undefined") {
        const nextFirstPip = secondPip;
        const nextSecondPip = parseInt(event.key);
        setFirstPip(nextFirstPip);
        setSecondPip(nextSecondPip);
        if (typeof secondPip !== "undefined") {
          onPick({ left: firstPip, right: secondPip });
        }
      } else {
        setFirstPip(parseInt(event.key));
      }
    }

    window.addEventListener("keydown", handlePipKeyDown);

    return () => {
      window.removeEventListener("keydown", handlePipKeyDown);
    };
  }, [firstPip, secondPip]); // TODO: find a way to remove these dependencies, perhaps through a ref?
}
