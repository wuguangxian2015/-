import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  GameStatus, 
  EnemyType, 
  PowerUpType, 
  Bullet, 
  Enemy, 
  PowerUp, 
  Particle, 
  GameState,
  ShipType
} from '../types';
import { GAME_CONFIG } from '../constants';

interface GameEngineProps {
  gameState: GameState;
  onStateChange: (updates: Partial<GameState>) => void;
  onAchievementUnlock: (id: string) => void;
  onGameOver: () => void;
}

const GameEngine: React.FC<GameEngineProps> = ({ 
  gameState, 
  onStateChange, 
  onAchievementUnlock,
  onGameOver 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  
  // Game entities
  const playerRef = useRef({
    x: 0,
    y: 0,
    width: GAME_CONFIG.PLAYER_WIDTH,
    height: GAME_CONFIG.PLAYER_HEIGHT,
    isInvincible: false,
    invincibleTimer: 0,
    hasTripleShot: false,
    tripleShotTimer: 0,
    hasShield: false,
    speed: GAME_CONFIG.PLAYER_SPEED,
  });

  // Update player stats based on selected ship
  useEffect(() => {
    if (gameState.selectedShip === ShipType.SPEED) {
      playerRef.current.speed = GAME_CONFIG.PLAYER_SPEED * 1.5;
    } else if (gameState.selectedShip === ShipType.TANK) {
      playerRef.current.speed = GAME_CONFIG.PLAYER_SPEED * 0.7;
    } else {
      playerRef.current.speed = GAME_CONFIG.PLAYER_SPEED;
    }
  }, [gameState.selectedShip]);

  // Image assets
  const assetsRef = useRef<{
    player: HTMLImageElement | null;
    enemyBasic: HTMLImageElement | null;
    enemyFast: HTMLImageElement | null;
    enemyHeavy: HTMLImageElement | null;
  }>({
    player: null,
    enemyBasic: null,
    enemyFast: null,
    enemyHeavy: null,
  });

  // Load assets
  useEffect(() => {
    const loadImage = (src: string) => {
      const img = new Image();
      img.src = src;
      return img;
    };

    // 你可以将这些路径替换为你本地的图片路径，例如 "/assets/player.png"
    assetsRef.current.player = loadImage('/player.png');
    assetsRef.current.enemyBasic = loadImage('/enemy_basic.png');
    assetsRef.current.enemyFast = loadImage('/enemy_fast.png');
    assetsRef.current.enemyHeavy = loadImage('/enemy_heavy.png');
  }, []);

  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<{x: number, y: number, size: number, speed: number}[]>([]);
  
  const keysRef = useRef<Record<string, boolean>>({});
  const lastShotTimeRef = useRef(0);
  const lastEnemySpawnRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const killCountRef = useRef(0);

  // Initialize stars
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2,
        speed: Math.random() * 2 + 0.5,
      });
    }
    starsRef.current = stars;
  }, []);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        
        // Center player
        if (playerRef.current.x === 0) {
          playerRef.current.x = window.innerWidth / 2 - playerRef.current.width / 2;
          playerRef.current.y = window.innerHeight - 100;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'KeyP') {
        onStateChange({ status: gameState.status === GameStatus.PLAYING ? GameStatus.PAUSED : GameStatus.PLAYING });
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.status, onStateChange]);

  // Touch handling
  const handleTouch = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (gameState.status !== GameStatus.PLAYING) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    playerRef.current.x = clientX - playerRef.current.width / 2;
    playerRef.current.y = clientY - playerRef.current.height / 2;
  }, [gameState.status]);

  const createExplosion = (x: number, y: number, color: string, count = 15) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: Math.random() * 4 + 1,
        life: 1,
        maxLife: Math.random() * 0.5 + 0.5,
        color,
      });
    }
  };

  const spawnEnemy = (timestamp: number) => {
    // Difficulty scaling: spawn rate decreases (faster spawning) as level increases
    const spawnRate = Math.max(300, GAME_CONFIG.ENEMY_SPAWN_RATE - (gameState.level * 120));
    
    if (timestamp - lastEnemySpawnRef.current > spawnRate) {
      const typeRoll = Math.random();
      let type = EnemyType.BASIC;
      let hp = 1 + Math.floor(gameState.level / 4); // HP increases every few levels
      let speed = 2 + (gameState.level * 0.6);
      let color = '#39ff14';
      let scoreValue = 100 * gameState.level;
      let width = 40;
      let height = 40;

      // Higher levels increase chance of harder enemies
      const heavyChance = 0.15 + (gameState.level * 0.02);
      const fastChance = 0.2 + (gameState.level * 0.02);

      if (typeRoll > 1 - heavyChance) {
        type = EnemyType.HEAVY;
        hp = 3 + Math.floor(gameState.level / 2);
        speed = 1 + (gameState.level * 0.4);
        color = '#bc13fe';
        scoreValue = 300 * gameState.level;
        width = 60;
        height = 50;
      } else if (typeRoll > 1 - heavyChance - fastChance) {
        type = EnemyType.FAST;
        hp = 1 + Math.floor(gameState.level / 5);
        speed = 5 + (gameState.level * 0.7);
        color = '#00f2ff';
        scoreValue = 200 * gameState.level;
        width = 30;
        height = 30;
      }

      enemiesRef.current.push({
        id: Math.random().toString(36).substr(2, 9),
        x: Math.random() * (window.innerWidth - width),
        y: -height,
        width,
        height,
        type,
        hp,
        maxHp: hp,
        speed,
        color,
        scoreValue,
      });
      lastEnemySpawnRef.current = timestamp;
    }
  };

  const update = (timestamp: number) => {
    if (gameState.status !== GameStatus.PLAYING) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Player Movement
    if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) playerRef.current.x -= playerRef.current.speed;
    if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) playerRef.current.x += playerRef.current.speed;
    if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) playerRef.current.y -= playerRef.current.speed;
    if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) playerRef.current.y += playerRef.current.speed;

    // Boundaries
    playerRef.current.x = Math.max(0, Math.min(canvas.width - playerRef.current.width, playerRef.current.x));
    playerRef.current.y = Math.max(0, Math.min(canvas.height - playerRef.current.height, playerRef.current.y));

    // Shooting
    if (keysRef.current['Space'] && timestamp - lastShotTimeRef.current > GAME_CONFIG.BULLET_COOLDOWN) {
      const shoot = (angle: number) => {
        bulletsRef.current.push({
          id: Math.random().toString(36).substr(2, 9),
          x: playerRef.current.x + playerRef.current.width / 2 - 2,
          y: playerRef.current.y,
          width: 4,
          height: 15,
          speed: GAME_CONFIG.BULLET_SPEED,
          angle,
          color: '#00f2ff',
        });
      };

      shoot(0);
      if (playerRef.current.hasTripleShot) {
        shoot(-0.2);
        shoot(0.2);
      }
      lastShotTimeRef.current = timestamp;
    }

    // Update Timers
    if (playerRef.current.isInvincible) {
      playerRef.current.invincibleTimer -= 16;
      if (playerRef.current.invincibleTimer <= 0) playerRef.current.isInvincible = false;
    }
    if (playerRef.current.hasTripleShot) {
      playerRef.current.tripleShotTimer -= 16;
      if (playerRef.current.tripleShotTimer <= 0) playerRef.current.hasTripleShot = false;
    }

    // Achievement: Survivor
    if (Date.now() - startTimeRef.current > 60000) {
      onAchievementUnlock('survivor');
    }

    // Spawn Enemies
    spawnEnemy(timestamp);

    // Update Stars
    starsRef.current.forEach(star => {
      star.y += star.speed;
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    });

    // Update Bullets
    bulletsRef.current = bulletsRef.current.filter(b => {
      b.x += Math.sin(b.angle) * b.speed;
      b.y -= Math.cos(b.angle) * b.speed;
      return b.y > -20 && b.x > -20 && b.x < canvas.width + 20;
    });

    // Update Enemies
    enemiesRef.current = enemiesRef.current.filter(e => {
      e.y += e.speed;
      
      // Collision with Player
      if (!playerRef.current.isInvincible && 
          e.x < playerRef.current.x + playerRef.current.width &&
          e.x + e.width > playerRef.current.x &&
          e.y < playerRef.current.y + playerRef.current.height &&
          e.y + e.height > playerRef.current.y) {
        
        if (playerRef.current.hasShield) {
          playerRef.current.hasShield = false;
          createExplosion(playerRef.current.x + playerRef.current.width/2, playerRef.current.y + playerRef.current.height/2, '#bc13fe', 20);
        } else {
          onStateChange({ lives: gameState.lives - 1 });
          if (gameState.lives <= 1) {
            onGameOver();
          } else {
            playerRef.current.isInvincible = true;
            playerRef.current.invincibleTimer = GAME_CONFIG.INVINCIBILITY_DURATION;
          }
        }
        createExplosion(e.x + e.width/2, e.y + e.height/2, e.color);
        return false;
      }

      // Escape Penalty
      if (e.y > canvas.height) {
        onStateChange({ score: Math.max(0, gameState.score - 50) });
        return false;
      }
      return true;
    });

    // Update PowerUps
    powerUpsRef.current = powerUpsRef.current.filter(p => {
      p.y += p.speed;
      if (p.x < playerRef.current.x + playerRef.current.width &&
          p.x + p.width > playerRef.current.x &&
          p.y < playerRef.current.y + playerRef.current.height &&
          p.y + p.height > playerRef.current.y) {
        
        if (p.type === PowerUpType.TRIPLE_SHOT) {
          playerRef.current.hasTripleShot = true;
          playerRef.current.tripleShotTimer = 10000;
        } else {
          playerRef.current.hasShield = true;
        }
        
        if (playerRef.current.hasShield && playerRef.current.hasTripleShot) {
          onAchievementUnlock('power_up_master');
        }
        
        return false;
      }
      return p.y < canvas.height;
    });

    // Collision: Bullets & Enemies
    bulletsRef.current = bulletsRef.current.filter(b => {
      let bulletHit = false;
      enemiesRef.current = enemiesRef.current.filter(e => {
        if (!bulletHit &&
            b.x < e.x + e.width &&
            b.x + b.width > e.x &&
            b.y < e.y + e.height &&
            b.y + b.height > e.y) {
          
          e.hp -= 1;
          bulletHit = true;
          
          if (e.hp <= 0) {
            onStateChange({ score: gameState.score + e.scoreValue });
            killCountRef.current += 1;
            onAchievementUnlock('first_blood');
            if (killCountRef.current >= 50) onAchievementUnlock('ace_pilot');
            
            createExplosion(e.x + e.width/2, e.y + e.height/2, e.color);
            
            // Spawn PowerUp
            if (Math.random() < GAME_CONFIG.POWERUP_SPAWN_CHANCE) {
              powerUpsRef.current.push({
                id: Math.random().toString(36).substr(2, 9),
                x: e.x,
                y: e.y,
                width: 30,
                height: 30,
                type: Math.random() > 0.5 ? PowerUpType.TRIPLE_SHOT : PowerUpType.SHIELD,
                speed: 2,
                color: '#ff3131',
              });
            }
            return false;
          }
          return true;
        }
        return true;
      });
      return !bulletHit;
    });

    // Level Up
    const nextLevelScore = gameState.level * GAME_CONFIG.LEVEL_UP_SCORE;
    if (gameState.score >= nextLevelScore && gameState.level < 10) {
      onStateChange({ level: gameState.level + 1 });
      enemiesRef.current = []; // Clear current enemies
      if (gameState.level + 1 >= 5) onAchievementUnlock('level_5');
      if (gameState.level + 1 === 10) onAchievementUnlock('level_10');
    } else if (gameState.score >= 10 * GAME_CONFIG.LEVEL_UP_SCORE && gameState.level === 10) {
      onStateChange({ status: GameStatus.WIN });
    }

    // Update Particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      return p.life > 0;
    });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Stars
    ctx.fillStyle = 'white';
    starsRef.current.forEach(star => {
      ctx.globalAlpha = star.speed / 3;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw PowerUps
    powerUpsRef.current.forEach(p => {
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.type === PowerUpType.TRIPLE_SHOT ? '#ff3131' : '#bc13fe';
      ctx.fillStyle = ctx.shadowColor;
      ctx.beginPath();
      ctx.moveTo(p.x + p.width / 2, p.y);
      ctx.lineTo(p.x + p.width, p.y + p.height / 2);
      ctx.lineTo(p.x + p.width / 2, p.y + p.height);
      ctx.lineTo(p.x, p.y + p.height / 2);
      ctx.closePath();
      ctx.fill();
      
      // Icon
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(p.type === PowerUpType.TRIPLE_SHOT ? '3x' : 'S', p.x + p.width / 2, p.y + p.height / 2 + 4);
    });

    // Draw Bullets
    bulletsRef.current.forEach(b => {
      ctx.shadowBlur = 10;
      ctx.shadowColor = b.color;
      ctx.fillStyle = b.color;
      ctx.save();
      ctx.translate(b.x + b.width / 2, b.y + b.height / 2);
      ctx.rotate(b.angle);
      ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
      ctx.restore();
    });

    // Draw Enemies
    enemiesRef.current.forEach(e => {
      const enemyImg = e.type === EnemyType.BASIC ? assetsRef.current.enemyBasic :
                       e.type === EnemyType.FAST ? assetsRef.current.enemyFast :
                       assetsRef.current.enemyHeavy;

      if (enemyImg && enemyImg.complete && enemyImg.naturalWidth !== 0) {
        ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);
      } else {
        // Fallback to shapes if image not loaded - Advanced Enemy Fighter Shape
        ctx.shadowBlur = 15;
        ctx.shadowColor = e.color;
        ctx.fillStyle = e.color;
        
        const x = e.x;
        const y = e.y;
        const w = e.width;
        const h = e.height;

        ctx.beginPath();
        // Nose (Bottom)
        ctx.moveTo(x + w / 2, y + h);
        // Right side of nose
        ctx.lineTo(x + w * 0.7, y + h * 0.8);
        // Right wing tip
        ctx.lineTo(x + w, y + h * 0.4);
        // Right wing back
        ctx.lineTo(x + w * 0.65, y + h * 0.4);
        // Right tail fin
        ctx.lineTo(x + w * 0.8, y + h * 0.1);
        // Tail back
        ctx.lineTo(x + w * 0.6, y);
        // Center notch
        ctx.lineTo(x + w / 2, y + h * 0.1);
        // Tail back left
        ctx.lineTo(x + w * 0.4, y);
        // Left tail fin
        ctx.lineTo(x + w * 0.2, y + h * 0.1);
        // Left wing back
        ctx.lineTo(x + w * 0.35, y + h * 0.4);
        // Left wing tip
        ctx.lineTo(x, y + h * 0.4);
        // Left side of nose
        ctx.lineTo(x + w * 0.3, y + h * 0.8);
        
        ctx.closePath();
        ctx.fill();

        // Enemy Cockpit (Red/Dark)
        ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h * 0.65, w * 0.12, h * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Enemy Thrusters
        ctx.fillStyle = e.color;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x + w * 0.35, y, w * 0.1, h * 0.05);
        ctx.fillRect(x + w * 0.55, y, w * 0.1, h * 0.05);
        ctx.globalAlpha = 1.0;
      }

      // HP Bar
      if (e.maxHp > 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(e.x, e.y - 10, e.width, 4);
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x, e.y - 10, (e.hp / e.maxHp) * e.width, 4);
      }
    });

    // Draw Player
    if (!playerRef.current.isInvincible || Math.floor(Date.now() / 100) % 2 === 0) {
      const playerImg = assetsRef.current.player;
      
      if (playerImg && playerImg.complete && playerImg.naturalWidth !== 0) {
        ctx.drawImage(playerImg, playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);
      } else {
        // Fallback to shapes - Advanced Fighter Jet Shape (Player)
        const shipColor = gameState.selectedShip === ShipType.SPEED ? '#39ff14' : 
                          gameState.selectedShip === ShipType.TANK ? '#bc13fe' : '#00f2ff';
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = shipColor;
        ctx.fillStyle = shipColor;
        
        const x = playerRef.current.x;
        const y = playerRef.current.y;
        const w = playerRef.current.width;
        const h = playerRef.current.height;

        ctx.beginPath();
        // Nose tip
        ctx.moveTo(x + w / 2, y);
        // Right side of nose
        ctx.lineTo(x + w * 0.6, y + h * 0.2);
        // Right wing intake
        ctx.lineTo(x + w * 0.8, y + h * 0.4);
        // Right wing tip
        ctx.lineTo(x + w, y + h * 0.75);
        // Right wing back
        ctx.lineTo(x + w * 0.7, y + h * 0.75);
        // Right tail fin
        ctx.lineTo(x + w * 0.85, y + h);
        // Engine exhaust right
        ctx.lineTo(x + w * 0.6, y + h * 0.9);
        // Center engine notch
        ctx.lineTo(x + w / 2, y + h * 0.95);
        // Engine exhaust left
        ctx.lineTo(x + w * 0.4, y + h * 0.9);
        // Left tail fin
        ctx.lineTo(x + w * 0.15, y + h);
        // Left wing back
        ctx.lineTo(x + w * 0.3, y + h * 0.75);
        // Left wing tip
        ctx.lineTo(x, y + h * 0.75);
        // Left wing intake
        ctx.lineTo(x + w * 0.2, y + h * 0.4);
        // Left side of nose
        ctx.lineTo(x + w * 0.4, y + h * 0.2);
        
        ctx.closePath();
        ctx.fill();

        // Cockpit Glass
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h * 0.2);
        ctx.quadraticCurveTo(x + w * 0.65, y + h * 0.4, x + w / 2, y + h * 0.55);
        ctx.quadraticCurveTo(x + w * 0.35, y + h * 0.4, x + w / 2, y + h * 0.2);
        ctx.fill();

        // Engine Glow
        ctx.fillStyle = '#ff3131';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff3131';
        ctx.fillRect(x + w * 0.42, y + h * 0.9, w * 0.05, h * 0.05);
        ctx.fillRect(x + w * 0.53, y + h * 0.9, w * 0.05, h * 0.05);
      }

      // Shield
      if (playerRef.current.hasShield) {
        ctx.strokeStyle = '#bc13fe';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#bc13fe';
        ctx.beginPath();
        ctx.arc(playerRef.current.x + playerRef.current.width / 2, playerRef.current.y + playerRef.current.height / 2, playerRef.current.width * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.shadowBlur = 0;
  };

  const loop = (timestamp: number) => {
    update(timestamp);
    draw();
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState.status]);

  return (
    <canvas 
      ref={canvasRef} 
      className="block w-full h-full cursor-none"
      onMouseMove={handleTouch}
      onTouchMove={handleTouch}
    />
  );
};

export default GameEngine;
