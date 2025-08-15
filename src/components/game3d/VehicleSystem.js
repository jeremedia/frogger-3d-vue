import * as THREE from 'three'
import { gsap } from 'gsap'

export default class VehicleSystem {
  constructor(scene) {
    this.scene = scene
    this.vehicles = []
    this.lanes = [
      { z: 6, direction: 1, speed: 2, types: ['car', 'taxi'] },
      { z: 4, direction: -1, speed: 3, types: ['bus', 'truck'] },
      { z: 2, direction: 1, speed: 2.5, types: ['car', 'taxi'] },
      { z: 0, direction: -1, speed: 4, types: ['truck'] },
      { z: -2, direction: 1, speed: 3.5, types: ['car', 'bus'] }
    ]
    
    this.vehiclePool = []
    this.maxVehicles = 20
    this.spawnTimer = 0
    this.spawnInterval = 2000
    
    this.initializeVehicles()
  }

  initializeVehicles() {
    this.lanes.forEach((lane, index) => {
      setTimeout(() => {
        this.spawnVehicle(lane)
      }, index * 500)
    })
  }

  createVehicleModel(type) {
    const vehicleGroup = new THREE.Group()
    
    let bodyGeometry, bodyColor, width, height, length
    
    switch(type) {
      case 'car':
        bodyGeometry = new THREE.BoxGeometry(1.5, 0.8, 3)
        bodyColor = [0xFF0000, 0x0000FF, 0x00FF00, 0xFFFF00][Math.floor(Math.random() * 4)]
        break
      case 'taxi':
        bodyGeometry = new THREE.BoxGeometry(1.5, 0.8, 3)
        bodyColor = 0xFFD700
        break
      case 'bus':
        bodyGeometry = new THREE.BoxGeometry(2, 1.5, 5)
        bodyColor = 0xFF8C00
        break
      case 'truck':
        bodyGeometry = new THREE.BoxGeometry(2, 1.2, 4)
        bodyColor = 0x8B4513
        break
      default:
        bodyGeometry = new THREE.BoxGeometry(1.5, 0.8, 3)
        bodyColor = 0x808080
    }
    
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: bodyColor,
      shininess: 100
    })
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.5
    body.castShadow = true
    body.receiveShadow = true
    vehicleGroup.add(body)
    
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16)
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 })
    
    const wheelPositions = [
      { x: -0.6, z: 1 },
      { x: 0.6, z: 1 },
      { x: -0.6, z: -1 },
      { x: 0.6, z: -1 }
    ]
    
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
      wheel.rotation.z = Math.PI / 2
      wheel.position.set(pos.x, 0.2, pos.z)
      wheel.castShadow = true
      vehicleGroup.add(wheel)
    })
    
    const headlightGeometry = new THREE.SphereGeometry(0.15, 8, 8)
    const headlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFAA,
      emissive: 0xFFFFAA,
      emissiveIntensity: 1
    })
    
    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial)
    leftHeadlight.position.set(-0.4, 0.5, 1.5)
    vehicleGroup.add(leftHeadlight)
    
    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial)
    rightHeadlight.position.set(0.4, 0.5, 1.5)
    vehicleGroup.add(rightHeadlight)
    
    
    if (type === 'taxi') {
      const signGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.8)
      const signMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 })
      const taxiSign = new THREE.Mesh(signGeometry, signMaterial)
      taxiSign.position.y = 1.2
      vehicleGroup.add(taxiSign)
    }
    
    return vehicleGroup
  }

  spawnVehicle(lane) {
    const types = lane.types
    const type = types[Math.floor(Math.random() * types.length)]
    const vehicle = this.createVehicleModel(type)
    
    const startX = lane.direction > 0 ? -25 : 25
    vehicle.position.set(startX, 0, lane.z)
    
    if (lane.direction < 0) {
      vehicle.rotation.y = Math.PI
    }
    
    this.scene.add(vehicle)
    
    const vehicleData = {
      model: vehicle,
      lane: lane,
      speed: lane.speed * (0.8 + Math.random() * 0.4),
      type: type,
      active: true,
      boundingBox: new THREE.Box3().setFromObject(vehicle)
    }
    
    this.vehicles.push(vehicleData)
  }


  update(deltaTime) {
    this.vehicles.forEach((vehicle, index) => {
      if (!vehicle.active) return
      
      const oldX = vehicle.model.position.x
      vehicle.model.position.x += vehicle.lane.direction * vehicle.speed * deltaTime * 0.001
      
      // Update bounding box only if position changed significantly
      if (Math.abs(vehicle.model.position.x - oldX) > 0.1) {
        vehicle.boundingBox.setFromObject(vehicle.model)
      }
      
      // Rotate wheels (cache wheel references)
      if (!vehicle.wheels) {
        vehicle.wheels = vehicle.model.children.filter(child => 
          child.geometry && child.geometry.type === 'CylinderGeometry'
        )
      }
      
      vehicle.wheels.forEach(wheel => {
        wheel.rotation.x += vehicle.speed * deltaTime * 0.005
      })
      
      if (Math.abs(vehicle.model.position.x) > 30) {
        this.scene.remove(vehicle.model)
        vehicle.active = false
      }
    })
    
    this.vehicles = this.vehicles.filter(v => v.active)
    
    this.spawnTimer += deltaTime
    if (this.spawnTimer > this.spawnInterval) {
      this.spawnTimer = 0
      const lane = this.lanes[Math.floor(Math.random() * this.lanes.length)]
      this.spawnVehicle(lane)
    }
  }

  checkCollision(playerBox) {
    for (let vehicle of this.vehicles) {
      if (!vehicle.active) continue
      
      if (playerBox.intersectsBox(vehicle.boundingBox)) {
        this.createCrashEffect(vehicle.model.position)
        return true
      }
    }
    return false
  }

  createCrashEffect(position) {
    const particleCount = 50
    const particles = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      positions[i3] = position.x + (Math.random() - 0.5) * 2
      positions[i3 + 1] = position.y + Math.random() * 2
      positions[i3 + 2] = position.z + (Math.random() - 0.5) * 2
      
      colors[i3] = Math.random()
      colors[i3 + 1] = Math.random() * 0.5
      colors[i3 + 2] = 0
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    })
    
    const particleSystem = new THREE.Points(particles, particleMaterial)
    this.scene.add(particleSystem)
    
    gsap.to(particleSystem.material, {
      opacity: 0,
      duration: 1,
      onComplete: () => {
        this.scene.remove(particleSystem)
      }
    })
    
    gsap.to(positions, {
      duration: 1,
      onUpdate: () => {
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += (Math.random() - 0.5) * 0.2
          positions[i + 1] += Math.random() * 0.1
          positions[i + 2] += (Math.random() - 0.5) * 0.2
        }
        particles.attributes.position.needsUpdate = true
      }
    })
  }

  increaseDifficulty(level) {
    this.spawnInterval = Math.max(500, 2000 - level * 100)
    this.lanes.forEach(lane => {
      lane.speed = lane.speed * (1 + level * 0.1)
    })
  }

  reset() {
    this.vehicles.forEach(vehicle => {
      if (vehicle.model) {
        this.scene.remove(vehicle.model)
      }
    })
    this.vehicles = []
    this.spawnTimer = 0
    this.spawnInterval = 2000
    this.initializeVehicles()
  }
}