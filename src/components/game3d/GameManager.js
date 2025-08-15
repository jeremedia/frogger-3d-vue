import * as THREE from 'three'

export default class GameManager {
  constructor(config) {
    this.sceneManager = config.sceneManager
    this.frogController = config.frogController
    this.vehicleSystem = config.vehicleSystem
    this.environmentManager = config.environmentManager
    this.effectsManager = config.effectsManager
    this.audioEngine = config.audioEngine
    this.powerUpSystem = config.powerUpSystem
    
    this.onScoreUpdate = config.onScoreUpdate
    this.onLivesUpdate = config.onLivesUpdate
    this.onComboUpdate = config.onComboUpdate
    this.onPowerupUpdate = config.onPowerupUpdate
    this.onGameOver = config.onGameOver
    
    this.score = 0
    this.lives = 3
    this.combo = 0
    this.comboTimer = 0
    this.level = 1
    this.isPlaying = false
    this.isPaused = false
    this.lastTime = 0
    this.activePowerUp = null
    this.powerUpTimer = 0
    
    this.lastSafePosition = { x: 0, y: 0, z: 8 }
    this.invulnerableTimer = 0
  }

  startGame() {
    this.isPlaying = true
    this.isPaused = false
    this.score = 0
    this.lives = 3
    this.combo = 0
    this.level = 1
    
    this.frogController.reset()
    this.vehicleSystem.reset()
    this.environmentManager.reset()
    this.powerUpSystem.reset()
    
    this.lastTime = performance.now()
    
    if (this.onScoreUpdate) this.onScoreUpdate(this.score)
    if (this.onLivesUpdate) this.onLivesUpdate(this.lives)
    if (this.onComboUpdate) this.onComboUpdate(this.combo)
  }

  pause() {
    this.isPaused = true
  }

  resume() {
    this.isPaused = false
    this.lastTime = performance.now()
  }

  update() {
    if (!this.isPlaying || this.isPaused) return
    
    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime
    
    // Update all systems
    this.frogController.update(deltaTime)
    this.vehicleSystem.update(deltaTime)
    this.environmentManager.update(deltaTime)
    this.effectsManager.update(deltaTime)
    this.powerUpSystem.update(deltaTime)
    
    // Update camera to follow frog
    this.sceneManager.updateCameraPosition(this.frogController.getPosition())
    
    // Check collisions
    this.checkCollisions()
    
    // Check for power-up collection
    this.checkPowerUpCollection()
    
    // Update active power-up timer
    this.updatePowerUpTimer(deltaTime)
    
    // Update combo timer
    this.updateComboTimer(deltaTime)
    
    // Update invulnerability timer
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= deltaTime
      // Flash the frog when invulnerable
      if (this.frogController.frogModel) {
        this.frogController.frogModel.visible = Math.floor(this.invulnerableTimer / 100) % 2 === 0
      }
    } else {
      if (this.frogController.frogModel) {
        this.frogController.frogModel.visible = true
      }
    }
    
