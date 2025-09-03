import readline from "readline";
import { Board, parseCoordinate } from "./chess.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise((resolve) => rl.question(question, (ans) => resolve(ans)));
}

async function main() {
  const board = new Board();
  let current = "w";
  console.log("Welcome to Console Chess!");
  while (true) {
    console.log(board.toString());
    const ans = await prompt(
      `${current === "w" ? "White" : "Black"} move (e.g. b2 b3 or 2,2 3,2): `
    );
    if (!ans) break;
    const parts = ans.trim().split(/\s+/);
    if (parts.length !== 2) {
      console.log("Invalid input, provide two coords");
      continue;
    }
    try {
      const from = parseCoordinate(parts[0]);
      const to = parseCoordinate(parts[1]);
      const piece = board.getPiece(...from);
      if (!piece) {
        console.log("No piece at source");
        continue;
      }
      if (piece.color !== current) {
        console.log("Not your turn");
        continue;
      }
      const captured = board.move(from, to);
      if (captured instanceof (await import("./chess.js")).King) {
        console.log(board.toString());
        console.log(
          `${current === "w" ? "White" : "Black"} wins! King captured.`
        );
        break;
      }

      current = current === "w" ? "b" : "w";
    } catch (e) {
      console.log("Error:", e.message);
    }
  }
  rl.close();
}

main();
