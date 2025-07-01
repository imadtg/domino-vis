import type { ReactNode } from "react";
import { StoreProvider } from "./StoreProvider";
import "./globals.css";
import Script from "next/script";
import { MotionProvider } from "./MotionProvider";
interface Props {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: Props) {
  return (
    <StoreProvider>
      <html lang="en">
        <body>
          {/* commented out because it causes hydration issues with instrumentation-client.ts, and it didnt even work in the first place...
            <Script
              strategy="beforeInteractive" // anchored positioning polyfill, since it isn't supported in firefox yet...
            >
              {`
            if (!("anchorName" in document.documentElement.style)) {
              import("https://unpkg.com/@oddbird/css-anchor-positioning");
              }
              `}
            </Script>
          */}
          <main className="flex flex-col items-center justify-center overflow-hidden">
            <MotionProvider>{children}</MotionProvider>
          </main>
        </body>
      </html>
    </StoreProvider>
  );
}
