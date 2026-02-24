import { Achievement } from './types';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    title: '第一滴血',
    description: '击毁第一架敌机',
    unlocked: false,
    icon: 'Target',
  },
  {
    id: 'survivor',
    title: '生存者',
    description: '在单局游戏中存活超过 60 秒',
    unlocked: false,
    icon: 'Shield',
  },
  {
    id: 'ace_pilot',
    title: '王牌飞行员',
    description: '单局击毁 50 架敌机',
    unlocked: false,
    icon: 'Trophy',
  },
  {
    id: 'power_up_master',
    title: '强化大师',
    description: '同时拥有护盾和三向子弹',
    unlocked: false,
    icon: 'Zap',
  },
  {
    id: 'level_5',
    title: '星际先锋',
    description: '到达第 5 关',
    unlocked: false,
    icon: 'Star',
  },
  {
    id: 'level_10',
    title: '星际主宰',
    description: '到达第 10 关',
    unlocked: false,
    icon: 'Trophy',
  },
];

export const PILOT_RANKS = [
  "新兵飞行员",
  "初级飞行员",
  "中级飞行员",
  "高级飞行员",
  "王牌飞行员",
  "星际精英",
  "银河卫士",
  "星系指挥官",
  "宇宙先锋",
  "星际主宰"
];

export const GAME_CONFIG = {
  PLAYER_SPEED: 5,
  PLAYER_WIDTH: 40,
  PLAYER_HEIGHT: 40,
  BULLET_SPEED: 8,
  BULLET_COOLDOWN: 200,
  ENEMY_SPAWN_RATE: 1500, // ms
  POWERUP_SPAWN_CHANCE: 0.1,
  INVINCIBILITY_DURATION: 2000,
  LEVEL_UP_SCORE: 1000,
};
