class Piece {
  constructor(color) {
    this.color = color;
  }
}

class Pawn extends Piece {
  constructor(color) {
    super(color);
    this.symbol = "P";
  }

  validMoves(from, board) {
    const moves = [];
    const dir = this.color === "w" ? -1 : 1;
    const [r, c] = from;

    if (board.isEmpty(r + dir, c)) moves.push([r + dir, c]);

    for (const dc of [-1, 1]) {
      const nr = r + dir,
        nc = c + dc;
      if (
        board.inBounds(nr, nc) &&
        board.getPiece(nr, nc) &&
        board.getPiece(nr, nc).color !== this.color
      ) {
        moves.push([nr, nc]);
      }
    }

    const startRank = this.color === "w" ? 6 : 1;

    if (
      r === startRank &&
      board.isEmpty(r + dir, c) &&
      board.isEmpty(r + dir * 2, c)
    )
      moves.push([r + dir * 2, c]);
    return moves;
  }
}

class Rook extends Piece {
  constructor(color) {
    super(color);
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

class Bishop extends Piece {
  constructor(color) {
    super(color);
    this.symbol = "B";
  }

  validMoves(from, board) {
    return board.rayMoves(from, this.color, [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]);
  }
}

class Knight extends Piece {
  constructor(color) {
    super(color);
    this.symbol = "N";
  }

  validMoves(from, board) {
    const moves = [];
    const [r, c] = from;
    const deltas = [
      [2, 1],
      [2, -1],
      [-2, 1],
      [-2, -1],
      [1, 2],
      [1, -2],
      [-1, 2],
      [-1, -2],
    ];

    for (const [dr, dc] of deltas) {
      const nr = r + dr,
        nc = c + dc;
      if (!board.inBounds(nr, nc)) continue;
      const p = board.getPiece(nr, nc);
      if (!p || p.color !== this.color) moves.push([nr, nc]);
    }

    return moves;
  }
}

class Queen extends Piece {
  constructor(color) {
    super(color);
    this.symbol = "Q";
  }

  validMoves(from, board) {
    return board.rayMoves(from, this.color, [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]);
  }
}

class King extends Piece {
  constructor(color) {
    super(color);
    this.symbol = "K";
  }

  validMoves(from, board) {
    const moves = [];
    const [r, c] = from;

    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr,
          nc = c + dc;
        if (!board.inBounds(nr, nc)) continue;
        const p = board.getPiece(nr, nc);
        if (!p || p.color !== this.color) moves.push([nr, nc]);
      }

    return moves;
  }
}

class Board {
  constructor() {
    this.grid = Array.from({ length: 8 }, () => Array(8).fill(null));
    this.setup();
  }

  setup() {
    for (let c = 0; c < 8; c++) {
      this.grid[1][c] = new Pawn("b");
      this.grid[6][c] = new Pawn("w");
    }

    this.grid[0][0] = new Rook("b");
    this.grid[0][7] = new Rook("b");
    this.grid[7][0] = new Rook("w");
    this.grid[7][7] = new Rook("w");

    this.grid[0][1] = new Knight("b");
    this.grid[0][6] = new Knight("b");
    this.grid[7][1] = new Knight("w");
    this.grid[7][6] = new Knight("w");

    this.grid[0][2] = new Bishop("b");
    this.grid[0][5] = new Bishop("b");
    this.grid[7][2] = new Bishop("w");
    this.grid[7][5] = new Bishop("w");

    this.grid[0][3] = new Queen("b");
    this.grid[7][3] = new Queen("w");

    this.grid[0][4] = new King("b");
    this.grid[7][4] = new King("w");
  }

  inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  isEmpty(r, c) {
    return this.inBounds(r, c) && this.grid[r][c] === null;
  }

  getPiece(r, c) {
    return this.inBounds(r, c) ? this.grid[r][c] : null;
  }

  rayMoves(from, color, directions) {
    const moves = [];
    const [r, c] = from;

    for (const [dr, dc] of directions) {
      let nr = r + dr,
        nc = c + dc;
      while (this.inBounds(nr, nc)) {
        const p = this.getPiece(nr, nc);
        if (!p) moves.push([nr, nc]);
        else {
          if (p.color !== color) moves.push([nr, nc]);
          break;
        }
        nr += dr;
        nc += dc;
      }
    }

    return moves;
  }

  move(from, to) {
    const [fr, fc] = from;
    const [tr, tc] = to;

    if (!this.inBounds(fr, fc) || !this.inBounds(tr, tc))
      throw new Error("Out of bounds");

    const piece = this.getPiece(fr, fc);

    if (!piece) throw new Error("No piece at source");

    const valid = piece
      .validMoves([fr, fc], this)
      .some(([r, c]) => r === tr && c === tc);

    if (!valid) throw new Error("Invalid move for piece");

    const captured = this.getPiece(tr, tc);

    this.grid[tr][tc] = piece;
    this.grid[fr][fc] = null;

    return captured;
  }

  findKing(color) {
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const p = this.getPiece(r, c);
        if (p instanceof King && p.color === color) return [r, c];
      }
    return null;
  }

  toString() {
    let out = "  a b c d e f g h\n";
    for (let r = 0; r < 8; r++) {
      out += 8 - r + " ";
      for (let c = 0; c < 8; c++) {
        const p = this.grid[r][c];
        if (!p) out += ". ";
        else {
          const sym = p.symbol || "?";
          out += (p.color === "w" ? sym : sym.toLowerCase()) + " ";
        }
      }
      out += 8 - r + "\n";
    }

    out += "  a b c d e f g h\n";
    return out;
  }
}

function parseCoordinate(token) {
  token = token.trim();
  const algebraic = /^[a-h][1-8]$/i;
  if (algebraic.test(token)) {
    const file = token[0].toLowerCase();
    const rank = parseInt(token[1], 10);
    const c = file.charCodeAt(0) - "a".charCodeAt(0);
    const r = 8 - rank;
    return [r, c];
  }

  const m = token.match(/^(\d)\s*,\s*(\d)$/);
  if (m) {
    const r = parseInt(m[1], 10) - 1;
    const c = parseInt(m[2], 10) - 1;
    return [r, c];
  }
  throw new Error("Invalid coordinate format");
}

export { Board, parseCoordinate, King };
