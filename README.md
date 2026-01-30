# Sliding Puzzle Solver 🧩

A fun and educational sliding puzzle solver that uses the **A* algorithm**!  
This project lets you watch a sliding puzzle being solved step by step, and also lets you play with it interactively.

**Demo:** [Try it here](https://sliding-puzzle-solver-app.netlify.app)

---

## What’s New in This Version

- **4×4 puzzle support** with improved **UI**  
- Fully **mobile-responsive** design  
- Added **random interactive mode** — you can shuffle and play with the puzzle  
- Still powered by the **A\* algorithm**, which finds the solution efficiently  

---

## How It Works

The puzzle solver uses the **A\* search algorithm** to figure out the moves needed to solve the puzzle.  

- Each tile has a goal position  
- The algorithm calculates the shortest sequence of moves to reach the solved state  
- The solving process is animated for a satisfying, visual experience  

---

## Puzzle Possibilities

| Puzzle Size | Number of Solvable Positions |
|------------|-----------------------------|
| 3×3 | 181,440 |
| 4×4 | 10,461,394,944,000 |
| 4×4 (this improved version) | Randomized interactive mode with A* solver |

> Even for 3×3 or 4×4 puzzles, the number of possible arrangements is huge! Watching the A* algorithm solve it helps you understand search, heuristics, and problem-solving strategies.

---

## Screenshots

<img width="768" src="https://user-images.githubusercontent.com/51440879/216780920-7e65d1a5-8ec3-4828-ab9c-54359b6289fa.png">

---

## How to Run Locally

1. Clone the repo:
```bash
git clone https://github.com/Sharon-rosario/4by4-sliding-puzzle-solver-algorithm.git
cd 4by4-sliding-puzzle-solver-algorithm
