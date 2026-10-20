import { spawn } from "node:child_process";

/** CLI adapter for testing the same WASM and EngineSession outside the browser. Node 24+. */
export function nodeEnginePort() {
  const child = spawn(
    process.execPath,
    ["node_modules/stockfish/bin/stockfish-19-lite-single.js"],
    { stdio: ["pipe", "pipe", "pipe"] },
  );
  let stopped = false;
  let buffer = "";
  const port = {
    onmessage: null,
    onerror: null,
    commands: [],
    postMessage(command) {
      if (stopped) throw new Error("Motorporten är stängd.");
      port.commands.push(command);
      child.stdin.write(`${command}\n`);
    },
    terminate() {
      stopped = true;
      child.kill();
    },
  };
  child.stdout.on("data", (chunk) => {
    buffer += chunk;
    let index;
    while ((index = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      port.onmessage?.({ data: line });
    }
  });
  child.stderr.on("data", () => {});
  child.on("error", () => {
    if (!stopped) port.onerror?.({});
  });
  child.on("exit", () => {
    if (!stopped) port.onerror?.({});
  });
  child.stdin.on("error", () => {
    if (!stopped) port.onerror?.({});
  });
  return port;
}
