import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";

const SnakeGame = () => {
  const [playerName, setPlayerName] = useState("");
  const [gameState, setGameState] = useState<
    "notStarted" | "playing" | "finished"
  >("notStarted");

  const isMobile = false;

  const initializeGame = () => {
    setGameState("playing");
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-center">Snake Game</h1>

      {gameState === "notStarted" && (
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-semibold text-center">
                Enter Your Name
              </h2>
              <Input
                type="text"
                placeholder="Your snake name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="text-lg"
              />
              <Button
                onClick={initializeGame}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Start Game
              </Button>
              <div className="text-sm text-muted-foreground mt-2">
                <p>
                  🎮 Controls:{" "}
                  {isMobile
                    ? "Use the joystick to control direction"
                    : "Move your mouse to control direction"}
                </p>
                <p>🍎 Eat food to grow bigger</p>
                <p>⚠️ Don't leave the map boundaries or you'll die</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SnakeGame;
