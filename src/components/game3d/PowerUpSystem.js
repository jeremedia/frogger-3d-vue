import * as THREE from 'three'
import { gsap } from 'gsap'

export default class PowerUpSystem {
  constructor(scene) {
    this.scene = scene
    this.powerUps = []
    this.spawnTimer = 0
    this.spawnInterval = 5000
    
    this.powerUpTypes = [
      { type: 'speed', icon: '⚡', color: 0x00FFFF, duration: 10000 },
      { type: 'shield', icon: '🛡️', color: 0xFF00FF, duration: 10000 },
      { type: 'doubleJump', icon: '🦋', color: 0xFFFF00, duration: 10000 },
      { type: 'magnet', icon: '🧲', color: 0xFF0000, duration: 8000 },
      { type: 'freeze', icon: '❄️', color: 0x00FFFF, duration: 5000 }
    ]
  }

  createPowerUpModel(type) {
    const powerUpGroup = new THREE.Group()
    
    // Outer glow sphere
    const glowGeometry = new THREE.SphereGeometry(0.8, 16, 16)
    const glowMaterial = new THREE.MeshPhongMaterial({
      color: type.color,
      transparent: true,
      opacity: 0.3,
      emissive: type.color,
      emissiveIntensity: 0.5
    })
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial)
    powerUpGroup.add(glowSphere)
    
