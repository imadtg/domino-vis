"use client";
import type { ReactNode } from "react";
import { LayoutGroup } from "framer-motion";
import * as React from "react";

interface Props {
  readonly children: ReactNode;
}

export const MotionProvider = ({ children }: Props) => {
  return <LayoutGroup>{children}</LayoutGroup>;
};
