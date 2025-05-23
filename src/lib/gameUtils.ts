import {
  AREA_X_PER_GRID,
  AREA_Y_PER_GRID,
  FOOD_COUNT_PER_GRID,
  FOOD_SIZE,
  GAME_HEIGHT,
  GAME_WIDTH,
  getRandomFoodColor,
  GRID_SIZE,
  MINIMAP_SIZE,
} from "./gameData";
import type { Food } from "./types";

export const generateFoodPosition = (x: number, y: number) => {
  return {
    x: Math.random() * AREA_X_PER_GRID + x * AREA_X_PER_GRID,
    y: Math.random() * AREA_Y_PER_GRID + y * AREA_Y_PER_GRID,
  };
};

export function generateNewFood(
  scene: Phaser.Scene,
  gridX: number,
  gridY: number
): Food {
  const { x: foodX, y: foodY } = generateFoodPosition(gridX, gridY);

  const foodColor = getRandomFoodColor();
  const foodValue = Math.floor(Math.random() * 2) + 1;
  const mainColor = Phaser.Display.Color.HexStringToColor(foodColor).color;

  const size = FOOD_SIZE + foodValue;

  const glow = scene.add.circle(foodX, foodY, size + 4, mainColor, 0.3);
  glow.setDepth(0); // behind
  glow.setAlpha(0.4);

  // Create main food
  const food = scene.add.circle(foodX, foodY, size, mainColor, 1);
  food.setDepth(1);

  // Pulse individually with random delay
  scene.tweens.add({
    targets: [food, glow],
    scale: { from: 1, to: 1.2 },
    duration: 500,
    yoyo: true,
    repeat: -1,
    delay: Math.random() * 1000, // Desyncs animation
    ease: "Sine.easeInOut",
  });

  return {
    sprite: food,
    value: foodValue,
    color: foodColor,
    glow,
  };
}

export function getIndexAtGridPosition(x: number, y: number) {
  return {
    x: Math.min(Math.floor(x / AREA_X_PER_GRID), GRID_SIZE - 1),
    y: Math.min(Math.floor(y / AREA_Y_PER_GRID), GRID_SIZE - 1),
  };
}

export const destroyFood = (food: Food) => {
  const gridPosition = getIndexAtGridPosition(food.sprite.x, food.sprite.y);

  const { x: foodX, y: foodY } = generateFoodPosition(
    gridPosition.x,
    gridPosition.y
  );

  food.sprite.x = foodX;
  food.sprite.y = foodY;
  food.glow.x = foodX;
  food.glow.y = foodY;
};

export const createNewFoodArray = (scene: Phaser.Scene, foods: Food[][][]) => {
  let foodCount = 0;
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (!foods[i]) foods[i] = [];
      foods[i][j] = Array.from({ length: FOOD_COUNT_PER_GRID }, () =>
        generateNewFood(scene, i, j)
      );
      foodCount += FOOD_COUNT_PER_GRID;
    }
  }
  console.log(foodCount);

  return foods;
};

export function getMinimapPosition(x: number, y: number) {
  return {
    x: (x / GAME_WIDTH) * MINIMAP_SIZE,
    y: (y / GAME_HEIGHT) * MINIMAP_SIZE,
  };
}

export const getBodyRadius = (foodEaten: number) => {
  const baseSize = 3;
  const maxSize = 15;

  const growthFactor = 5;

  const radius = baseSize + growthFactor * Math.log2(foodEaten + 1);

  return Math.min(radius, maxSize);
};

export const getSpeedBySize = (size: number) => {
  const baseSpeed = 5;
  const minSpeed = 2;

  const decayRate = 0.25;

  const speed = baseSpeed - Math.log(size + 1) * decayRate;

  return Math.max(minSpeed, speed);
};