    // Check for level progression
    this.checkLevelProgression()
  }

  checkCollisions() {
    if (this.invulnerableTimer > 0) return
    
    const frogPos = this.frogController.getPosition()
    const frogBox = this.frogController.getBoundingBox()
    
    // Check vehicle collisions
    if (this.vehicleSystem.checkCollision(frogBox)) {
      if (!this.frogController.takeDamage()) {
        // Shield absorbed the hit
        this.audioEngine.playSound('shield')
        this.effectsManager.createPowerUpEffect(frogPos, 'shield')
      } else {
        this.handleDeath()
      }
      return
    }
    
    // Check water collision
    if (this.environmentManager.checkWaterCollision(frogPos)) {
      const log = this.environmentManager.checkLogCollision(frogPos)
      if (log) {
        // On a log - move with it
        this.frogController.position.x += log.direction * log.speed * 0.016
        this.frogController.frogModel.position.x = this.frogController.position.x
        
        // Check if frog went off screen while on log
        if (Math.abs(this.frogController.position.x) > 25) {
          this.handleDeath()
        }
      } else {
        // In water without a log
        this.audioEngine.playSound('splash')
        this.effectsManager.createSplashEffect(frogPos)
        this.handleDeath()
      }
    }
    
    // Check lily pad reached
    const lilyPadIndex = this.environmentManager.checkLilyPadReached(frogPos)
    if (lilyPadIndex >= 0) {
      this.handleLilyPadReached(lilyPadIndex)
    }
    
    // Update last safe position
    if (!this.environmentManager.checkWaterCollision(frogPos)) {
      this.lastSafePosition = { ...this.frogController.position }
    }
  }

  checkPowerUpCollection() {
    const frogPos = this.frogController.getPosition()
    const collected = this.powerUpSystem.checkCollection(frogPos)
    
    if (collected) {
      this.audioEngine.playSound('powerup')
      this.effectsManager.createPowerUpEffect(frogPos, collected.type)
      this.activatePowerUp(collected)
    }
  }

  activatePowerUp(powerUpData) {
    // Deactivate current power-up if any
    if (this.activePowerUp) {
      this.deactivatePowerUp()
    }
    
    this.activePowerUp = {
      type: powerUpData.type,
      icon: powerUpData.icon,
      duration: powerUpData.duration,
      timeLeft: powerUpData.duration / 1000
    }
    
    this.powerUpTimer = powerUpData.duration
    
    // Apply power-up effect
    this.frogController.activatePowerUp(powerUpData.type)
    
    if (powerUpData.type === 'freeze') {
      this.vehicleSystem.lanes.forEach(lane => {
        lane.speed *= 0.3
      })
    }
    
    if (powerUpData.type === 'speed') {
      this.effectsManager.createSpeedLines()
    }
    
    if (this.onPowerupUpdate) {
      this.onPowerupUpdate(this.activePowerUp)
    }
  }

  deactivatePowerUp() {
    if (!this.activePowerUp) return
    
    if (this.activePowerUp.type === 'freeze') {
      this.vehicleSystem.lanes.forEach(lane => {
        lane.speed /= 0.3
      })
    }
    
    this.activePowerUp = null
    this.powerUpTimer = 0
    
    if (this.onPowerupUpdate) {
      this.onPowerupUpdate(null)
    }
  }

  updatePowerUpTimer(deltaTime) {
    if (this.activePowerUp && this.powerUpTimer > 0) {
      this.powerUpTimer -= deltaTime
      this.activePowerUp.timeLeft = Math.ceil(this.powerUpTimer / 1000)
      
      if (this.powerUpTimer <= 0) {
        this.deactivatePowerUp()
      } else if (this.onPowerupUpdate) {
        this.onPowerupUpdate(this.activePowerUp)
      }
    }
  }

  updateComboTimer(deltaTime) {
    if (this.combo > 0 && this.comboTimer > 0) {
      this.comboTimer -= deltaTime
      
      if (this.comboTimer <= 0) {
        this.combo = 0
        if (this.onComboUpdate) this.onComboUpdate(this.combo)
      }
    }
  }

  handleLilyPadReached(index) {
    // Score points
    const basePoints = 100
    const comboMultiplier = Math.max(1, this.combo)
    const points = basePoints * comboMultiplier
    
    this.score += points
    this.combo++
    this.comboTimer = 3000 // 3 seconds to maintain combo
    
    // Victory effects
    this.audioEngine.playSound('victory')
    this.effectsManager.createPowerUpEffect(this.frogController.getPosition(), 'victory')
    
    // Reset frog position
    this.frogController.reset()
    this.invulnerableTimer = 1000 // 1 second of invulnerability
    
    // Check if all lily pads are occupied
    const allOccupied = this.environmentManager.lilyPads.every(pad => pad.occupied)
    if (allOccupied) {
      this.handleLevelComplete()
    }
    
    // Update UI
    if (this.onScoreUpdate) this.onScoreUpdate(this.score)
    if (this.onComboUpdate) this.onComboUpdate(this.combo)
  }

  handleLevelComplete() {
    // Bonus points for completing level
    this.score += 500 * this.level
    this.level++
    
    // Reset lily pads
    this.environmentManager.reset()
    
    // Increase difficulty
    this.vehicleSystem.increaseDifficulty(this.level)
    
    // Celebration
    this.audioEngine.playSound('victory')
    
    if (this.onScoreUpdate) this.onScoreUpdate(this.score)
  }

  handleDeath() {
    this.lives--
    this.combo = 0
    this.comboTimer = 0
    
    // Death effects
    this.audioEngine.playSound('crash')
    this.effectsManager.createDeathEffect(this.frogController.getPosition())
    
    if (this.lives > 0) {
      // Reset to last safe position
      this.frogController.reset()
      this.invulnerableTimer = 2000 // 2 seconds of invulnerability
      
      if (this.onLivesUpdate) this.onLivesUpdate(this.lives)
      if (this.onComboUpdate) this.onComboUpdate(this.combo)
    } else {
      this.gameOver()
    }
  }

  checkLevelProgression() {
    // Increase difficulty over time
    const timeBasedLevel = Math.floor(this.score / 1000) + 1
    if (timeBasedLevel > this.level) {
      this.level = timeBasedLevel
      this.vehicleSystem.increaseDifficulty(this.level)
    }
  }

  gameOver() {
    this.isPlaying = false
    this.audioEngine.stopBackgroundMusic()
    
    if (this.onGameOver) {
      this.onGameOver()
    }
  }

  reset() {
    this.isPlaying = false
    this.isPaused = false
    this.score = 0
    this.lives = 3
    this.combo = 0
    this.level = 1
    this.activePowerUp = null
    this.powerUpTimer = 0
    this.invulnerableTimer = 0
    
    this.frogController.reset()
    this.vehicleSystem.reset()
    this.environmentManager.reset()
    this.powerUpSystem.reset()
    
    this.audioEngine.stopBackgroundMusic()
  }

  destroy() {
    this.reset()
    this.audioEngine.destroy()
  }
}