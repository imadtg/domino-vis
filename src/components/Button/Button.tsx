import * as React from "react";
import clsx from "clsx";

function Button({ className = "", ...delegated }) {
  return (
    <button
      className={clsx("rounded-sm bg-gray-300 p-[4px]", className)}
      {...delegated}
    />
  );
}

export default Button;
