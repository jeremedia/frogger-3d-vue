<template>
  <div class="game-wrapper">
    <div class="game-header">
      <div class="score">Score: {{ score }}</div>
      <div class="lives">Lives: {{ lives }}</div>
      <div class="high-score">High Score: {{ highScore }}</div>
    </div>
    
    <div class="game-board" ref="gameBoard" tabindex="0" @keydown="handleKeyPress">
      <div 
        class="frog" 
        :style="{ 
          left: frog.x + 'px', 
          top: frog.y + 'px',
          transform: `rotate(${frogRotation}deg)`
        }"
      >
        🐸
      </div>
      
      <div 
        v-for="car in cars" 
        :key="car.id"
        class="car"
        :style="{ 
          left: car.x + 'px', 
          top: car.y + 'px',
          width: car.width + 'px'
        }"
      >
        {{ car.emoji }}
      </div>
      
      <div 
        v-for="log in logs" 
        :key="log.id"
        class="log"
        :style="{ 
          left: log.x + 'px', 
          top: log.y + 'px',
          width: log.width + 'px'
        }"
      >
        🪵
      </div>
      
      <div class="water-zone"></div>
      <div class="safe-zone safe-zone-top"></div>
      <div class="safe-zone safe-zone-middle"></div>
      <div class="safe-zone safe-zone-bottom"></div>
      
      <div 
        v-for="(slot, index) in winSlots" 
        :key="index"
        class="win-slot"
        :style="{ left: slot.x + 'px' }"
      >
        <span v-if="slot.occupied">🐸</span>
      </div>
    </div>
    
    <div class="game-controls">
      <button @click="startGame" v-if="!gameRunning">Start Game</button>
      <button @click="pauseGame" v-else>{{ gamePaused ? 'Resume' : 'Pause' }}</button>
      <button @click="resetGame">Reset</button>
    </div>
    
    <div v-if="gameOver" class="game-over">
      <h2>Game Over!</h2>
      <p>Final Score: {{ score }}</p>
      <button @click="resetGame">Play Again</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'

