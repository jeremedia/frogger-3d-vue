import * as THREE from 'three'
import { gsap } from 'gsap'

export default class EffectsManager {
  constructor(scene, renderer, camera) {
    this.scene = scene
    this.renderer = renderer
    this.camera = camera
    this.particles = []
    this.activeEffects = []
    
    this.setupPostProcessing()
    this.createAmbientParticles()
  }

  setupPostProcessing() {
    // Simplified post-processing setup
    // In a real implementation, you'd use THREE.EffectComposer
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
  }

  createAmbientParticles() {
    // Fireflies
    const fireflyCount = 20
    const fireflyGeometry = new THREE.BufferGeometry()
    const fireflyPositions = new Float32Array(fireflyCount * 3)
    const fireflyColors = new Float32Array(fireflyCount * 3)
    
    for (let i = 0; i < fireflyCount; i++) {
      const i3 = i * 3
      fireflyPositions[i3] = Math.random() * 40 - 20
      fireflyPositions[i3 + 1] = Math.random() * 5 + 1
      fireflyPositions[i3 + 2] = Math.random() * 40 - 20
      
      fireflyColors[i3] = 1
      fireflyColors[i3 + 1] = 1
      fireflyColors[i3 + 2] = 0.5
    }
    
    fireflyGeometry.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3))
    fireflyGeometry.setAttribute('color', new THREE.BufferAttribute(fireflyColors, 3))
    
    const fireflyMaterial = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8
    })
    
    this.fireflies = new THREE.Points(fireflyGeometry, fireflyMaterial)
    this.scene.add(this.fireflies)
    
    // Animate fireflies
    this.animateFireflies()
  }

  animateFireflies() {
    const positions = this.fireflies.geometry.attributes.position.array
    const originalPositions = [...positions]
    
    gsap.to({}, {
      duration: 0,
      repeat: -1,
      onRepeat: () => {
        const time = Date.now() * 0.0005
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] = originalPositions[i] + Math.sin(time + i) * 2
          positions[i + 1] = originalPositions[i + 1] + Math.sin(time * 1.5 + i) * 0.5
          positions[i + 2] = originalPositions[i + 2] + Math.cos(time + i) * 2
        }
        this.fireflies.geometry.attributes.position.needsUpdate = true
        
        this.fireflies.material.opacity = 0.6 + Math.sin(time * 2) * 0.3
      }
    })
  }

  createSplashEffect(position) {
    const dropCount = 30
    const dropGeometry = new THREE.BufferGeometry()
    const dropPositions = new Float32Array(dropCount * 3)
    const dropVelocities = []
    
    for (let i = 0; i < dropCount; i++) {
      const i3 = i * 3
      dropPositions[i3] = position.x
      dropPositions[i3 + 1] = position.y
      dropPositions[i3 + 2] = position.z
      
      dropVelocities.push({
        x: (Math.random() - 0.5) * 0.3,
        y: Math.random() * 0.5 + 0.2,
        z: (Math.random() - 0.5) * 0.3
      })
    }
    
    dropGeometry.setAttribute('position', new THREE.BufferAttribute(dropPositions, 3))
    
    const dropMaterial = new THREE.PointsMaterial({
      color: 0x4169E1,
      size: 0.3,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    })
    
    const dropSystem = new THREE.Points(dropGeometry, dropMaterial)
    this.scene.add(dropSystem)
    
    const animateDrops = () => {
      const positions = dropSystem.geometry.attributes.position.array
      
      for (let i = 0; i < dropCount; i++) {
        const i3 = i * 3
        positions[i3] += dropVelocities[i].x
        positions[i3 + 1] += dropVelocities[i].y
        positions[i3 + 2] += dropVelocities[i].z
        
        dropVelocities[i].y -= 0.02 // Gravity
      }
      
      dropSystem.geometry.attributes.position.needsUpdate = true
    }
    
    gsap.to(dropMaterial, {
      opacity: 0,
      duration: 1.5,
      onUpdate: animateDrops,
      onComplete: () => {
        this.scene.remove(dropSystem)
      }
    })
    
    // Create ripple effect
    this.createRippleEffect(position)
  }

  createRippleEffect(position) {
    const rippleGeometry = new THREE.RingGeometry(0.1, 0.5, 32)
    const rippleMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    })
    
    const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial)
    ripple.rotation.x = -Math.PI / 2
    ripple.position.set(position.x, 0.1, position.z)
    this.scene.add(ripple)
    
    gsap.to(ripple.scale, {
      x: 5,
      y: 5,
      z: 5,
      duration: 1,
      ease: "power2.out"
    })
    
    gsap.to(rippleMaterial, {
      opacity: 0,
      duration: 1,
      onComplete: () => {
        this.scene.remove(ripple)
      }
    })
  }

  createJumpDustEffect(position) {
    const dustCount = 15
    const dustGeometry = new THREE.BufferGeometry()
    const dustPositions = new Float32Array(dustCount * 3)
    
    for (let i = 0; i < dustCount; i++) {
      const i3 = i * 3
      const angle = (i / dustCount) * Math.PI * 2
      dustPositions[i3] = position.x + Math.cos(angle) * 0.3
      dustPositions[i3 + 1] = 0.1
      dustPositions[i3 + 2] = position.z + Math.sin(angle) * 0.3
    }
    
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
    
    const dustMaterial = new THREE.PointsMaterial({
      color: 0x8B7355,
      size: 0.4,
      transparent: true,
      opacity: 0.8
    })
    
    const dustSystem = new THREE.Points(dustGeometry, dustMaterial)
    this.scene.add(dustSystem)
    
    gsap.to(dustPositions, {
      duration: 0.8,
      onUpdate: () => {
        for (let i = 0; i < dustPositions.length; i += 3) {
          const angle = (i / 3 / dustCount) * Math.PI * 2
          dustPositions[i] += Math.cos(angle) * 0.05
          dustPositions[i + 1] += 0.03
          dustPositions[i + 2] += Math.sin(angle) * 0.05
        }
        dustGeometry.attributes.position.needsUpdate = true
      }
    })
    
    gsap.to(dustMaterial, {
      opacity: 0,
      size: 0.1,
      duration: 0.8,
      onComplete: () => {
        this.scene.remove(dustSystem)
      }
    })
  }

  createPowerUpEffect(position, type) {
    const particleCount = 40
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    
    let color
    switch(type) {
      case 'speed':
        color = new THREE.Color(0x00FFFF)
        break
      case 'shield':
        color = new THREE.Color(0xFF00FF)
        break
      case 'doubleJump':
        color = new THREE.Color(0xFFFF00)
        break
      default:
        color = new THREE.Color(0xFFFFFF)
    }
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      positions[i3] = position.x
      positions[i3 + 1] = position.y
      positions[i3 + 2] = position.z
      
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 1
    })
    
    const particleSystem = new THREE.Points(geometry, material)
    this.scene.add(particleSystem)
    
    // Spiral animation
    gsap.to({}, {
      duration: 1.5,
      onUpdate: (progress) => {
        const time = progress * Math.PI * 4
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3
          const offset = (i / particleCount) * Math.PI * 2
          positions[i3] = position.x + Math.cos(time + offset) * (1 + i * 0.05)
          positions[i3 + 1] = position.y + i * 0.1
          positions[i3 + 2] = position.z + Math.sin(time + offset) * (1 + i * 0.05)
        }
        geometry.attributes.position.needsUpdate = true
      }
    })
    
    gsap.to(material, {
      opacity: 0,
      duration: 1.5,
      onComplete: () => {
        this.scene.remove(particleSystem)
      }
    })
  }

  createDeathEffect(position) {
    // Explosion particles
    const particleCount = 100
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const velocities = []
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      positions[i3] = position.x
      positions[i3 + 1] = position.y + 0.5
      positions[i3 + 2] = position.z
      
      colors[i3] = 1
      colors[i3 + 1] = Math.random() * 0.5
      colors[i3 + 2] = 0
      
      velocities.push({
        x: (Math.random() - 0.5) * 0.5,
        y: Math.random() * 0.5,
        z: (Math.random() - 0.5) * 0.5
      })
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    })
    
    const particleSystem = new THREE.Points(geometry, material)
    this.scene.add(particleSystem)
    
    // Flash effect
    const flashLight = new THREE.PointLight(0xFF0000, 5, 10)
    flashLight.position.copy(position)
    this.scene.add(flashLight)
    
    gsap.to(flashLight, {
      intensity: 0,
      duration: 0.5,
      onComplete: () => {
        this.scene.remove(flashLight)
      }
    })
    
    // Animate explosion
    gsap.to({}, {
      duration: 2,
      onUpdate: () => {
        const positions = geometry.attributes.position.array
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3
          positions[i3] += velocities[i].x
          positions[i3 + 1] += velocities[i].y
          positions[i3 + 2] += velocities[i].z
          velocities[i].y -= 0.02
        }
        geometry.attributes.position.needsUpdate = true
      }
    })
    
    gsap.to(material, {
      opacity: 0,
      duration: 2,
      onComplete: () => {
        this.scene.remove(particleSystem)
      }
    })
    
    // Screen shake
    this.screenShake(0.5)
  }

  screenShake(duration) {
    const originalPosition = this.camera.position.clone()
    
    gsap.to({}, {
      duration: duration,
      onUpdate: () => {
        this.camera.position.x = originalPosition.x + (Math.random() - 0.5) * 0.5
        this.camera.position.y = originalPosition.y + (Math.random() - 0.5) * 0.5
        this.camera.position.z = originalPosition.z + (Math.random() - 0.5) * 0.5
      },
      onComplete: () => {
        this.camera.position.copy(originalPosition)
      }
    })
  }

  createSpeedLines() {
    const lineCount = 20
    const lines = []
    
    for (let i = 0; i < lineCount; i++) {
      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(6)
      
      const angle = (i / lineCount) * Math.PI * 2
      const radius = 10
      
      positions[0] = Math.cos(angle) * radius
      positions[1] = Math.random() * 5
      positions[2] = Math.sin(angle) * radius
      
      positions[3] = Math.cos(angle) * (radius - 2)
      positions[4] = positions[1]
      positions[5] = Math.sin(angle) * (radius - 2)
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      
      const material = new THREE.LineBasicMaterial({
        color: 0x00FFFF,
        transparent: true,
        opacity: 0.5
      })
      
      const line = new THREE.Line(geometry, material)
      this.scene.add(line)
      lines.push(line)
    }
    
    gsap.to({}, {
      duration: 1,
      repeat: -1,
      onUpdate: () => {
        lines.forEach((line, i) => {
          line.position.z += 0.5
          if (line.position.z > 10) {
            line.position.z = -10
          }
          line.material.opacity = 0.5 * (1 - Math.abs(line.position.z) / 10)
        })
      }
    })
    
    setTimeout(() => {
      lines.forEach(line => {
        this.scene.remove(line)
      })
    }, 10000)
  }

  update(deltaTime) {
    // Update any ongoing effects
    if (this.fireflies) {
      this.fireflies.rotation.y += deltaTime * 0.0001
    }
  }
}