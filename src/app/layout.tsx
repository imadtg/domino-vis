import type { ReactNode } from "react";
import { StoreProvider } from "./StoreProvider";
import "./globals.css";

interface Props {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: Props) {
  return (
    <StoreProvider>
      <html lang="en">
        <body>
          <main className="flex flex-col items-center justify-center overflow-hidden">
            {children}
          </main>
        </body>
      </html>
    </StoreProvider>
  );
}
