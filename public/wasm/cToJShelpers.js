import createModule from "./domino-c";
// TODO: move this entire module out of public directory, and encapsulate it with all the logic for AI moves somewhere else
// for the other remaining two files, domino-c.js and domino-c.wasm, they can remain here but should be with their originating build environment as a git submodule.

var ModuleConfig = {
  locateFile: function (file) {
    return `/wasm/${file}`;
  },
  print: (...args) => {
    var text = args.join(" ");
    console.log(text);
  },
};

export async function createConfiguredModule(Config = {}) {
  const Module = await createModule({ ...ModuleConfig, ...Config });
  return Module;
}

export function newGame(Module) {
  const game = Module._alloc_game();
  Module._init_game(game);
  return game;
}

export function extractLeft(Module, movePointer) {
  return Module._get_left_of_move(movePointer);
}

export function extractRight(Module, movePointer) {
  return Module._get_right_of_move(movePointer);
}

export function extractType(Module, movePointer) {
  return Module._get_type_of_move(movePointer);
}

export function getHands(Module, game) {
  for (let i = 0; i <= 6; i++) {
    for (let j = 0; j <= i; j++) {
      let player = parseInt(window.prompt(`Who owns the [${i}|${j}] domino?`));
      Module.ccall(
        "add_domino_to_player", // name of C function
        null, // return type
        ["number", "number", "number", "number"], // argument types
        [game, i, j, player], // arguments
      );
    }
  }
}

export function getTurn(Module, game) {
  let player = parseInt(window.prompt("Who's turn is it?"));
  Module.ccall("set_turn", null, ["number", "number"], [game, player]);
}

export function printGame(Module, game) {
  function deref_c_int(ptr) {
    return Module._deref_int(ptr);
  }

  function alloc_c_int() {
    return Module._alloc_int();
  }

  const cantPassPtr = alloc_c_int();

  const numberOfPlayingMovesPtr = alloc_c_int();
  const playingMovesArrPtr = Module._alloc_max_move_arr();

  const numberOfPickingMovesPtr = alloc_c_int();
  const pickingMovesArrPtr = Module._alloc_max_move_arr();

  const numberOfPlayablePickingMovesPtr = alloc_c_int();
  const playablePickingMovesArrPtr = Module._alloc_max_move_arr();

  Module._print_game(game);
  Module._get_playing_moves(
    // what the hecl is happening here??
    game,
    playingMovesArrPtr,
    numberOfPlayingMovesPtr,
    cantPassPtr,
  );
  Module._print_playing_moves(
    playingMovesArrPtr,
    deref_c_int(numberOfPlayingMovesPtr),
  );
  Module.print(deref_c_int(numberOfPlayingMovesPtr), "moves");
  Module._get_playable_perfect_picking_moves(
    game,
    playablePickingMovesArrPtr,
    numberOfPlayablePickingMovesPtr,
  );
  Module._get_perfect_picking_moves(
    game,
    pickingMovesArrPtr,
    numberOfPickingMovesPtr,
  );
  let passProbability = Module._pass_probability_from_num_moves(
    game,
    deref_c_int(numberOfPlayingMovesPtr),
  );
  Module._print_picking_moves(
    pickingMovesArrPtr,
    deref_c_int(numberOfPickingMovesPtr),
  );
  Module._print_picking_moves(
    playablePickingMovesArrPtr,
    deref_c_int(numberOfPlayablePickingMovesPtr),
  );
  Module.print("pass prob = ", passProbability);
  let unplayablePickProbability =
    Module._pick_unplayable_domino_probability_from_moves(
      game,
      playablePickingMovesArrPtr,
      deref_c_int(numberOfPlayablePickingMovesPtr),
    ); // this is a conditional probability and assumes player will pick
  Module.print("unplayable pick prob = ", unplayablePickProbability);
  if (deref_c_int(cantPassPtr)) {
    Module.print("cant pass");
  }
}

export function newMovesContext(Module) {
  function alloc_c_int() {
    return Module._alloc_int();
  }

  const moves = Module._alloc_max_move_arr();
  const moveLengthPointer = alloc_c_int();
  const move = Module._alloc_move();
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
    [game, moves, moveLengthPointer],
  );
  Module.ccall(
    "em_print_moves",
    null,
    ["number", "number"],
    [moves, moveLengthPointer],
  );
}

export function getNumberOfMoves(Module, { moveLengthPointer }) {
  return Module.ccall("get_int", "number", ["number"], [moveLengthPointer]);
}

export function playSoleMove(Module, game, { moves }) {
  Module.ccall(
    "em_do_move_index",
    null,
    ["number", "number", "number"],
    [game, moves, 0],
  );
}

export function printEndGameResults(Module, game) {
  window.alert(
    `Game over! score = ${Module.ccall(
      "endgame_evaluation",
      "number",
      ["number"],
      [game],
    )}`,
  );
}

export const range = (start, end, step = 1) => {
  let output = [];
  if (typeof end === "undefined") {
    end = start;
    start = 0;
  }
  for (let i = start; i < end; i += step) {
    output.push(i);
  }
  return output;
};