    // Inner core
    const coreGeometry = new THREE.OctahedronGeometry(0.4, 0)
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: type.color,
      emissive: type.color,
      emissiveIntensity: 1,
      shininess: 100
    })
    const core = new THREE.Mesh(coreGeometry, coreMaterial)
    powerUpGroup.add(core)
    
    // Particle ring
    const ringParticles = new THREE.BufferGeometry()
    const particleCount = 20
    const positions = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      positions[i * 3] = Math.cos(angle) * 0.6
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = Math.sin(angle) * 0.6
    }
    
    ringParticles.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    const ringMaterial = new THREE.PointsMaterial({
      color: type.color,
      size: 0.1,
      blending: THREE.AdditiveBlending
    })
    
    const ring = new THREE.Points(ringParticles, ringMaterial)
    powerUpGroup.add(ring)
    
    // Add point light
    const light = new THREE.PointLight(type.color, 1, 5)
    powerUpGroup.add(light)
    
    // Store type info
    powerUpGroup.userData = {
      type: type.type,
      icon: type.icon,
      duration: type.duration
    }
    
    return powerUpGroup
  }

  spawnPowerUp() {
    const type = this.powerUpTypes[Math.floor(Math.random() * this.powerUpTypes.length)]
    const powerUp = this.createPowerUpModel(type)
    
    // Random position on safe zones
    const positions = [
      { x: Math.random() * 20 - 10, z: 8 },  // Start zone
      { x: Math.random() * 20 - 10, z: -2 }, // Middle safe zone
      { x: Math.random() * 20 - 10, z: -10 } // End zone
    ]
    
    const pos = positions[Math.floor(Math.random() * positions.length)]
    powerUp.position.set(pos.x, 1, pos.z)
    
    this.scene.add(powerUp)
    
    // Floating animation
    gsap.to(powerUp.position, {
      y: 2,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    })
    
    // Rotation animation
    gsap.to(powerUp.rotation, {
      y: Math.PI * 2,
      duration: 3,
      repeat: -1,
      ease: "none"
    })
    
    // Pulsing effect
    gsap.to(powerUp.scale, {
      x: 1.2,
      y: 1.2,
      z: 1.2,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    })
    
    this.powerUps.push({
      model: powerUp,
      type: type,
      active: true,
      collected: false
    })
  }

  checkCollection(playerPosition) {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i]
      if (!powerUp.active || powerUp.collected) continue
      
      const distance = Math.sqrt(
        Math.pow(playerPosition.x - powerUp.model.position.x, 2) +
        Math.pow(playerPosition.z - powerUp.model.position.z, 2)
      )
      
      if (distance < 1.5) {
        this.collectPowerUp(powerUp)
        return powerUp.model.userData
      }
    }
    return null
  }

  collectPowerUp(powerUp) {
    powerUp.collected = true
    
    // Collection animation
    gsap.to(powerUp.model.scale, {
      x: 2,
      y: 2,
      z: 2,
      duration: 0.3,
      ease: "back.out"
    })
    
    gsap.to(powerUp.model.position, {
      y: powerUp.model.position.y + 2,
      duration: 0.5,
      ease: "power2.out"
    })
    
    gsap.to(powerUp.model.rotation, {
      y: powerUp.model.rotation.y + Math.PI * 4,
      duration: 0.5
    })
    
    // Particle burst
    this.createCollectionParticles(powerUp.model.position, powerUp.type.color)
    
    // Fade out and remove
    const meshes = []
    powerUp.model.traverse((child) => {
      if (child.isMesh) {
        meshes.push(child)
      }
    })
    
    meshes.forEach(mesh => {
      gsap.to(mesh.material, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
          if (powerUp.model.parent) {
            this.scene.remove(powerUp.model)
          }
        }
      })
    })
    
    powerUp.active = false
  }

  createCollectionParticles(position, color) {
    const particleCount = 30
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = []
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      positions[i3] = position.x
      positions[i3 + 1] = position.y
      positions[i3 + 2] = position.z
      
      const angle = (i / particleCount) * Math.PI * 2
      velocities.push({
        x: Math.cos(angle) * 0.2,
        y: Math.random() * 0.1 + 0.1,
        z: Math.sin(angle) * 0.2
      })
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    const material = new THREE.PointsMaterial({
      color: color,
      size: 0.3,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 1
    })
    
    const particles = new THREE.Points(geometry, material)
    this.scene.add(particles)
    
    const animate = () => {
      const positions = particles.geometry.attributes.position.array
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        positions[i3] += velocities[i].x
        positions[i3 + 1] += velocities[i].y
        positions[i3 + 2] += velocities[i].z
        velocities[i].y -= 0.005
      }
      particles.geometry.attributes.position.needsUpdate = true
    }
    
    gsap.to(material, {
      opacity: 0,
      duration: 1.5,
      onUpdate: animate,
      onComplete: () => {
        this.scene.remove(particles)
      }
    })
  }

  applyPowerUp(type, target) {
    switch(type) {
      case 'speed':
        return {
          apply: () => {
            target.speed = (target.speed || 1) * 2
          },
          remove: () => {
            target.speed = (target.speed || 2) / 2
          }
        }
      
      case 'shield':
        return {
          apply: () => {
            target.invulnerable = true
          },
          remove: () => {
            target.invulnerable = false
          }
        }
      
      case 'doubleJump':
        return {
          apply: () => {
            target.canDoubleJump = true
          },
          remove: () => {
            target.canDoubleJump = false
          }
        }
      
      case 'magnet':
        return {
          apply: () => {
            target.magnetActive = true
          },
          remove: () => {
            target.magnetActive = false
          }
        }
      
      case 'freeze':
        return {
          apply: () => {
            target.timeScale = 0.3
          },
          remove: () => {
            target.timeScale = 1
          }
        }
    }
  }

  update(deltaTime) {
    this.spawnTimer += deltaTime
    
    if (this.spawnTimer > this.spawnInterval) {
      this.spawnTimer = 0
      this.spawnPowerUp()
      
      // Vary spawn interval
      this.spawnInterval = 5000 + Math.random() * 5000
    }
    
    // Update active power-ups
    this.powerUps = this.powerUps.filter(powerUp => powerUp.active)
    
    // Rotate inner cores
    this.powerUps.forEach(powerUp => {
      if (powerUp.model.children[1]) {
        powerUp.model.children[1].rotation.x += 0.02
        powerUp.model.children[1].rotation.y += 0.03
      }
      
      // Rotate particle ring
      if (powerUp.model.children[2]) {
        powerUp.model.children[2].rotation.y += 0.01
      }
    })
  }

  reset() {
    this.powerUps.forEach(powerUp => {
      if (powerUp.model && powerUp.model.parent) {
        this.scene.remove(powerUp.model)
      }
    })
    this.powerUps = []
    this.spawnTimer = 0
  }
}