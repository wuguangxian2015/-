export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAMEOVER = 'GAMEOVER',
  WIN = 'WIN',
}

export enum ShipType {
  BALANCED = 'BALANCED',
  SPEED = 'SPEED',
  TANK = 'TANK',
}

export enum EnemyType {
  BASIC = 'BASIC',
  FAST = 'FAST',
  HEAVY = 'HEAVY',
}

export enum PowerUpType {
  TRIPLE_SHOT = 'TRIPLE_SHOT',
  SHIELD = 'SHIELD',
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

export interface GameState {
  score: number;
  lives: number;
  level: number;
  status: GameStatus;
  achievements: Achievement[];
  highScore: number;
  selectedShip: ShipType;
  pilotRank: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface Entity extends Point {
  width: number;
  height: number;
  id: string;
}

export interface Bullet extends Entity {
  speed: number;
  angle: number;
  color: string;
}

export interface Enemy extends Entity {
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  color: string;
  scoreValue: number;
}

export interface PowerUp extends Entity {
  type: PowerUpType;
  speed: number;
  color: string;
}

export interface Particle extends Point {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}
