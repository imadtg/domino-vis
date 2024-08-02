"use client";
import React from "react";
import { createConfiguredModule, play } from "@/public/wasm/cToJShelpers";

function WasmPlaygroundPage() {
  const [wasmModule, setWasmModule] = React.useState();
  async function initializeWasmModule() {
    setWasmModule(await createConfiguredModule());
  }
  const effectWasCalled = React.useRef(false); // calling initializeWasmModule twice throws an error, so this is a workaround for strict mode.
  React.useEffect(() => {
    if (effectWasCalled.current) {
      return;
    }
    effectWasCalled.current = true;
    if (!wasmModule) {
      initializeWasmModule();
    }
  }, []);

  return (
    <div>
      <p>Wasm playground!</p>
      {wasmModule && (
        <button onClick={() => play(wasmModule)}>Click me!</button>
      )}
    </div>
  );
}

export default WasmPlaygroundPage;
