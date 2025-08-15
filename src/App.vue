<template>
  <div id="game-container">
    <div v-if="!gameStarted" class="version-selector">
      <h1 class="main-title">🐸 FROGGER 🐸</h1>
      <h2>Choose Your Experience</h2>
      <div class="version-buttons">
        <button @click="startGame('2d')" class="version-btn classic">
          <span class="version-icon">🕹️</span>
          <span class="version-name">Classic 2D</span>
          <span class="version-desc">Original arcade experience</span>
        </button>
        <button @click="startGame('3d')" class="version-btn modern">
          <span class="version-icon">🎮</span>
          <span class="version-name">3D EXTREME</span>
          <span class="version-desc">Next-gen graphics & effects</span>
        </button>
      </div>
    </div>
    <FroggerGame v-else-if="gameVersion === '2d'" />
    <Frogger3D v-else-if="gameVersion === '3d'" />
  </div>
</template>

<script>
import { ref } from 'vue'
import FroggerGame from './components/FroggerGame.vue'
import Frogger3D from './components/Frogger3D.vue'

export default {
  name: 'App',
  components: {
    FroggerGame,
    Frogger3D
  },
  setup() {
    const gameStarted = ref(false)
    const gameVersion = ref('')
    
    const startGame = (version) => {
      gameVersion.value = version
      gameStarted.value = true
    }
    
    return {
      gameStarted,
      gameVersion,
      startGame
    }
  }
}
</script>

<style>
#game-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.version-selector {
  text-align: center;
  color: white;
  padding: 40px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.main-title {
  font-size: 72px;
  margin-bottom: 20px;
  text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5),
               0 0 30px rgba(0, 255, 0, 0.5);
  animation: titleBounce 2s ease-in-out infinite;
}

@keyframes titleBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.version-selector h2 {
  font-size: 32px;
  margin-bottom: 40px;
  opacity: 0.9;
}

.version-buttons {
  display: flex;
  gap: 30px;
  justify-content: center;
  flex-wrap: wrap;
}

.version-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 250px;
}

.version-btn.modern {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.version-btn:hover {
  transform: translateY(-10px) scale(1.05);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
}

.version-icon {
  font-size: 64px;
  margin-bottom: 15px;
}

.version-name {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 10px;
}

.version-desc {
  font-size: 16px;
  opacity: 0.8;
}
</style>