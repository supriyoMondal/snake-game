import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef, useState } from "react";
import StartGameModal from "./StartGameModal";
import useGame from "@/hooks/useGame";
import { Button } from "../ui/button";

const SnakeGame = () => {
  const [gameState, setGameState] = useState<
    "notStarted" | "playing" | "finished"
  >("notStarted");

  const { toast } = useToast();

  const gameContainerRef = useRef<HTMLDivElement>(null);
  const { startGame, score, cleanGameState } = useGame(gameContainerRef, {
    onGameOver() {
      setGameState("finished");
    },
  });

  const initializeGame = (playerName: string) => {
    if (!playerName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to start the game",
        variant: "destructive",
      });
      return;
    }
    setGameState("playing");
    setTimeout(() => {
      startGame();
    }, 100);
  };

  const restartGame = () => {
    setGameState("playing");
    cleanGameState();
    startGame();
  };

  useEffect(() => {
    initializeGame("supriyomondal");
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-center">Snake Game</h1>

      {gameState === "notStarted" ? (
        <StartGameModal initializeGame={initializeGame} />
      ) : (
        <div className="relative w-full h-[600px] md:h-[700px] rounded-lg overflow-hidden mt-4">
          {gameState === "finished" && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/70">
              <div className="bg-card p-8 rounded-lg text-center">
                <h2 className="text-3xl font-bold mb-2">Game Over</h2>
                <p className="text-xl mb-4">Your score: {score}</p>
                <Button
                  onClick={restartGame}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Play Again
                </Button>
              </div>
            </div>
          )}
          {/* <div className="absolute top-0 left-0 z-10 p-2">
            <div className="bg-black/70 p-3 rounded-lg">
              <h3 className="text-white text-lg font-bold mb-2 text-center">
                Leaderboard
              </h3>
              <ul>
                {leaderboard.map((entry, index) => (
                  <li key={entry.id} className="flex items-center mb-1">
                    <span className="text-white mr-2">{index + 1}.</span>
                    <span
                      className={`${
                        entry.isPlayer
                          ? "text-yellow-300 font-bold"
                          : "text-white"
                      }`}
                    >
                      {entry.name}: {entry.score}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div> */}

          <div ref={gameContainerRef} className="w-full h-full" />
        </div>
      )}
    </div>
  );
};

export default SnakeGame;