export default {
  name: 'FroggerGame',
  setup() {
    const BOARD_WIDTH = 600
    const BOARD_HEIGHT = 600
    const CELL_SIZE = 40
    const FROG_SIZE = 30
    
    const gameBoard = ref(null)
    const gameRunning = ref(false)
    const gamePaused = ref(false)
    const gameOver = ref(false)
    const score = ref(0)
    const lives = ref(3)
    const highScore = ref(localStorage.getItem('froggerHighScore') || 0)
    
    const frog = ref({
      x: BOARD_WIDTH / 2 - FROG_SIZE / 2,
      y: BOARD_HEIGHT - CELL_SIZE - 5,
      onLog: null
    })
    
    const frogRotation = ref(0)
    
    const cars = ref([])
    const logs = ref([])
    const winSlots = ref([
      { x: 50, occupied: false },
      { x: 170, occupied: false },
      { x: 290, occupied: false },
      { x: 410, occupied: false },
      { x: 530, occupied: false }
    ])
    
    let gameLoop = null
    let carSpawnTimer = null
    let logSpawnTimer = null
    
    const initializeCars = () => {
      cars.value = [
        { id: 1, x: 100, y: 480, width: 60, speed: 2, direction: 1, emoji: '🚗' },
        { id: 2, x: 300, y: 480, width: 60, speed: 2, direction: 1, emoji: '🚙' },
        { id: 3, x: 500, y: 440, width: 80, speed: -3, direction: -1, emoji: '🚌' },
        { id: 4, x: 200, y: 440, width: 80, speed: -3, direction: -1, emoji: '🚌' },
        { id: 5, x: 150, y: 400, width: 60, speed: 2.5, direction: 1, emoji: '🚕' },
        { id: 6, x: 400, y: 400, width: 60, speed: 2.5, direction: 1, emoji: '🚕' },
        { id: 7, x: 50, y: 360, width: 100, speed: -4, direction: -1, emoji: '🚚' },
        { id: 8, x: 350, y: 360, width: 100, speed: -4, direction: -1, emoji: '🚚' }
      ]
    }
    
    const initializeLogs = () => {
      logs.value = [
        { id: 1, x: 0, y: 200, width: 120, speed: 1.5, direction: 1 },
        { id: 2, x: 200, y: 200, width: 120, speed: 1.5, direction: 1 },
        { id: 3, x: 400, y: 200, width: 120, speed: 1.5, direction: 1 },
        { id: 4, x: 100, y: 160, width: 100, speed: -2, direction: -1 },
        { id: 5, x: 300, y: 160, width: 100, speed: -2, direction: -1 },
        { id: 6, x: 500, y: 160, width: 100, speed: -2, direction: -1 },
        { id: 7, x: 50, y: 120, width: 140, speed: 2.5, direction: 1 },
        { id: 8, x: 250, y: 120, width: 140, speed: 2.5, direction: 1 },
        { id: 9, x: 450, y: 120, width: 140, speed: 2.5, direction: 1 },
        { id: 10, x: 150, y: 80, width: 110, speed: -3, direction: -1 },
        { id: 11, x: 350, y: 80, width: 110, speed: -3, direction: -1 }
      ]
    }
    
    const handleKeyPress = (e) => {
      if (!gameRunning.value || gamePaused.value || gameOver.value) return
      
      const step = CELL_SIZE
      const newPos = { ...frog.value }
      
      switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          newPos.y -= step
          frogRotation.value = 0
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          newPos.y += step
          frogRotation.value = 180
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newPos.x -= step
          frogRotation.value = -90
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          newPos.x += step
          frogRotation.value = 90
          break
        default:
          return
      }
      
      e.preventDefault()
      
      if (newPos.x >= 0 && newPos.x <= BOARD_WIDTH - FROG_SIZE &&
          newPos.y >= 0 && newPos.y <= BOARD_HEIGHT - FROG_SIZE) {
        frog.value.x = newPos.x
        frog.value.y = newPos.y
        
        if (newPos.y < 240 && frog.value.y >= 240) {
          score.value += 10
        }
      }
    }
    
    const updateCars = () => {
      cars.value.forEach(car => {
        car.x += car.speed
        
        if (car.direction === 1 && car.x > BOARD_WIDTH) {
          car.x = -car.width
        } else if (car.direction === -1 && car.x < -car.width) {
          car.x = BOARD_WIDTH
        }
      })
    }
    
    const updateLogs = () => {
      logs.value.forEach(log => {
        log.x += log.speed
        
        if (log.direction === 1 && log.x > BOARD_WIDTH) {
          log.x = -log.width
        } else if (log.direction === -1 && log.x < -log.width) {
          log.x = BOARD_WIDTH
        }
      })
    }
    
    const checkCollisions = () => {
      const frogBounds = {
        left: frog.value.x,
        right: frog.value.x + FROG_SIZE,
        top: frog.value.y,
        bottom: frog.value.y + FROG_SIZE
      }
      
      for (const car of cars.value) {
        const carBounds = {
          left: car.x,
          right: car.x + car.width,
          top: car.y,
          bottom: car.y + CELL_SIZE
        }
        
        if (!(frogBounds.left > carBounds.right || 
              frogBounds.right < carBounds.left || 
              frogBounds.top > carBounds.bottom || 
              frogBounds.bottom < carBounds.top)) {
          loseLife()
          return
        }
      }
      
      if (frog.value.y >= 80 && frog.value.y <= 200) {
        let onLog = false
        let currentLog = null
        
        for (const log of logs.value) {
          const logBounds = {
            left: log.x,
            right: log.x + log.width,
            top: log.y,
            bottom: log.y + CELL_SIZE
          }
          
          if (!(frogBounds.left > logBounds.right || 
                frogBounds.right < logBounds.left || 
                frogBounds.top > logBounds.bottom || 
                frogBounds.bottom < logBounds.top)) {
            onLog = true
            currentLog = log
            break
          }
        }
        
        if (onLog && currentLog) {
          frog.value.x += currentLog.speed
          frog.value.onLog = currentLog.id
          
          if (frog.value.x < 0 || frog.value.x > BOARD_WIDTH - FROG_SIZE) {
            loseLife()
          }
        } else {
          loseLife()
        }
      } else {
        frog.value.onLog = null
      }
      
      if (frog.value.y <= 40) {
        checkWinSlot()
      }
    }
    
    const checkWinSlot = () => {
      for (const slot of winSlots.value) {
        const slotCenter = slot.x + 20
        const frogCenter = frog.value.x + FROG_SIZE / 2
        
        if (Math.abs(slotCenter - frogCenter) < 30 && !slot.occupied) {
          slot.occupied = true
          score.value += 100
          resetFrogPosition()
          
          if (winSlots.value.every(s => s.occupied)) {
            score.value += 500
            winSlots.value.forEach(s => s.occupied = false)
          }
          return
        }
      }
      
      loseLife()
    }
    
    const loseLife = () => {
      lives.value--
      resetFrogPosition()
      
      if (lives.value <= 0) {
        endGame()
      }
    }
    
    const resetFrogPosition = () => {
      frog.value.x = BOARD_WIDTH / 2 - FROG_SIZE / 2
      frog.value.y = BOARD_HEIGHT - CELL_SIZE - 5
      frog.value.onLog = null
      frogRotation.value = 0
    }
    
    const startGame = () => {
      if (gameRunning.value) return
      
      gameRunning.value = true
      gameOver.value = false
      gamePaused.value = false
      score.value = 0
      lives.value = 3
      
      initializeCars()
      initializeLogs()
      resetFrogPosition()
      winSlots.value.forEach(s => s.occupied = false)
      
      gameLoop = setInterval(() => {
        if (!gamePaused.value) {
          updateCars()
          updateLogs()
          checkCollisions()
        }
      }, 1000 / 60)
      
      if (gameBoard.value) {
        gameBoard.value.focus()
      }
    }
    
    const pauseGame = () => {
      gamePaused.value = !gamePaused.value
    }
    
    const endGame = () => {
      gameOver.value = true
      gameRunning.value = false
      
      if (score.value > highScore.value) {
        highScore.value = score.value
        localStorage.setItem('froggerHighScore', highScore.value)
      }
      
      if (gameLoop) {
        clearInterval(gameLoop)
        gameLoop = null
      }
    }
    
    const resetGame = () => {
      endGame()
      score.value = 0
      lives.value = 3
      resetFrogPosition()
      cars.value = []
      logs.value = []
      winSlots.value.forEach(s => s.occupied = false)
      gameOver.value = false
    }
    
    onMounted(() => {
      if (gameBoard.value) {
        gameBoard.value.focus()
      }
    })
    
    onUnmounted(() => {
      if (gameLoop) {
        clearInterval(gameLoop)
      }
      if (carSpawnTimer) {
        clearInterval(carSpawnTimer)
      }
      if (logSpawnTimer) {
        clearInterval(logSpawnTimer)
      }
    })
    
    return {
      gameBoard,
      gameRunning,
      gamePaused,
      gameOver,
      score,
      lives,
      highScore,
      frog,
      frogRotation,
      cars,
      logs,
      winSlots,
      handleKeyPress,
      startGame,
      pauseGame,
      resetGame
    }
  }
}
</script>

