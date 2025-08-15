import * as THREE from 'three'

export default class ParticlePool {
  constructor(scene, maxSystems = 10) {
    this.scene = scene
    this.maxSystems = maxSystems
    this.pool = []
    this.active = []
    
    this.initializePool()
  }

  initializePool() {
    for (let i = 0; i < this.maxSystems; i++) {
      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(100 * 3)
      const colors = new Float32Array(100 * 3)
      const sizes = new Float32Array(100)
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
      
      const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 1,
        sizeAttenuation: true
      })
      
      const particleSystem = new THREE.Points(geometry, material)
      particleSystem.visible = false
      particleSystem.userData = {
        active: false,
        lifetime: 0,
        maxLifetime: 1000,
        update: null,
        particleCount: 0
      }
      
      this.scene.add(particleSystem)
      this.pool.push(particleSystem)
    }
  }

  getSystem() {
    for (let system of this.pool) {
      if (!system.userData.active) {
        system.userData.active = true
        system.visible = true
        this.active.push(system)
        return system
      }
    }
    
    console.warn('ParticlePool: All systems in use!')
    return null
  }

  releaseSystem(system) {
    system.visible = false
    system.userData.active = false
    system.userData.update = null
    system.userData.lifetime = 0
    
    const index = this.active.indexOf(system)
    if (index > -1) {
      this.active.splice(index, 1)
    }
    
    // Reset material
    system.material.opacity = 1
    system.material.needsUpdate = true
  }

  createSplash(position, color = 0x4169E1) {
    const system = this.getSystem()
    if (!system) return null
    
    const particleCount = 30
    system.userData.particleCount = particleCount
    system.userData.maxLifetime = 1500
    
    const positions = system.geometry.attributes.position.array
    const colors = system.geometry.attributes.color.array
    const sizes = system.geometry.attributes.size.array
    
    const velocities = []
    const col = new THREE.Color(color)
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      positions[i3] = position.x
      positions[i3 + 1] = position.y
      positions[i3 + 2] = position.z
      
      colors[i3] = col.r
      colors[i3 + 1] = col.g
      colors[i3 + 2] = col.b
      
      sizes[i] = Math.random() * 0.5 + 0.2
      
      velocities.push({
        x: (Math.random() - 0.5) * 0.3,
        y: Math.random() * 0.5 + 0.2,
        z: (Math.random() - 0.5) * 0.3
      })
    }
    
    system.geometry.attributes.position.needsUpdate = true
    system.geometry.attributes.color.needsUpdate = true
    system.geometry.attributes.size.needsUpdate = true
    
    system.userData.velocities = velocities
    system.userData.update = (deltaTime) => {
      const positions = system.geometry.attributes.position.array
      const sizes = system.geometry.attributes.size.array
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        positions[i3] += velocities[i].x * deltaTime * 0.001
        positions[i3 + 1] += velocities[i].y * deltaTime * 0.001
        positions[i3 + 2] += velocities[i].z * deltaTime * 0.001
        
        velocities[i].y -= 0.02 * deltaTime * 0.001
        sizes[i] *= 0.98
      }
      
      system.geometry.attributes.position.needsUpdate = true
      system.geometry.attributes.size.needsUpdate = true
      
      const progress = system.userData.lifetime / system.userData.maxLifetime
      system.material.opacity = 1 - progress
    }
    
    return system
  }

  createExplosion(position, color = 0xFF0000) {
    const system = this.getSystem()
    if (!system) return null
    
    const particleCount = 50
    system.userData.particleCount = particleCount
    system.userData.maxLifetime = 2000
    
    const positions = system.geometry.attributes.position.array
    const colors = system.geometry.attributes.color.array
    const sizes = system.geometry.attributes.size.array
    
    const velocities = []
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      positions[i3] = position.x
      positions[i3 + 1] = position.y + 0.5
      positions[i3 + 2] = position.z
      
      colors[i3] = 1
      colors[i3 + 1] = Math.random() * 0.5
      colors[i3 + 2] = 0
      
      sizes[i] = Math.random() * 0.8 + 0.2
      
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 0.5 + 0.2
      velocities.push({
        x: Math.cos(angle) * speed,
        y: Math.random() * 0.5,
        z: Math.sin(angle) * speed
      })
    }
    
    system.geometry.attributes.position.needsUpdate = true
    system.geometry.attributes.color.needsUpdate = true
    system.geometry.attributes.size.needsUpdate = true
    
    system.userData.velocities = velocities
    system.userData.update = (deltaTime) => {
      const positions = system.geometry.attributes.position.array
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        positions[i3] += velocities[i].x * deltaTime * 0.001
        positions[i3 + 1] += velocities[i].y * deltaTime * 0.001
        positions[i3 + 2] += velocities[i].z * deltaTime * 0.001
        
        velocities[i].y -= 0.02 * deltaTime * 0.001
      }
      
      system.geometry.attributes.position.needsUpdate = true
      
      const progress = system.userData.lifetime / system.userData.maxLifetime
      system.material.opacity = Math.max(0, 1 - progress)
    }
    
    return system
  }

  update(deltaTime) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const system = this.active[i]
      
      if (system.userData.update) {
        system.userData.update(deltaTime)
      }
      
      system.userData.lifetime += deltaTime
      
      if (system.userData.lifetime >= system.userData.maxLifetime) {
        this.releaseSystem(system)
      }
    }
  }

  reset() {
    for (let system of this.active) {
      this.releaseSystem(system)
    }
    this.active = []
  }

  getActiveCount() {
    return this.active.length
  }
}