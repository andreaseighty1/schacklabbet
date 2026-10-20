import { spawn } from "node:child_process";
import { Chess } from "chess.js";
import assert from "node:assert/strict";
const child = spawn(
  process.execPath,
  ["node_modules/stockfish/bin/stockfish-19-lite-single.js"],
  { stdio: ["pipe", "pipe", "pipe"] },
);
const game = new Chess();
game.move("e4");
let buffer = "";
let stderr = "";
const timer = setTimeout(() => {
  console.error("Stockfish timeout");
  child.kill();
  process.exitCode = 1;
}, 15000);
child.stderr.on("data", (data) => {
  stderr += data;
});
const send = (command) => child.stdin.write(`${command}\n`);
child.stdout.on("data", (data) => {
  buffer += data;
  let newline;
  while ((newline = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (line === "uciok") send("isready");
    if (line === "readyok") {
      send(`position fen ${game.fen()}`);
      send("go depth 5 movetime 300");
    }
    if (line.startsWith("bestmove ")) {
      try {
        const move = line.split(" ")[1];
        assert.match(move, /^[a-h][1-8][a-h][1-8][qrbn]?$/);
        game.move({
          from: move.slice(0, 2),
          to: move.slice(2, 4),
          promotion: move[4],
        });
        assert.equal(game.turn(), "w");
        console.log(
          `PASS: verklig Stockfish 19 WASM svarade med lagligt drag ${move} efter e4.`,
        );
      } catch (error) {
        console.error(error);
        process.exitCode = 1;
      }
      clearTimeout(timer);
      send("quit");
      child.kill();
    }
  }
});
child.on("error", (error) => {
  clearTimeout(timer);
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  clearTimeout(timer);
  if (code && code !== 0) {
    console.error(stderr || `Engine exited ${code}`);
    process.exitCode = 1;
  }
});
send("uci");
