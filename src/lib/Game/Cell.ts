import type { Subscriber, Unsubscriber, Readable } from "svelte/store";
import type { iBoard } from "./Board";

export class Cell<T> extends Set<T> implements Readable<Set<T>> {
  private subscribers: Subscriber<Cell<T>>[] = [];

  set = (v: T): boolean => {
    let changed = false;
    for (let i of this) {
      if (i !== v) {
        changed = true;
        this.delete(i);
      }
    }
    return changed;
  };

  is(id: T) {
    return this.has(id) && this.size === 1;
  }

  notify = () => {
    this.subscribers.forEach((sub) => sub(this));
  };

  subscribe = (run: Subscriber<Cell<T>>): Unsubscriber => {
    this.subscribers.push(run);
    run(this);
    return () => {
      const i = this.subscribers.findIndex((s) => s === run);
      if (i > -1) this.subscribers.splice(i, 1);
    };
  };
}

export function add_to_board(
  board: iBoard,
  row: number,
  col: number,
  id: number,
): boolean {
  const cell = board[row][col];
  if (!cell.has(id)) {
    cell.add(id);
    // cell.notify();
    return true;
  }
  return false;
}

// TODO: Simplify
export function remove_from_board(
  board: iBoard,
  row: number,
  col: number,
  id: number,
  set = false,
): boolean {
  let changed = false;
  const cell = board[row][col];
  if (set) {
    for (let o of cell) {
      if (o !== id) {
        changed = true;
        remove_from_board(board, row, col, o);
      }
    }
  } else {
    changed = cell.delete(id);
    if (changed) {
      let newCol = 0;
      const others = board[row].filter((s, i) => {
        let b = s.has(id);
        if (b) newCol = i;
        return s.has(id);
      });
      if (others.length === 1) {
        remove_from_board(board, row, newCol, id, true);
      }
    }
  }
  if (changed && cell.size === 1) {
    const v = cell.values().next().value as number;
    for (let i = 0; i < board[row].length; i++) {
      if (i === col) continue;
      remove_from_board(board, row, i, v);
    }
  }
  return changed;
}
