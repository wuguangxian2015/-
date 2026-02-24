/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rocket, 
  Play, 
  Pause, 
  RotateCcw, 
  Trophy, 
  Shield, 
  Zap, 
  Target, 
  Star, 
  Info,
  X,
  ChevronRight,
  User
} from 'lucide-react';
import { GameStatus, GameState, Achievement, ShipType } from './types';
import { INITIAL_ACHIEVEMENTS, PILOT_RANKS } from './constants';
import GameEngine from './components/GameEngine';

const AchievementIcon = ({ id, size = 20 }: { id: string, size?: number }) => {
  switch (id) {
    case 'Target': return <Target size={size} />;
    case 'Shield': return <Shield size={size} />;
    case 'Trophy': return <Trophy size={size} />;
    case 'Zap': return <Zap size={size} />;
    case 'Star': return <Star size={size} />;
    default: return <Trophy size={size} />;
  }
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    level: 1,
    status: GameStatus.START,
    achievements: INITIAL_ACHIEVEMENTS,
    highScore: parseInt(localStorage.getItem('tina_highscore') || '0'),
    selectedShip: ShipType.BALANCED,
    pilotRank: PILOT_RANKS[0],
  });

  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      pilotRank: PILOT_RANKS[Math.min(prev.level - 1, PILOT_RANKS.length - 1)]
    }));
  }, [gameState.level]);

  const ships = [
    { type: ShipType.BALANCED, name: '全能战斗机', desc: '火力与机动性均衡', color: 'text-neon-blue' },
    { type: ShipType.SPEED, name: '截击战斗机', desc: '极速突进，适合侧翼袭扰', color: 'text-neon-green' },
    { type: ShipType.TANK, name: '重装战斗机', desc: '装甲厚重，正面硬刚', color: 'text-neon-purple' },
  ];

  const [lastAchievement, setLastAchievement] = useState<Achievement | null>(null);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 1024);

  const handleStateChange = useCallback((updates: Partial<GameState>) => {
    setGameState(prev => {
      const newState = { ...prev, ...updates };
      if (newState.score > newState.highScore) {
        newState.highScore = newState.score;
        localStorage.setItem('tina_highscore', newState.highScore.toString());
      }
      return newState;
    });
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    setGameState(prev => {
      const achievement = prev.achievements.find(a => a.id === id);
      if (achievement && !achievement.unlocked) {
        const newAchievements = prev.achievements.map(a => 
          a.id === id ? { ...a, unlocked: true } : a
        );
        setLastAchievement({ ...achievement, unlocked: true });
        setTimeout(() => setLastAchievement(null), 3000);
        return { ...prev, achievements: newAchievements };
      }
      return prev;
    });
  }, []);

  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      lives: 3,
      level: 1,
      status: GameStatus.PLAYING,
    }));
  };

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      status: GameStatus.START,
    }));
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-space-dark font-sans select-none">
      {/* Dynamic Star Background (Static for UI overlay) */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-space-blue)_0%,_transparent_70%)]" />
      </div>

      {/* Game Engine */}
      {(gameState.status === GameStatus.PLAYING || gameState.status === GameStatus.PAUSED) && (
        <GameEngine 
          gameState={gameState}
          onStateChange={handleStateChange}
          onAchievementUnlock={unlockAchievement}
          onGameOver={() => handleStateChange({ status: GameStatus.GAMEOVER })}
        />
      )}

      {/* HUD */}
      <AnimatePresence>
        {gameState.status === GameStatus.PLAYING && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none"
          >
            <div className="glass-dark rounded-2xl p-4 flex gap-6 items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neon-blue/20 border border-neon-blue/40 flex items-center justify-center overflow-hidden">
                  <User size={24} className="text-neon-blue" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-white/50 font-display">Pilot: 光头强</span>
                  <span className="text-xs font-bold text-neon-blue">{gameState.pilotRank}</span>
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-white/50 font-display">Score</span>
                <span className="text-2xl font-display neon-text-blue">{gameState.score.toLocaleString()}</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-white/50 font-display">Level</span>
                <span className="text-2xl font-display text-neon-green">{gameState.level}</span>
              </div>
            </div>

            <div className="glass-dark rounded-2xl p-4 flex gap-4 items-center">
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scale: i < gameState.lives ? 1 : 0.8,
                      opacity: i < gameState.lives ? 1 : 0.2 
                    }}
                  >
                    <Rocket 
                      className={i < gameState.lives ? "text-neon-red fill-neon-red/20" : "text-white/20"} 
                      size={24} 
                    />
                  </motion.div>
                ))}
              </div>
              <button 
                onClick={() => handleStateChange({ status: GameStatus.PAUSED })}
                className="pointer-events-auto p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <Pause size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start Screen */}
      <AnimatePresence>
        {gameState.status === GameStatus.START && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-6 z-50"
          >
            <div className="glass-dark max-w-2xl w-full rounded-[2rem] p-12 flex flex-col items-center text-center relative overflow-hidden scanline">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="mb-8"
              >
                <Rocket size={80} className="text-neon-blue drop-shadow-[0_0_20px_rgba(0,242,255,0.5)]" />
              </motion.div>
              
              <h1 className="text-6xl md:text-7xl font-display font-black mb-4 tracking-tighter">
                光头强<span className="text-neon-blue">星际先锋</span>
              </h1>
              <p className="text-white/60 text-lg mb-8 max-w-md">
                光头强驾驶王牌战斗机，穿越无尽星海，击退外星入侵者。
              </p>

              <div className="w-full max-w-md mb-10">
                <p className="text-xs uppercase tracking-widest text-white/40 mb-4 text-left">选择你的战斗机型</p>
                <div className="grid grid-cols-3 gap-3">
                  {ships.map((ship) => (
                    <button
                      key={ship.type}
                      onClick={() => handleStateChange({ selectedShip: ship.type })}
                      className={`glass p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${
                        gameState.selectedShip === ship.type 
                        ? 'border-neon-blue bg-white/20 scale-105' 
                        : 'hover:bg-white/5 opacity-60'
                      }`}
                    >
                      <Rocket className={ship.color} size={24} />
                      <span className="text-xs font-bold">{ship.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-white/40 mt-3 italic">
                  {ships.find(s => s.type === gameState.selectedShip)?.desc}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <button 
                  onClick={startGame}
                  className="flex-1 bg-neon-blue text-space-dark font-display font-bold py-4 px-8 rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2 group"
                >
                  <Play size={20} className="group-hover:translate-x-1 transition-transform" />
                  开始作战
                </button>
                <button 
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="flex-1 glass py-4 px-8 rounded-2xl font-display font-bold hover:bg-white/20 transition-colors flex items-center justify-center gap-2 lg:hidden"
                >
                  <Info size={20} />
                  操作指南
                </button>
              </div>

              <div className="mt-12 flex gap-8">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">High Score</p>
                  <p className="text-xl font-display text-neon-purple">{gameState.highScore.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause Menu */}
      <AnimatePresence>
        {gameState.status === GameStatus.PAUSED && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-6 z-50 bg-black/60 backdrop-blur-sm"
          >
            <div className="glass-dark rounded-[2rem] p-12 flex flex-col items-center max-w-sm w-full">
              <h2 className="text-4xl font-display mb-8">作战暂停</h2>
              <div className="flex flex-col gap-4 w-full">
                <button 
                  onClick={() => handleStateChange({ status: GameStatus.PLAYING })}
                  className="w-full bg-white text-space-dark font-display font-bold py-4 rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
                >
                  <Play size={20} /> 继续战斗
                </button>
                <button 
                  onClick={resetGame}
                  className="w-full glass py-4 rounded-2xl font-display font-bold hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} /> 退出任务
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Screen */}
      <AnimatePresence>
        {gameState.status === GameStatus.GAMEOVER && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-6 z-50 bg-black/80 backdrop-blur-md"
          >
            <div className="glass-dark max-w-lg w-full rounded-[2rem] p-12 flex flex-col items-center text-center">
              <h2 className="text-5xl font-display text-neon-red mb-2">任务失败</h2>
              <p className="text-white/40 mb-8">战机已坠毁，基地失去联系</p>

              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className="glass rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Final Score</p>
                  <p className="text-2xl font-display text-neon-blue">{gameState.score.toLocaleString()}</p>
                </div>
                <div className="glass rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Max Level</p>
                  <p className="text-2xl font-display text-neon-green">{gameState.level}</p>
                </div>
              </div>

              <div className="w-full mb-8">
                <p className="text-left text-xs uppercase tracking-widest text-white/40 mb-4">解锁成就</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {gameState.achievements.filter(a => a.unlocked).map(a => (
                    <div key={a.id} className="glass p-2 rounded-lg" title={a.title}>
                      <AchievementIcon id={a.icon} size={16} />
                    </div>
                  ))}
                  {gameState.achievements.filter(a => a.unlocked).length === 0 && (
                    <p className="text-white/20 italic text-sm">本次飞行未获得成就</p>
                  )}
                </div>
              </div>

              <button 
                onClick={startGame}
                className="w-full bg-neon-blue text-space-dark font-display font-bold py-4 rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} /> 再次尝试
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Victory Screen */}
      <AnimatePresence>
        {gameState.status === GameStatus.WIN && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-6 z-50 bg-black/80 backdrop-blur-md"
          >
            <div className="glass-dark max-w-lg w-full rounded-[2rem] p-12 flex flex-col items-center text-center border-neon-green/50 border-2">
              <div className="mb-6 bg-neon-green/20 p-6 rounded-full">
                <Trophy size={64} className="text-neon-green drop-shadow-[0_0_20px_rgba(57,255,20,0.5)]" />
              </div>
              <h2 className="text-5xl font-display text-neon-green mb-2">星际主宰</h2>
              <p className="text-white/60 mb-8">你成功击退了所有波次的敌人，维护了星系的和平！</p>

              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className="glass rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Final Score</p>
                  <p className="text-2xl font-display text-neon-blue">{gameState.score.toLocaleString()}</p>
                </div>
                <div className="glass rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">High Score</p>
                  <p className="text-2xl font-display text-neon-purple">{gameState.highScore.toLocaleString()}</p>
                </div>
              </div>

              <button 
                onClick={resetGame}
                className="w-full bg-neon-green text-space-dark font-display font-bold py-4 rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} /> 返回主菜单
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar / Instructions */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div 
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="absolute top-0 right-0 bottom-0 w-80 glass-dark z-[60] p-8 overflow-y-auto lg:relative lg:block"
          >
            <div className="flex justify-between items-center mb-8 lg:hidden">
              <h3 className="text-xl font-display">指南</h3>
              <button onClick={() => setShowSidebar(false)}><X /></button>
            </div>
            
            <div className="space-y-8">
              <section>
                <h4 className="text-xs uppercase tracking-widest text-neon-blue mb-4 font-bold">操作方式</h4>
                <div className="space-y-3 text-sm text-white/70">
                  <div className="flex justify-between items-center glass p-3 rounded-xl">
                    <span>移动</span>
                    <span className="bg-white/10 px-2 py-1 rounded text-xs">WASD / 方向键</span>
                  </div>
                  <div className="flex justify-between items-center glass p-3 rounded-xl">
                    <span>射击</span>
                    <span className="bg-white/10 px-2 py-1 rounded text-xs">空格键</span>
                  </div>
                  <div className="flex justify-between items-center glass p-3 rounded-xl">
                    <span>暂停</span>
                    <span className="bg-white/10 px-2 py-1 rounded text-xs">P 键</span>
                  </div>
                  <div className="flex justify-between items-center glass p-3 rounded-xl">
                    <span>移动端</span>
                    <span className="bg-white/10 px-2 py-1 rounded text-xs">触摸屏幕</span>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs uppercase tracking-widest text-neon-purple mb-4 font-bold">补给道具</h4>
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="bg-neon-red/20 p-2 rounded-lg text-neon-red border border-neon-red/30">
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">三向子弹</p>
                      <p className="text-xs text-white/50">大幅增强火力，持续 10 秒</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="bg-neon-purple/20 p-2 rounded-lg text-neon-purple border border-neon-purple/30">
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">能量护盾</p>
                      <p className="text-xs text-white/50">抵挡一次致命伤害</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs uppercase tracking-widest text-neon-green mb-4 font-bold">情报摘要</h4>
                <div className="space-y-2 text-xs text-white/50 italic">
                  <p>• 敌机逃脱会扣除 50 分</p>
                  <p>• 每 1000 分提升一个关卡</p>
                  <p>• 关卡越高，敌机速度越快，刷新更频繁</p>
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement Unlock Popup */}
      <AnimatePresence>
        {lastAchievement && (
          <motion.div 
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-8 right-8 z-[100] glass-dark p-4 rounded-2xl flex items-center gap-4 border-neon-blue/50"
          >
            <div className="bg-neon-blue/20 p-3 rounded-xl text-neon-blue">
              <AchievementIcon id={lastAchievement.icon} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neon-blue font-bold">成就解锁</p>
              <p className="font-display text-sm">{lastAchievement.title}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Banner */}
      <AnimatePresence>
        {gameState.status === GameStatus.PLAYING && (
          <motion.div 
            key={gameState.level}
            initial={{ opacity: 0, scale: 2 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [2, 1, 1, 0.8] }}
            transition={{ duration: 2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
          >
            <div className="text-center">
              <p className="text-neon-green font-display text-xl uppercase tracking-[0.5em] mb-2">Level Up</p>
              <h2 className="text-8xl font-display font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                {gameState.level}
              </h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
