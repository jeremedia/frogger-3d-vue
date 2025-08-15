<template>
  <div class="game3d-container">
    <div class="hud">
      <div class="score-display">
        <div class="score-label">SCORE</div>
        <div class="score-value">{{ score }}</div>
      </div>
      <div class="lives-display">
        <div class="lives-label">LIVES</div>
        <div class="lives-hearts">
          <span v-for="i in lives" :key="i" class="heart">❤️</span>
        </div>
      </div>
      <div class="combo-display" v-if="combo > 1">
        <div class="combo-value">{{ combo }}x COMBO!</div>
      </div>
      <div class="powerup-display" v-if="activePowerup">
        <div class="powerup-icon">{{ activePowerup.icon }}</div>
        <div class="powerup-timer">{{ activePowerup.timeLeft }}s</div>
      </div>
    </div>
    
    <div ref="gameContainer" class="threejs-container"></div>
    
    <div v-if="gameState === 'menu'" class="menu-overlay">
      <h1 class="game-title">🐸 FROGGER 3D 🐸</h1>
      <button @click="startGame" class="start-button">START GAME</button>
      <div class="controls-info">
        <p>🎮 Use Arrow Keys or WASD to move</p>
        <p>🎯 Reach the lily pads to score!</p>
        <p>⚡ Collect power-ups for special abilities</p>
      </div>
    </div>
    
    <div v-if="gameState === 'gameover'" class="gameover-overlay">
      <h2 class="gameover-title">GAME OVER</h2>
      <div class="final-score">Final Score: {{ score }}</div>
      <div class="high-score">High Score: {{ highScore }}</div>
      <button @click="resetGame" class="restart-button">PLAY AGAIN</button>
    </div>
    
    <div v-if="gameState === 'paused'" class="pause-overlay">
      <h2>PAUSED</h2>
      <button @click="resumeGame" class="resume-button">RESUME</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { gsap } from 'gsap'
import SceneManager from './game3d/SceneManager'
import FrogController from './game3d/FrogController'
import VehicleSystem from './game3d/VehicleSystem'
import EnvironmentManager from './game3d/EnvironmentManager'
import EffectsManager from './game3d/EffectsManager'
import AudioEngine from './game3d/AudioEngine'
import PowerUpSystem from './game3d/PowerUpSystem'
import GameManager from './game3d/GameManager'

export default {
  name: 'Frogger3D',
  setup() {
    const gameContainer = ref(null)
    const gameState = ref('menu')
    const score = ref(0)
    const lives = ref(3)
    const highScore = ref(localStorage.getItem('frogger3dHighScore') || 0)
    const combo = ref(0)
    const activePowerup = ref(null)
    
    let sceneManager = null
    let frogController = null
    let vehicleSystem = null
    let environmentManager = null
    let effectsManager = null
    let audioEngine = null
    let powerUpSystem = null
    let gameManager = null
    let animationId = null
    
    const initGame = () => {
      if (!gameContainer.value) return
      
      sceneManager = new SceneManager(gameContainer.value)
      frogController = new FrogController(sceneManager.scene, sceneManager.camera)
      vehicleSystem = new VehicleSystem(sceneManager.scene)
      environmentManager = new EnvironmentManager(sceneManager.scene)
      effectsManager = new EffectsManager(sceneManager.scene, sceneManager.renderer, sceneManager.camera)
      audioEngine = new AudioEngine(sceneManager.camera)
      powerUpSystem = new PowerUpSystem(sceneManager.scene)
      
      gameManager = new GameManager({
        sceneManager,
        frogController,
        vehicleSystem,
        environmentManager,
        effectsManager,
        audioEngine,
        powerUpSystem,
        onScoreUpdate: (newScore) => score.value = newScore,
        onLivesUpdate: (newLives) => lives.value = newLives,
        onComboUpdate: (newCombo) => combo.value = newCombo,
        onPowerupUpdate: (powerup) => activePowerup.value = powerup,
        onGameOver: handleGameOver
      })
      
      window.addEventListener('keydown', handleKeyPress)
      window.addEventListener('resize', handleResize)
      
      animate()
    }
    
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      
      if (gameState.value === 'playing' && gameManager) {
        gameManager.update()
        sceneManager.render()
      }
    }
    
    const handleKeyPress = (event) => {
      if (gameState.value !== 'playing') return
      
      switch(event.key.toLowerCase()) {
        case 'escape':
        case 'p':
          togglePause()
          break
        default:
          if (frogController) {
            frogController.handleInput(event.key)
          }
      }
    }
    
    const handleResize = () => {
      if (sceneManager) {
        sceneManager.handleResize()
      }
    }
    
    const startGame = () => {
      gameState.value = 'playing'
      score.value = 0
      lives.value = 3
      combo.value = 0
      activePowerup.value = null
      
      if (gameManager) {
        gameManager.startGame()
      } else {
        initGame()
        if (gameManager) {
          gameManager.startGame()
        }
      }
      
      if (audioEngine) {
        audioEngine.playBackgroundMusic()
      }
    }
    
    const pauseGame = () => {
      gameState.value = 'paused'
      if (gameManager) {
        gameManager.pause()
      }
    }
    
    const resumeGame = () => {
      gameState.value = 'playing'
      if (gameManager) {
        gameManager.resume()
      }
    }
    
    const togglePause = () => {
      if (gameState.value === 'playing') {
        pauseGame()
      } else if (gameState.value === 'paused') {
        resumeGame()
      }
    }
    
    const resetGame = () => {
      gameState.value = 'menu'
      score.value = 0
      lives.value = 3
      combo.value = 0
      activePowerup.value = null
      
      if (gameManager) {
        gameManager.reset()
      }
    }
    
    const handleGameOver = () => {
      gameState.value = 'gameover'
      
      if (score.value > highScore.value) {
        highScore.value = score.value
        localStorage.setItem('frogger3dHighScore', highScore.value)
      }
      
      if (audioEngine) {
        audioEngine.playGameOverSound()
      }
    }
    
    onMounted(() => {
      initGame()
    })
    
    onUnmounted(() => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      
      window.removeEventListener('keydown', handleKeyPress)
      window.removeEventListener('resize', handleResize)
      
      if (gameManager) {
        gameManager.destroy()
      }
    })
    
    return {
      gameContainer,
      gameState,
      score,
      lives,
      highScore,
      combo,
      activePowerup,
      startGame,
      pauseGame,
      resumeGame,
      resetGame
    }
  }
}
</script>

