import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { useMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Input } from "../ui/input";

const StartGameModal = ({
  initializeGame,
}: {
  initializeGame: (playerName: string) => void;
}) => {
  const [playerName, setPlayerName] = useState("");
  const isMobile = useMobile();
  return (
    <Card className="w-full max-w-md dark:!bg-gray-900 mt-4">
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
            onClick={() => initializeGame(playerName)}
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
  );
};

export default StartGameModal;
