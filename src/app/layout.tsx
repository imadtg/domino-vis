import type { ReactNode } from "react";
import { StoreProvider } from "./StoreProvider";
import "./globals.css";
import Head from "next/head";

interface Props {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: Props) {
  return (
    <StoreProvider>
      <html lang="en">
        <Head>
          <script type="module">
          if (!("anchorName" in document.documentElement.style)) {"{"}import("https://unpkg.com/@oddbird/css-anchor-positioning");{"}"}
          </script>
        </Head>
        <body>
          <main className="flex flex-col items-center justify-center overflow-hidden">
            {children}
          </main>
        </body>
      </html>
    </StoreProvider>
  );
}
