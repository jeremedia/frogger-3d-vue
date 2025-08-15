import * as THREE from 'three'

export default class AudioEngine {
  constructor(camera) {
    this.camera = camera
    this.listener = new THREE.AudioListener()
    this.camera.add(this.listener)
    
    this.sounds = {}
    this.backgroundMusic = null
    this.soundEnabled = true
    
    this.initializeSounds()
  }

  initializeSounds() {
    // Create audio loader
    this.audioLoader = new THREE.AudioLoader()
    
    // Initialize sound effects (using oscillators for now)
    this.createSyntheticSounds()
  }

  createSyntheticSounds() {
    // Create synthetic sounds using Web Audio API
    const audioContext = this.listener.context
    
    // Jump sound
    this.sounds.jump = () => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    }
    
    // Splash sound
    this.sounds.splash = () => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      const filter = audioContext.createBiquadFilter()
      
      oscillator.type = 'sine'
      filter.type = 'lowpass'
      filter.frequency.value = 1000
      
      oscillator.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3)
      
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    }
    
    // Collect sound
    this.sounds.collect = () => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2)
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    }
    
    // Crash sound
    this.sounds.crash = () => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      const distortion = audioContext.createWaveShaper()
      
      // Create distortion curve
      const samples = 44100
      const curve = new Float32Array(samples)
      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1
        curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.5)
      }
      distortion.curve = curve
      
      oscillator.type = 'sawtooth'
      oscillator.connect(distortion)
      distortion.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3)
      
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.4)
    }
    
    // Power-up sound
    this.sounds.powerup = () => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2)
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.4)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    }
    
    // Victory sound
    this.sounds.victory = () => {
      const notes = [523, 659, 784, 1047] // C, E, G, High C
      notes.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.value = freq
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.5)
        }, index * 100)
      })
    }
  }

  playSound(soundName) {
    if (!this.soundEnabled) return
    
    if (this.sounds[soundName]) {
      this.sounds[soundName]()
    }
  }

  playBackgroundMusic() {
    if (!this.soundEnabled) return
    
    const audioContext = this.listener.context
    
    // Create a simple looping background track
    const createBackgroundLoop = () => {
      const oscillator1 = audioContext.createOscillator()
      const oscillator2 = audioContext.createOscillator()
      const gainNode1 = audioContext.createGain()
      const gainNode2 = audioContext.createGain()
      const filter = audioContext.createBiquadFilter()
      
      filter.type = 'lowpass'
      filter.frequency.value = 500
      
      oscillator1.type = 'sine'
      oscillator2.type = 'triangle'
      
      oscillator1.frequency.value = 110 // A2
      oscillator2.frequency.value = 165 // E3
      
      oscillator1.connect(gainNode1)
      oscillator2.connect(gainNode2)
      gainNode1.connect(filter)
      gainNode2.connect(filter)
      filter.connect(audioContext.destination)
      
      gainNode1.gain.value = 0.05
      gainNode2.gain.value = 0.03
      
      oscillator1.start()
      oscillator2.start()
      
      this.backgroundOscillators = [oscillator1, oscillator2]
      
      // Create rhythm
      this.beatInterval = setInterval(() => {
        const kick = audioContext.createOscillator()
        const kickGain = audioContext.createGain()
        
        kick.frequency.setValueAtTime(60, audioContext.currentTime)
        kick.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.1)
        
        kick.connect(kickGain)
        kickGain.connect(audioContext.destination)
        
        kickGain.gain.setValueAtTime(0.1, audioContext.currentTime)
        kickGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        
        kick.start(audioContext.currentTime)
        kick.stop(audioContext.currentTime + 0.1)
      }, 500)
    }
    
    createBackgroundLoop()
  }

  stopBackgroundMusic() {
    if (this.backgroundOscillators) {
      this.backgroundOscillators.forEach(osc => osc.stop())
      this.backgroundOscillators = null
    }
    
    if (this.beatInterval) {
      clearInterval(this.beatInterval)
      this.beatInterval = null
    }
  }

  playGameOverSound() {
    if (!this.soundEnabled) return
    
    const audioContext = this.listener.context
    
    // Descending notes for game over
    const notes = [523, 440, 349, 262] // C, A, F, Low C
    notes.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.type = 'sine'
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = freq
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.6)
      }, index * 150)
    })
  }

  play3DSound(soundName, position) {
    if (!this.soundEnabled) return
    
    const sound = new THREE.PositionalAudio(this.listener)
    
    // Create buffer with synthetic sound
    const audioContext = this.listener.context
    const duration = 0.5
    const sampleRate = audioContext.sampleRate
    const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate)
    const data = buffer.getChannelData(0)
    
    // Generate noise
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() - 0.5) * 0.2
    }
    
    sound.setBuffer(buffer)
    sound.setRefDistance(5)
    sound.setVolume(0.5)
    
    const dummy = new THREE.Object3D()
    dummy.position.copy(position)
    dummy.add(sound)
    this.scene.add(dummy)
    
    sound.play()
    
    setTimeout(() => {
      this.scene.remove(dummy)
    }, duration * 1000)
  }

  setVolume(volume) {
    this.listener.setMasterVolume(volume)
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled
    if (!this.soundEnabled) {
      this.stopBackgroundMusic()
    }
  }

  destroy() {
    this.stopBackgroundMusic()
    if (this.beatInterval) {
      clearInterval(this.beatInterval)
    }
  }
}