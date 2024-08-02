import createModule from "./domino-c";

var ModuleConfig = {
  locateFile: function (file) {
    return `/wasm/${file}`;
  },
  print: (...args) => {
    var text = args.join(" ");
    console.log(text);
  },
};

export async function createConfiguredModule() {
  const Module = await createModule(ModuleConfig);
  return Module;
}

export function newGame(Module) {
  const game = Module.ccall("alloc_game", "number");
  Module.ccall("init_game", null, ["number"], [game]);
  return game;
}

export function extractLeft(Module, movePointer) {
  return Module.ccall(
    "em_move_extract_left",
    "number",
    ["number"],
    [movePointer]
  );
}

export function extractRight(Module, movePointer) {
  return Module.ccall(
    "em_move_extract_right",
    "number",
    ["number"],
    [movePointer]
  );
}

export function extractHead(Module, movePointer) {
  return Module.ccall(
    "em_move_extract_head",
    "number",
    ["number"],
    [movePointer]
  );
}

export function getHands(Module, game) {
  for (let i = 0; i <= 6; i++) {
    for (let j = 0; j <= i; j++) {
      let player = parseInt(window.prompt(`Who owns the [${i}|${j}] domino?`));
      Module.ccall(
        "add_domino_to_player", // name of C function
        null, // return type
        ["number", "number", "number", "number"], // argument types
        [game, i, j, player] // arguments
      );
    }
  }
}

export function getTurn(Module, game) {
  let player = parseInt(window.prompt("Who's turn is it?"));
  Module.ccall("set_turn", null, ["number", "number"], [game, player]);
}

export function printGame(Module, game) {
  Module.ccall("print_game", null, ["number"], [game]);
}

export function newMovesContext(Module) {
  const moves = Module.ccall("alloc_moves", "number");
  const moveLengthPointer = Module.ccall("alloc_int", "number");
  let move = Module.ccall("alloc_move", "number");
  return { moves, moveLengthPointer, move };
}

export function gameOver(Module, game) {
  return Module.ccall("over", "number", ["number"], [game]);
}

export function getMoves(Module, game, { moves, moveLengthPointer }) {
  Module.ccall(
    "get_moves",
    null,
    ["number", "number", "number"],
    [game, moves, moveLengthPointer]
  );
  Module.ccall(
    "em_print_moves",
    null,
    ["number", "number"],
    [moves, moveLengthPointer]
  );
}

export function getNumberOfMoves(Module, { moveLengthPointer }) {
  return Module.ccall("get_int", "number", ["number"], [moveLengthPointer]);
}

export function pass(Module, game) {
  Module.ccall("pass", null, ["number"], [game]);
}

export function playSoleMove(Module, game, { moves }) {
  Module.ccall(
    "em_do_move_index",
    null,
    ["number", "number", "number"],
    [game, moves, 0]
  );
}

export function AskMoveAndPlay(
  Module,
  game,
  { moves, moveLengthPointer, move }
) {
  while (true) {
    const choice = parseInt(window.prompt("AI move? (0: no, 1: yes): "));
    if (choice) {
      const depth = parseInt(window.prompt("Give depth of search: "));
      Module.ccall(
        "populate_best_move",
        null,
        ["number", "number", "number"],
        [game, depth, move]
      );
      window.alert(
        `best move found is [${extractLeft(move)}|${extractRight(
          move
        )}] on the ${extractHead(move) ? "right" : "left"}`
      );
    } else {
      const left = parseInt(window.prompt("Give left: "));
      const right = parseInt(window.prompt("Give right: "));
      const head = parseInt(window.prompt("Give head: "));
      Module.ccall(
        "populate_move_from_components",
        null,
        ["number", "number", "number", "number"],
        [move, left, right, head]
      );
    }
    Module.ccall(
      "em_do_move_pointer",
      null,
      ["number", "number"],
      [game, move]
    );
    break;
  }
}

export function printEndGameResults(Module, game) {
  window.alert(
    `Game over! score = ${Module.ccall(
      "endgame_evaluation",
      "number",
      ["number"],
      [game]
    )}`
  );
}

export function play(Module) {
  const game = newGame(Module);
  getHands(Module, game);
  const MovesContext = newMovesContext(Module);
  while (!gameOver(Module, game)) {
    printGame(Module, game);
    getMoves(Module, game, MovesContext);
    switch (getNumberOfMoves(Module, MovesContext)) {
      case 0: {
        pass(Module, game);
        break;
      }
      case 1: {
        playSoleMove(Module, game, MovesContext);
        break;
      }
      default: {
        AskMoveAndPlay(Module, game, MovesContext);
        break;
      }
    }
  }
  printGame(Module, game);
  printEndGameResults(Module, game);
}
