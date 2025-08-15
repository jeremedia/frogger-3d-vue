<template>
  <div id="game-container">
    <FroggerGame />
  </div>
</template>

<script>
import FroggerGame from './components/FroggerGame.vue'

export default {
  name: 'App',
  components: {
    FroggerGame
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
</style>