<style scoped>
.game3d-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(to bottom, #87CEEB 0%, #98D8C8 100%);
}

.threejs-container {
  width: 100%;
  height: 100%;
}

.hud {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 100;
  pointer-events: none;
}

.score-display, .lives-display {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 15px 20px;
  border-radius: 10px;
  font-family: 'Courier New', monospace;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.score-label, .lives-label {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 5px;
}

.score-value {
  font-size: 32px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.lives-hearts {
  font-size: 24px;
}

.heart {
  display: inline-block;
  animation: heartbeat 1.5s ease-in-out infinite;
  margin: 0 2px;
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.combo-display {
  position: absolute;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
  padding: 10px 30px;
  border-radius: 30px;
  font-size: 24px;
  font-weight: bold;
  animation: comboPopup 0.5s ease-out;
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
}

@keyframes comboPopup {
  0% { transform: translateX(-50%) scale(0) rotate(-180deg); }
  50% { transform: translateX(-50%) scale(1.2) rotate(10deg); }
  100% { transform: translateX(-50%) scale(1) rotate(0); }
}

.powerup-display {
  position: absolute;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #8B00FF, #FF00FF);
  color: white;
  padding: 15px 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: powerupGlow 1s ease-in-out infinite;
}

@keyframes powerupGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(139, 0, 255, 0.5); }
  50% { box-shadow: 0 0 40px rgba(255, 0, 255, 0.8); }
}

.powerup-icon {
  font-size: 30px;
}

.powerup-timer {
  font-size: 20px;
  font-weight: bold;
}

.menu-overlay, .gameover-overlay, .pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 200;
}

.game-title {
  font-size: 72px;
  font-weight: bold;
  color: #00FF00;
  text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5),
               0 0 30px rgba(0, 255, 0, 0.5);
  margin-bottom: 40px;
  animation: titlePulse 2s ease-in-out infinite;
}

@keyframes titlePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.gameover-title {
  font-size: 64px;
  color: #FF0000;
  text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  margin-bottom: 30px;
}

.final-score, .high-score {
  font-size: 32px;
  color: white;
  margin: 10px 0;
}

.start-button, .restart-button, .resume-button {
  font-size: 24px;
  padding: 20px 60px;
  background: linear-gradient(135deg, #00C851, #00FF00);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  text-transform: uppercase;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(0, 255, 0, 0.3);
}

.start-button:hover, .restart-button:hover, .resume-button:hover {
  transform: translateY(-5px) scale(1.1);
  box-shadow: 0 12px 30px rgba(0, 255, 0, 0.5);
}

.controls-info {
  margin-top: 40px;
  color: white;
  text-align: center;
  font-size: 18px;
  line-height: 1.8;
}

.controls-info p {
  margin: 10px 0;
}
</style>