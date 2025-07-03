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

export async function createConfiguredModule() {
  const Module = await createModule(ModuleConfig);
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
  return Module._get_right_of_move(movePointer)
}

export function extractType(Module, movePointer) {
  return Module._get_type_of_move(movePointer)
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

  const move = Module._alloc_move();

  let turn = Module._get_turn(game);
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

export function AskMoveAndPlay(
  Module,
  game,
  { moves, moveLengthPointer, move },
) {
  while (true) {
    const choice = parseInt(window.prompt("AI move? (0: no, 1: yes): "));
    if (choice) {
      const depth = parseInt(window.prompt("Give depth of search: "));
      Module.ccall(
        "populate_best_move",
        null,
        ["number", "number", "number"],
        [game, depth, move],
      );
      window.alert(
        `best move found is [${extractLeft(move)}|${extractRight(
          move,
        )}] on the ${extractHead(move) ? "right" : "left"}`,
      );
    } else {
      const left = parseInt(window.prompt("Give left: "));
      const right = parseInt(window.prompt("Give right: "));
      const head = parseInt(window.prompt("Give head: "));
      Module.ccall(
        "populate_move_from_components",
        null,
        ["number", "number", "number", "number"],
        [move, left, right, head],
      );
    }
    Module.ccall(
      "em_do_move_pointer",
      null,
      ["number", "number"],
      [game, move],
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

export function play(Module) {
  function deref_c_int(ptr) {
    return Module._deref_int(ptr);
  }

  function alloc_c_int() {
    return Module._alloc_int();
  }
  Module._init_fact();
  const LEFT = Module._get_LEFT();
  const RIGHT = Module._get_RIGHT();
  const PERFECT_PICK = Module._get_PERFECT_PICK();
  const IMPERFECT_PICK = Module._get_IMPERFECT_PICK();
  const PASS = Module._get_PASS();
  const numberOfPlayers = Module._get_number_of_players();
  const pips = Module._get_pips();
  const currentPlayer = Module._get_current_player();
  const game = newGame(Module);
  const hands = Module._get_hands(game);
  const snake = Module._get_snake(game);
  const handSizes = range(numberOfPlayers + 1).map((player) =>
    parseInt(
      window.prompt(
        `Give the size of the hand of the ${
          player < numberOfPlayers ? `${player} player` : "boneyard"
        }:`,
      ),
    ),
  );
  handSizes.forEach((size, player) =>
    Module._set_hand_size(game, player, size),
  );
  const currentPlayerOwns = range(pips).map(() => range(pips).map(() => false));
  console.log(currentPlayerOwns);
  range(handSizes[currentPlayer]).forEach((pieceNumber) => {
    let left = parseInt(window.prompt(`Give the left of piece ${pieceNumber}`));
    let right = parseInt(
      window.prompt(`Give the right of piece ${pieceNumber}`),
    );
    currentPlayerOwns[left][right] = true;
    currentPlayerOwns[right][left] = true;
  });
  console.log(currentPlayerOwns);
  range(pips).forEach((left) =>
    range(left, pips).forEach((right) => {
      if (currentPlayerOwns[left][right]) {
        console.log(`Collapsing [${left}|${right}] onto ${currentPlayer}`);
        Module._collapse_piece(currentPlayer, hands, left, right);
      } else {
        console.log(`Absenting [${left}|${right}] from ${currentPlayer}`);
        Module._absent_piece(currentPlayer, hands, left, right);
      }
    }),
  );
  Module._emit_collapse(hands);
  Module._set_turn(game, parseInt(window.prompt("Which player starts?")));

  const cantPassPtr = alloc_c_int();

  const numberOfPlayingMovesPtr = alloc_c_int();
  const playingMovesArrPtr = Module._alloc_max_move_arr();

  const numberOfPickingMovesPtr = alloc_c_int();
  const pickingMovesArrPtr = Module._alloc_max_move_arr();

  const numberOfPlayablePickingMovesPtr = alloc_c_int();
  const playablePickingMovesArrPtr = Module._alloc_max_move_arr();

  const move = Module._alloc_move();

  while (!Module._over(game)) {
    let turn = Module._get_turn(game);
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
    if (deref_c_int(numberOfPlayingMovesPtr) === 0) {
      if (Module._boneyard_is_pickable(hands)) {
        if (
          Module._hand_is_solid(numberOfPlayers, hands) ||
          Module._hand_is_liquid(turn, hands)
        ) {
          if (Module._is_passing(game, numberOfPlayers)) {
            Module._pick_all_boneyard(game);
            continue;
          } else if (Module._get_hand_size(game, numberOfPlayers) === 1) {
            Module._perfect_pick_by_pointer(
              game,
              Module._get_move_by_index(pickingMovesArrPtr, 0),
            );
            continue;
          }
        }
      } else {
        Module._pass(game);
        continue;
      }
    } else if (
      deref_c_int(cantPassPtr) &&
      deref_c_int(numberOfPlayingMovesPtr) === 1
    ) {
      Module._play_move_by_pointer(
        game,
        Module._get_move_by_index(playingMovesArrPtr, 0),
      );
      continue;
    }
    let moveType;
    if (!deref_c_int(cantPassPtr) && deref_c_int(numberOfPlayingMovesPtr) === 0)
      moveType = parseInt(
        window.prompt(
          `give move type (perf pick = ${PERFECT_PICK}, imp pick = ${IMPERFECT_PICK}, pass = ${PASS}): `,
        ),
      );
    else if (!deref_c_int(cantPassPtr))
      moveType = parseInt(
        window.prompt(
          `give move type (left = ${LEFT}, right = ${RIGHT}, perf pick = ${PERFECT_PICK}, imp pick = ${IMPERFECT_PICK}, pass = ${PASS})(AI = -1): `,
        ),
      );
    else
      moveType = parseInt(
        window.prompt(
          `give move type (left = ${LEFT}, right = ${RIGHT})(AI = -1): `,
        ),
      );
    switch (moveType) {
      case LEFT:
      case RIGHT: {
        let leftPip = parseInt(
          window.prompt("Give left pip of domino to play"),
        );
        let rightPip = parseInt(
          window.prompt("Give right pip of domino to play"),
        );
        if (
          Module._playable_move(snake, moveType, leftPip, rightPip) &&
          Module._possible_possession(turn, hands, leftPip, rightPip)
        ) {
          Module._populate_move_from_components(
            move,
            moveType,
            leftPip,
            rightPip,
          );
          Module._play_move_by_pointer(game, move);
        } else {
          window.alert("invalid move");
        }
        break;
      }
      case PERFECT_PICK: {
        if (deref_c_int(cantPassPtr) || !Module._boneyard_is_pickable(hands)) {
          window.alert("invalid move");
          break;
        }
        let leftPip = parseInt(
          window.prompt("Give left pip of domino to pick"),
        );
        let rightPip = parseInt(
          window.prompt("Give right pip of domino to pick"),
        );
        if (
          Module._possible_possession(numberOfPlayers, hands, leftPip, rightPip)
        ) {
          Module._populate_move_from_components(
            move,
            moveType,
            leftPip,
            rightPip,
          );
          Module._perfect_pick_by_pointer(game, move);
        } else window.alert("invalid move");
        break;
      }
      case IMPERFECT_PICK: {
        if (deref_c_int(cantPassPtr) || !Module._boneyard_is_pickable(hands)) {
          window.alert("invalid move");
          break;
        }
        let amount = parseInt(window.prompt("Give amount to pick"));
        if (
          amount > 0 &&
          amount <= Module._get_hand_size(game, numberOfPlayers) // the player associated with the count of players is actually the boneyard.
        ) {
          Module._populate_imperfect_picking_move(move, amount);
          Module._imperfect_pick_by_pointer(game, move);
        } else window.alert("invalid move");
        break;
      }
      case PASS: {
        if (deref_c_int(cantPassPtr)) {
          window.alert("invalid move");
          break;
        }
        Module._pass(game);
        break;
      }
      case -1: {
        // AI move, don't know if i should enumerate in enum Move.
        if (deref_c_int(numberOfPlayingMovesPtr) === 0) {
          window.alert("no moves to choose AI move from");
          break;
        }
        let depth = parseInt(
          window.prompt(
            "give depth of search (negative is infinite, 0 isn't valid): ",
          ),
        );
        if (depth === 0) {
          window.alert("depth can't be 0!");
          break;
        }
        Module._populate_move_by_ai(
          game,
          move,
          playingMovesArrPtr,
          deref_c_int(numberOfPlayingMovesPtr),
          depth,
        );

        let playAiMove = parseInt(
          window.prompt(
            `play [${Module._get_left_of_move(
              move,
            )}|${Module._get_right_of_move(move)}] on the ${
              Module._get_type_of_move(move) === LEFT ? "left" : "right"
            }?: `,
          ),
        );
        if (playAiMove) {
          Module._play_move_by_pointer(game, move);
        }
      }
    }
  }
  Module._print_game(game);
  Module.print("game over, score:", Module._endgame_evaluation(game));
}
