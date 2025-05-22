/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getRandomColor,
  getRandomFoodColor,
  getRandomName,
} from "@/lib/gameData";
import * as Phaser from "phaser";
import { useCallback, useRef } from "react";
import { useMobile } from "./use-mobile";
import { generateGridTile } from "@/lib/utils";

const GAME_WIDTH = 3000;
const GAME_HEIGHT = 3000;
const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;
const FOOD_COUNT_PER_GRID = 12;
const AI_SNAKE_COUNT = 10;
const INITIAL_SNAKE_SIZE = 20;
const FOOD_SIZE = 4;
const MINIMAP_SIZE = 100;
const GRID_SIZE = 12;
const AREA_X_PER_GRID = GAME_HEIGHT / GRID_SIZE;
const AREA_Y_PER_GRID = GAME_WIDTH / GRID_SIZE;

const staticConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: "100%",
  height: "100%",

  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
  },
};

type Food = {
  sprite: Phaser.GameObjects.Arc;
  glow: Phaser.GameObjects.Arc;
  value: number;
  color: string;
};

function generateNewFood(
  scene: Phaser.Scene,
  gridX: number,
  gridY: number
): Food {
  const foodX = Math.random() * AREA_X_PER_GRID + gridX * AREA_X_PER_GRID;
  const foodY = Math.random() * AREA_Y_PER_GRID + gridY * AREA_Y_PER_GRID;

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

const destroyFood = (food: Food) => {
  food.sprite.destroy(true);
  food.glow.destroy(true);
};

const createNewFoodArray = (scene: Phaser.Scene, foods: Food[][][]) => {
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

function getMinimapPosition(x: number, y: number) {
  return {
    x: (x / GAME_WIDTH) * MINIMAP_SIZE,
    y: (y / GAME_HEIGHT) * MINIMAP_SIZE,
  };
}

function getIndexAtGridPosition(x: number, y: number) {
  return {
    x: Math.min(Math.floor(x / AREA_X_PER_GRID), GRID_SIZE - 1),
    y: Math.min(Math.floor(y / AREA_Y_PER_GRID), GRID_SIZE - 1),
  };
}

type Segment = Phaser.GameObjects.Arc;
type BotSnake = {
  head: Phaser.GameObjects.Arc;
  segments: Phaser.GameObjects.Arc[];
  nameText: string;
  direction: number;
  speed: number;
  size: number;
  color: string;
  name: string;
  id: string;
  score: number;
};

const getSpeedBySize = (size: number) => {
  const baseSpeed = 6;
  const minSpeed = 2;

  const decayRate = 0.25;

  const speed = baseSpeed - Math.log(size + 1) * decayRate;

  return Math.max(minSpeed, speed);
};

const useGame = (
  gameContainerRef: React.RefObject<HTMLDivElement | null>,
  {
    onGameOver,
  }: {
    onGameOver: () => void;
  }
) => {
  const gameRef = useRef<Phaser.Game>(null);
  const foods: Food[][][] = [];
  let playerSize = INITIAL_SNAKE_SIZE;
  const score = useRef(0);
  let player: Segment;

  const playerSegments: Segment[] = [];
  const playerColor = getRandomColor();
  let joystickBase: Phaser.GameObjects.Arc;
  let joystickThumb: Phaser.GameObjects.Arc;
  let isUsingJoystick = false;
  const joystickVector = { x: 0, y: 0 };
  let playerDirection = 0;

  let minimap: Phaser.GameObjects.Graphics;

  // let cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  let camera: Phaser.Cameras.Scene2D.Camera;

  // bots
  const botSnakes: BotSnake[] = [];
  const isMobile = useMobile();

  function preload(this: Phaser.Scene) {}
  function create(this: Phaser.Scene) {
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.add
      .grid(0, 0, GAME_WIDTH, GAME_HEIGHT, 50, 50, 0x000000, 0, 0x333333, 0.3)
      .setOrigin(0, 0);

    const boundary = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
      .setOrigin(0, 0);
    boundary.setStrokeStyle(10, 0xe23670);

    const canvas = generateGridTile();
    this.textures.addCanvas("background-tile", canvas);
    this.add
      .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, "background-tile")
      .setOrigin(0);

    player = this.add.circle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      Math.max(8, playerSize / 10),
      Phaser.Display.Color.HexStringToColor(playerColor).color
    );

    // Create player segments
    playerSegments.length = 0;
    for (let i = 0; i < playerSize; i++) {
      const segment = this.add.circle(
        GAME_WIDTH / 2 - i * 10,
        GAME_HEIGHT / 2,
        Math.max(5, playerSize / 15),
        Phaser.Display.Color.HexStringToColor(playerColor).color
      );
      playerSegments.push(segment);
    }

    camera = this.cameras.main;
    camera.startFollow(player);
    camera.setZoom(1);

    // create food
    createNewFoodArray(this, foods);

    const minimapX = this.cameras.main.width - MINIMAP_SIZE - 10;
    const minimapY = this.cameras.main.height - MINIMAP_SIZE - 10;

    minimap = this.add.graphics().setScrollFactor(0).setDepth(100);
    minimap.x = minimapX;
    minimap.y = minimapY;

    if (this.input.keyboard) {
      this.input.keyboard.createCursorKeys();
    }

    if (isMobile) {
      setupMobileControls(this);
    }

    createBoTSnakes(this);
  }

  function update(this: Phaser.Scene) {
    if (!isMobile) {
      const pointer = this.input.activePointer;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

      playerDirection = Phaser.Math.Angle.Between(
        player.x,
        player.y,
        worldPoint.x,
        worldPoint.y
      );
    }

    const playerSpeed = getSpeedBySize(playerSize);
    const dx = Math.cos(playerDirection) * playerSpeed;
    const dy = Math.sin(playerDirection) * playerSpeed;

    const prevX = player.x;
    const prevY = player.y;
    player.x += dx;
    player.y += dy;

    if (
      player.x < 0 ||
      player.x > GAME_WIDTH ||
      player.y < 0 ||
      player.y > GAME_HEIGHT
    ) {
      handleGameOver(this);
      return;
    }

    updateSnakeSegments(playerSegments, prevX, prevY);

    checkFoodCollision(this, { x: player.x, y: player.y }, playerSegments);

    // checkCollisionWithBotSnakes(this, { x: player.x, y: player.y });

    drawMinimap();

    updateBotSnakes(this);
  }

  function drawMinimap() {
    if (!minimap) return;
    minimap.clear();

    minimap.fillStyle(0x000000, 0.5);
    minimap.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    minimap.lineStyle(1, 0xffffff, 1);
    minimap.strokeRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    const playerMinimap = getMinimapPosition(player.x, player.y);

    minimap.fillStyle(
      Phaser.Display.Color.HexStringToColor(playerColor).color,
      1
    );
    minimap.fillCircle(playerMinimap.x, playerMinimap.y, 4);

    playerSegments.forEach((segment) => {
      const segmentMinimap = getMinimapPosition(segment.x, segment.y);
      minimap.fillStyle(
        Phaser.Display.Color.HexStringToColor(playerColor).color,
        1
      );
      minimap.fillCircle(segmentMinimap.x, segmentMinimap.y, 3);
    });

    botSnakes.forEach((snake) => {
      const head = snake.head;
      minimap.fillStyle(Phaser.Display.Color.HexStringToColor("#ccc").color, 1);
      const headMinimap = getMinimapPosition(head.x, head.y);
      minimap.fillCircle(headMinimap.x, headMinimap.y, 4);

      snake.segments.forEach((segment) => {
        const segmentMinimap = getMinimapPosition(segment.x, segment.y);
        minimap.fillStyle(
          Phaser.Display.Color.HexStringToColor("#ccc").color,
          1
        );
        minimap.fillCircle(segmentMinimap.x, segmentMinimap.y, 3);
      });
    });

    minimap.lineStyle(1, 0xffffff, 1);
  }

  function checkFoodCollision(
    scene: Phaser.Scene,
    headPosition: { x: number; y: number },
    snakeSegments: Phaser.GameObjects.Arc[]
  ) {
    const { x: xPos, y: yPos } = getIndexAtGridPosition(
      headPosition.x,
      headPosition.y
    );

    const possibleCollisions = foods[xPos][yPos];

    for (let i = 0; i < possibleCollisions.length; i++) {
      const food = possibleCollisions[i];
      const distance = Phaser.Math.Distance.Between(
        headPosition.x,
        headPosition.y,
        food.sprite.x,
        food.sprite.y
      );
      if (distance < playerSize / 10 + FOOD_SIZE) {
        destroyFood(food);
        possibleCollisions[i] = generateNewFood(scene, xPos, yPos);
        growSnake(scene, snakeSegments, food.value);
      }
    }
  }

  function growSnake(
    scene: Phaser.Scene,
    snakeSegments: Phaser.GameObjects.Arc[],
    foodValue: number,
    botSnake?: BotSnake
  ) {
    for (let i = 0; i < foodValue; i++) {
      const lastSegment = snakeSegments[snakeSegments.length - 1];

      const newRadius = Math.max(5, playerSize / 15);
      const newSegment = scene.add.circle(
        lastSegment.x,
        lastSegment.y,
        newRadius,
        Phaser.Display.Color.HexStringToColor(botSnake?.color || playerColor)
          .color
      );

      snakeSegments.forEach((segment) => {
        if (segment.scene) {
          segment.setRadius(newRadius);
        }
      });
      snakeSegments.push(newSegment);
    }

    if (botSnake) {
      botSnake.size += foodValue;
      botSnake.score += foodValue;
    } else {
      playerSize += foodValue;
      score.current += foodValue;
    }
  }

  function createBoTSnakes(scene: Phaser.Scene) {
    for (let i = 0; i < AI_SNAKE_COUNT; i++) {
      const snakeColor = getRandomColor();
      const snakeName = getRandomName();

      const snakeSize = INITIAL_SNAKE_SIZE + Math.floor(Math.random() * 30);
      const snakeX = Math.random() * GAME_HEIGHT;
      const snakeY = Math.random() * GAME_WIDTH;

      const snakeHead = scene.add.circle(
        snakeX,
        snakeY,
        Math.max(8, snakeSize / 10),
        Phaser.Display.Color.HexStringToColor(snakeColor).color
      );

      const segments: Segment[] = [];

      for (let j = 0; j < snakeSize; j++) {
        const segment = scene.add.circle(
          snakeX - j * 10,
          snakeY,
          Math.max(5, snakeSize / 15),
          Phaser.Display.Color.HexStringToColor(snakeColor).color
        );
        segments.push(segment);
      }

      botSnakes.push({
        head: snakeHead,
        segments: segments,
        nameText: snakeName,
        direction: Math.random() * Math.PI * 2,
        speed: 2 + Math.random(),
        size: snakeSize,
        color: snakeColor,
        name: snakeName,
        id: `snake-${i}`,
        score: 0,
      });
    }
  }

  function updateBotSnakes(scene: Phaser.Scene) {
    for (let i = 0; i < botSnakes.length; i++) {
      const botSnake = botSnakes[i];

      if (Math.random() < 0.02) {
        botSnake.direction += (Math.random() - 0.5) * 1;
      }

      const nearbyFood = findNearbyFood(botSnake.head.x, botSnake.head.y, 200);

      if (nearbyFood) {
        const angle = Phaser.Math.Angle.Between(
          botSnake.head.x,
          botSnake.head.y,
          nearbyFood.sprite.x,
          nearbyFood.sprite.y
        );

        const angleDiff = Phaser.Math.Angle.Wrap(angle - botSnake.direction);
        botSnake.direction +=
          Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 0.1);
      }
      const botSpeed = getSpeedBySize(botSnake.size);
      const dx = Math.cos(botSnake.direction) * botSpeed;
      const dy = Math.sin(botSnake.direction) * botSpeed;

      const prevX = botSnake.head.x;
      const prevY = botSnake.head.y;
      botSnake.head.x += dx;
      botSnake.head.y += dy;

      if (botSnake.head.x < 0 || botSnake.head.x > GAME_WIDTH) {
        botSnake.direction = Math.PI - botSnake.direction;
        botSnake.head.x = Phaser.Math.Clamp(botSnake.head.x, 0, GAME_WIDTH);
      }

      if (botSnake.head.y < 0 || botSnake.head.y > GAME_HEIGHT) {
        botSnake.direction = -botSnake.direction;
        botSnake.head.y = Phaser.Math.Clamp(botSnake.head.y, 0, GAME_HEIGHT);
      }

      // Update AI segments
      updateSnakeSegments(botSnake.segments, prevX, prevY);
      const { x: xPos, y: yPos } = getIndexAtGridPosition(
        botSnake.head.x,
        botSnake.head.y
      );

      const possibleCollisions = foods[xPos][yPos];

      possibleCollisions.forEach((food, foodIndex) => {
        const distance = Phaser.Math.Distance.Between(
          botSnake.head.x,
          botSnake.head.y,
          food.sprite.x,
          food.sprite.y
        );

        if (distance < botSnake.size / 10 + FOOD_SIZE) {
          destroyFood(food);
          possibleCollisions[foodIndex] = generateNewFood(scene, xPos, yPos);
          growSnake(scene, botSnake.segments, food.value, botSnake);
        }
      });
    }
  }

  function findNearbyFood(x: number, y: number, radius: number) {
    let closestFood = null;
    let closestDistance = radius;

    const { x: xPos, y: yPos } = getIndexAtGridPosition(x, y);

    const possibleCollisions = foods[xPos][yPos];

    for (const food of possibleCollisions) {
      const distance = Phaser.Math.Distance.Between(
        x,
        y,
        food.sprite.x,
        food.sprite.y
      );

      if (distance < 4) continue;
      if (distance < 12) {
        return food;
      }

      if (distance < closestDistance) {
        closestDistance = distance;
        closestFood = food;
      }
    }

    return closestFood;
  }

  function updateSnakeSegments(
    segments: Phaser.GameObjects.Arc[],
    headX: number,
    headY: number
  ) {
    let prevX = headX;
    let prevY = headY;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const tempX = segment.x;
      const tempY = segment.y;

      segment.x = prevX;
      segment.y = prevY;

      prevX = tempX;
      prevY = tempY;
    }
  }

  function cleanGameState() {
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;

      score.current = 0;
      playerSize = INITIAL_SNAKE_SIZE;
      playerDirection = 0;
      joystickVector.x = 0;
      joystickVector.y = 0;

      playerSegments.forEach((segment) => segment.destroy(true));
      botSnakes.forEach((snake) => {
        snake.segments.forEach((segment) => segment.destroy(true));
        snake.head.destroy(true);
      });
      botSnakes.length = 0;
    }
  }

  function handleGameOver(scene: any) {
    scene.scene.pause();
    onGameOver();
  }

  function resetJoystick() {
    if (joystickThumb && joystickBase) {
      joystickThumb.x = joystickBase.x;
      joystickThumb.y = joystickBase.y;
      joystickVector.x = 0;
      joystickVector.y = 0;
    }
  }

  function setupMobileControls(scene: Phaser.Scene) {
    // Create joystick
    joystickBase = scene.add
      .circle(100, scene.cameras.main.height - 100, 50, 0x000000, 0.5)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive();

    joystickThumb = scene.add
      .circle(100, scene.cameras.main.height - 100, 20, 0xffffff, 0.7)
      .setScrollFactor(0)
      .setDepth(101);

    // Joystick events
    scene.input.on("pointerdown", (pointer: any) => {
      if (
        Phaser.Geom.Circle.Contains(
          new Phaser.Geom.Circle(joystickBase.x, joystickBase.y, 50),
          pointer.x,
          pointer.y
        )
      ) {
        isUsingJoystick = true;
      }
    });

    scene.input.on("pointermove", (pointer: any) => {
      if (isUsingJoystick && pointer.isDown) {
        const distance = Phaser.Math.Distance.Between(
          joystickBase.x,
          joystickBase.y,
          pointer.x,
          pointer.y
        );

        const maxDistance = 40;

        if (distance <= maxDistance) {
          joystickThumb.x = pointer.x;
          joystickThumb.y = pointer.y;
        } else {
          const angle = Phaser.Math.Angle.Between(
            joystickBase.x,
            joystickBase.y,
            pointer.x,
            pointer.y
          );

          joystickThumb.x = joystickBase.x + Math.cos(angle) * maxDistance;
          joystickThumb.y = joystickBase.y + Math.sin(angle) * maxDistance;
        }

        joystickVector.x = joystickThumb.x - joystickBase.x;
        joystickVector.y = joystickThumb.y - joystickBase.y;

        const length = Math.sqrt(
          joystickVector.x * joystickVector.x +
            joystickVector.y * joystickVector.y
        );
        if (length > 0) {
          joystickVector.x /= length;
          joystickVector.y /= length;
        }

        // Set player direction based on joystick
        playerDirection = Math.atan2(joystickVector.y, joystickVector.x);
      }
    });

    scene.input.on("pointerup", () => {
      if (isUsingJoystick) {
        resetJoystick();
        isUsingJoystick = false;
      }
    });
  }

  const startGame = useCallback(() => {
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game({
        ...staticConfig,
        parent: gameContainerRef.current,
        scale: {
          ...staticConfig.scale,
          parent: gameContainerRef.current,
        },
        scene: {
          preload: preload,
          create: create,
          update: update,
        },
      });
    }
  }, [gameContainerRef]);

  return {
    startGame,
    cleanGameState,
    score: score.current,
  };
};

export default useGame;
