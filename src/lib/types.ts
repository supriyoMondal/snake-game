export type Food = {
  sprite: Phaser.GameObjects.Arc;
  glow: Phaser.GameObjects.Arc;
  value: number;
  color: string;
};

export type Segment = Phaser.GameObjects.Arc;
export type BotSnake = {
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
