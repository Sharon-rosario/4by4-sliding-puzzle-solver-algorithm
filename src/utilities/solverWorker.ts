import { Board } from '../components/Board';
import { BoardNode } from '../components/BoardNode';
import { PriorityQueue } from '../components/PriorityQueue';
import { Puzzle } from '../components/Puzzle';

self.onmessage = function (message: MessageEvent<Puzzle[]>) {
    try {
        const puzzle = message.data;
        const gridSize = Math.sqrt(puzzle.length);
        const board = new Board(gridSize, puzzle);

        const queue = new PriorityQueue<BoardNode>();
        const startNode = new BoardNode(null, board, -1);

        // Dynamic limits based on grid size
        let MAX_ITERATIONS = 100000;
        let MAX_TIME = 10000;
        let WEIGHT = 1;

        if (gridSize >= 4) {
            MAX_ITERATIONS = 2000000; // 2 million nodes
            MAX_TIME = 60000; // 60 seconds
            WEIGHT = 3; // Weighted A* for 4x4
        }
        if (gridSize >= 5) {
            MAX_ITERATIONS = 5000000; // 5 million nodes
            MAX_TIME = 120000; // 2 minutes
            WEIGHT = 30; // Highly greedy for 5x5 to ensure completion
        }

        const startTime = Date.now();
        let iterations = 0;
        const visited = new Set();

        // Add start state to visited!
        visited.add(startNode.getStringState());
        queue.enqueue(startNode, startNode.score(WEIGHT));

        while (queue.values.length > 0) {
            iterations++;

            if (iterations > MAX_ITERATIONS || Date.now() - startTime > MAX_TIME) {
                console.log(`Solver timed out after ${iterations} iterations`);
                postMessage([]);
                return;
            }

            const current = queue.dequeue();

            if (current.val.getHeuristictValue() === 0) {
                return postMessage(current.val.getPath());
            }

            const options = current.val.board.getPossibleMoves();

            for (const option of options) {
                const newState = current.val.clone();
                newState.board.makeMove(option);
                const stateStr = newState.getStringState();

                if (visited.has(stateStr)) {
                    continue;
                }

                newState.parent = current.val;
                newState.moveIndex = option;

                queue.enqueue(newState, newState.score(WEIGHT));
                visited.add(stateStr);
            }
        }
        // If no solution found
        postMessage([]);
    } catch (e: any) {
        console.error("Solver Worker Error:", e);
        postMessage([]);
    }
};
