import createModule from "domino-ai";
import type { DominoAiModule } from "domino-ai";
const ModuleConfig = {
  print: (...args: string[]) => {
    const text = args.join(" ");
    console.log(text);
  },
};

export async function createConfiguredModule(Config = {}) {
  const Module = await createModule({ ...ModuleConfig, ...Config });
  return Module;
}

export function newGame(Module: DominoAiModule) {
  const game = Module._alloc_game();
  Module._init_game(game);
  return game;
}

export function extractLeft(Module: DominoAiModule, movePointer: number) {
  return Module._get_left_of_move(movePointer);
}

export function extractRight(Module: DominoAiModule, movePointer: number) {
  return Module._get_right_of_move(movePointer);
}

export function extractType(Module: DominoAiModule, movePointer: number) {
  return Module._get_type_of_move(movePointer);
}

export function printGame(Module: DominoAiModule, game: number) {
  function deref_c_int(ptr: number) {
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
  Module.print(`${deref_c_int(numberOfPlayingMovesPtr)} moves`);
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
  const passProbability = Module._pass_probability_from_num_moves(
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
  Module.print(`pass prob = ${passProbability}`);
  const unplayablePickProbability =
    Module._pick_unplayable_domino_probability_from_moves(
      game,
      playablePickingMovesArrPtr,
      deref_c_int(numberOfPlayablePickingMovesPtr),
    ); // this is a conditional probability and assumes player will pick
  Module.print(`unplayable pick prob = ${unplayablePickProbability}`);
  if (deref_c_int(cantPassPtr)) {
    Module.print("cant pass");
  }
}

export function newMovesContext(Module: DominoAiModule) {
  function alloc_c_int() {
    return Module._alloc_int();
  }

  const moves = Module._alloc_max_move_arr();
  const moveLengthPointer = alloc_c_int();
  const move = Module._alloc_move();
  return { moves, moveLengthPointer, move };
}
