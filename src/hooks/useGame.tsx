/* eslint-disable @typescript-eslint/no-explicit-any */
import { getRandomColor, getRandomFoodColor } from "@/lib/gameData";
import * as Phaser from "phaser";
import { useCallback, useRef } from "react";
import { useMobile } from "./use-mobile";

const GAME_WIDTH = 3000;
const GAME_HEIGHT = 3000;
const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;
const FOOD_COUNT = 500;
const AI_SNAKE_COUNT = 10;
const INITIAL_SNAKE_SIZE = 20;
const FOOD_SIZE = 10;
const MINIMAP_SIZE = 100;

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
  value: number;
  color: string;
};

function generateNewFood(scene: Phaser.Scene): Food {
  const foodX = Math.random() * GAME_WIDTH;
  const foodY = Math.random() * GAME_HEIGHT;
  const foodColor = getRandomFoodColor();
  const foodValue = Math.floor(Math.random() * 3) + 1;

  const food = scene.add.circle(
    foodX,
    foodY,
    FOOD_SIZE,
    Phaser.Display.Color.HexStringToColor(foodColor).color
  );

  return {
    sprite: food,
    value: foodValue,
    color: foodColor,
  };
}

const useGame = (
  gameContainerRef: React.RefObject<HTMLDivElement | null>,
  {
    onGameOver,
  }: {
    onGameOver: () => void;
  }
) => {
  const gameRef = useRef<Phaser.Game>(null);
  const foods: Food[] = [];
  let playerSize = INITIAL_SNAKE_SIZE;
  let player: Phaser.GameObjects.Arc;

  const playerSegments: Phaser.GameObjects.Arc[] = [];
  const playerColor = getRandomColor();
  let joystickBase: Phaser.GameObjects.Arc;
  let joystickThumb: Phaser.GameObjects.Arc;
  let isUsingJoystick = false;
  const joystickVector = { x: 0, y: 0 };
  let playerDirection = 0;

  let minimap: Phaser.GameObjects.Graphics;
  let cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  let camera: Phaser.Cameras.Scene2D.Camera;
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
    boundary.setStrokeStyle(10, 0xff0000);

    player = this.add.circle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      Math.max(8, playerSize / 10),
      Phaser.Display.Color.HexStringToColor(playerColor).color
    );

    // Create player segments
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
    for (let i = 0; i < FOOD_COUNT; i++) {
      foods.push(generateNewFood(this));
    }

    const minimapX = this.cameras.main.width - MINIMAP_SIZE - 10;
    const minimapY = this.cameras.main.height - MINIMAP_SIZE - 10;

    minimap = this.add.graphics().setScrollFactor(0).setDepth(100);
    minimap.x = minimapX;
    minimap.y = minimapY;

    if (this.input.keyboard) {
      cursors = this.input.keyboard.createCursorKeys();
    }

    if (isMobile) {
      setupMobileControls(this);
    }
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

    const playerSpeed = 3 + playerSize / 100;
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

    checkFoodCollision(this, player, playerSegments);

    drawMinimap();
  }

  function drawMinimap() {
    if (!minimap) return;
    minimap.clear();

    minimap.fillStyle(0x000000, 0.5);
    minimap.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    minimap.lineStyle(1, 0xffffff, 1);
    minimap.strokeRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    const playerMinimapX = (player.x / GAME_WIDTH) * MINIMAP_SIZE;
    const playerMinimapY = (player.y / GAME_HEIGHT) * MINIMAP_SIZE;

    minimap.fillStyle(
      Phaser.Display.Color.HexStringToColor(playerColor).color,
      1
    );
    minimap.fillCircle(playerMinimapX, playerMinimapY, 3);

    const viewportX = (camera.scrollX / GAME_WIDTH) * MINIMAP_SIZE;
    const viewportY = (camera.scrollY / GAME_HEIGHT) * MINIMAP_SIZE;
    const viewportWidth = (camera.width / GAME_WIDTH) * MINIMAP_SIZE;
    const viewportHeight = (camera.height / GAME_HEIGHT) * MINIMAP_SIZE;

    minimap.lineStyle(1, 0xffffff, 1);
    minimap.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);
  }

  function checkFoodCollision(
    scene: Phaser.Scene,
    snakeHead: Phaser.GameObjects.Arc,
    snakeSegments: Phaser.GameObjects.Arc[]
  ) {
    for (let i = 0; i < foods.length; i++) {
      const food = foods[i];
      const distance = Phaser.Math.Distance.Between(
        snakeHead.x,
        snakeHead.y,
        food.sprite.x,
        food.sprite.y
      );
      if (distance < playerSize / 10 + FOOD_SIZE) {
        food.sprite.destroy();
        foods[i] = generateNewFood(scene);

        growSnake(scene, snakeSegments, food.value);
      }
    }
  }

  function growSnake(
    scene: Phaser.Scene,
    snakeSegments: Phaser.GameObjects.Arc[],
    foodValue: number
  ) {
    for (let i = 0; i < foodValue; i++) {
      const lastSegment = snakeSegments[snakeSegments.length - 1];
      const newSegment = scene.add.circle(
        lastSegment.x,
        lastSegment.y,
        Math.max(5, playerSize / 15),
        Phaser.Display.Color.HexStringToColor(playerColor).color
      );
      snakeSegments.push(newSegment);
    }

    playerSize += foodValue;
    console.log(playerSize);
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
    score: playerSize,
  };
};

export default useGame;
