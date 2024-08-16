"use client";
import type { ReactNode } from "react";
import { LayoutGroup } from "framer-motion";

interface Props {
  readonly children: ReactNode;
}

export const MotionProvider = ({ children }: Props) => {
  return <LayoutGroup>{children}</LayoutGroup>;
};