<style scoped>
.game-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.game-header {
  display: flex;
  justify-content: space-between;
  width: 600px;
  margin-bottom: 10px;
  padding: 10px;
  background: #2c3e50;
  color: white;
  border-radius: 10px;
  font-size: 18px;
  font-weight: bold;
}

.game-board {
  position: relative;
  width: 600px;
  height: 600px;
  background: #7CBA01;
  border: 3px solid #2c3e50;
  border-radius: 10px;
  overflow: hidden;
  outline: none;
}

.water-zone {
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(180deg, #1e90ff 0%, #4169e1 100%);
  opacity: 0.8;
}

.safe-zone {
  position: absolute;
  left: 0;
  right: 0;
  height: 40px;
  background: #8B7355;
}

.safe-zone-top {
  top: 0;
  background: #228B22;
}

.safe-zone-middle {
  top: 240px;
  background: #8B7355;
}

.safe-zone-bottom {
  top: 320px;
  background: #696969;
}

.frog {
  position: absolute;
  width: 30px;
  height: 30px;
  font-size: 28px;
  line-height: 30px;
  text-align: center;
  z-index: 10;
  transition: none;
  cursor: pointer;
}

.car {
  position: absolute;
  height: 40px;
  font-size: 35px;
  line-height: 40px;
  text-align: center;
  z-index: 5;
}

.log {
  position: absolute;
  height: 40px;
  background: #8B4513;
  border-radius: 20px;
  font-size: 35px;
  line-height: 40px;
  text-align: center;
  border: 2px solid #654321;
  z-index: 3;
}

.win-slot {
  position: absolute;
  top: 5px;
  width: 40px;
  height: 30px;
  background: #FFD700;
  border: 2px solid #FFA500;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  z-index: 2;
}

.game-controls {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.game-controls button {
  padding: 10px 20px;
  font-size: 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.game-controls button:hover {
  background: #2980b9;
}

.game-over {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  text-align: center;
  z-index: 100;
}

.game-over h2 {
  color: #e74c3c;
  margin-bottom: 15px;
}

.game-over p {
  font-size: 20px;
  margin-bottom: 20px;
}

.game-over button {
  padding: 10px 30px;
  font-size: 16px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.game-over button:hover {
  background: #229954;
}
</style>