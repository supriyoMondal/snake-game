import * as Phaser from "phaser";

export const GAME_WIDTH = 3000;
export const GAME_HEIGHT = 3000;
export const VIEWPORT_WIDTH = 800;
export const VIEWPORT_HEIGHT = 600;
export const FOOD_COUNT_PER_GRID = 12;
export const AI_SNAKE_COUNT = 10;
export const INITIAL_SNAKE_SIZE = 20;
export const FOOD_SIZE = 2;
export const MINIMAP_SIZE = 100;
export const GRID_SIZE = 12;
export const AREA_X_PER_GRID = GAME_HEIGHT / GRID_SIZE;
export const AREA_Y_PER_GRID = GAME_WIDTH / GRID_SIZE;

export const staticConfig: Phaser.Types.Core.GameConfig = {
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

export function getRandomColor() {
  const colors = [
    "#4bc0c0",
    "#e6d800",
    "#9b19f5",
    "#ffa300",
    "#dc0ab4",
    "#b3d4ff",
    "#00bfa0",
    "#e60049",
    "#0bb4ff",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getRandomFoodColor() {
  const colors = [
    "#2662D9",
    "#2EB88A",
    "#E23670",
    "#E88C30",
    "#AF57DB",

    "#2A9D90",
    "#E76E50",
    "#274754",
    "#E8C468",
    "#F4A462",
    "#4bc0c0",
    "#e6d800",
    "#9b19f5",
    "#ffa300",
    "#dc0ab4",
    "#b3d4ff",
    "#00bfa0",
    "#e60049",
    "#0bb4ff",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getRandomName() {
  const names = [
    "Slithery",
    "Wiggles",
    "Noodle",
    "Viper",
    "Cobra",
    "Python",
    "Mamba",
    "Fang",
    "Scales",
    "Hissy",
  ];
  return names[Math.floor(Math.random() * names.length)];
}
