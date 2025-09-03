import { Board, parseCoordinate } from "../src/chess.js";

test("board initial pieces", () => {
  const b = new Board();

  expect(b.getPiece(1, 0).symbol).toBe("P");
  expect(b.getPiece(6, 0).symbol).toBe("P");

  expect(b.getPiece(0, 0).symbol).toBe("R");
  expect(b.getPiece(7, 0).symbol).toBe("R");

  expect(b.getPiece(0, 4).symbol).toBe("K");
  expect(b.getPiece(7, 4).symbol).toBe("K");
});

test("test parse algebraic and numeric coords", () => {
  expect(parseCoordinate("a8")).toEqual([0, 0]);
  expect(parseCoordinate("h1")).toEqual([7, 7]);
  expect(parseCoordinate("1,1")).toEqual([0, 0]);
  expect(parseCoordinate("8,8")).toEqual([7, 7]);
});

test("pawn moves", () => {
  const b = new Board();
  const wp = b.getPiece(6, 0);
  const vm = wp.validMoves([6, 0], b).map(JSON.stringify);

  expect(vm).toContain(JSON.stringify([5, 0]));
  expect(vm).toContain(JSON.stringify([4, 0]));
});

test("illegal move blocked", () => {
  const b = new Board();

  expect(() => b.move([7, 0], [5, 0])).toThrow();
});

test("capture king ends game", () => {
  const b = new Board();
  b.grid = Array.from({ length: 8 }, () => Array(8).fill(null));

  const { King, Rook } = async () => {};

  class K {
    constructor(c) {
      this.color = c;
      this.symbol = "K";
    }
  }

  class R {
    constructor(c) {
      this.color = c;
      this.symbol = "R";
    }

    validMoves(from, board) {
      return board.rayMoves(from, this.color, [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]);
    }
  }

  b.grid[0][4] = new K("b");
  b.grid[1][4] = new R("w");

  const captured = b.move([1, 4], [0, 4]);

  expect(captured).not.toBeNull();
  expect(captured.symbol).toBe("K");
});
