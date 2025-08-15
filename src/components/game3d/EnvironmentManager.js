import * as THREE from 'three'
import { gsap } from 'gsap'

export default class EnvironmentManager {
  constructor(scene) {
    this.scene = scene
    this.logs = []
    this.lilyPads = []
    this.waterPlane = null
    this.roadSegments = []
    
    this.createGround()
    this.createRoad()
    this.createWater()
    this.createLogs()
    this.createLilyPads()
    this.createTrees()
    this.createGrass()
  }

  createGround() {
    const groundGeometry = new THREE.PlaneGeometry(50, 50)
    const groundMaterial = new THREE.MeshPhongMaterial({
      color: 0x7CBA01,
      roughness: 0.8
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.1
    ground.receiveShadow = true
    this.scene.add(ground)
  }

  createRoad() {
    const roadGeometry = new THREE.PlaneGeometry(50, 10)
    const roadTexture = this.createRoadTexture()
    const roadMaterial = new THREE.MeshPhongMaterial({
      map: roadTexture,
      roughness: 0.9
    })
    
    const road = new THREE.Mesh(roadGeometry, roadMaterial)
    road.rotation.x = -Math.PI / 2
    road.position.set(0, 0, 2)
    road.receiveShadow = true
    this.scene.add(road)
    
    for (let i = -20; i <= 20; i += 2) {
      const lineGeometry = new THREE.PlaneGeometry(0.3, 2)
      const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 })
      const line = new THREE.Mesh(lineGeometry, lineMaterial)
      line.rotation.x = -Math.PI / 2
      line.position.set(i, 0.01, 2)
      this.scene.add(line)
    }
  }

  createRoadTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const context = canvas.getContext('2d')
    
    context.fillStyle = '#333333'
    context.fillRect(0, 0, 512, 512)
    
    context.fillStyle = '#555555'
    for (let i = 0; i < 512; i += 32) {
      for (let j = 0; j < 512; j += 32) {
        if ((i + j) % 64 === 0) {
          context.fillRect(i, j, 16, 16)
        }
      }
    }
    
    return new THREE.CanvasTexture(canvas)
  }

  createWater() {
    const waterGeometry = new THREE.PlaneGeometry(50, 8)
    const waterMaterial = new THREE.MeshPhongMaterial({
      color: 0x006994,
      transparent: true,
      opacity: 0.8,
      shininess: 100
    })
    
    this.waterPlane = new THREE.Mesh(waterGeometry, waterMaterial)
    this.waterPlane.rotation.x = -Math.PI / 2
    this.waterPlane.position.set(0, -0.05, -6)
    this.waterPlane.receiveShadow = true
    this.scene.add(this.waterPlane)
    
    this.createWaterWaves()
  }

  createWaterWaves() {
    const waveCount = 20
    for (let i = 0; i < waveCount; i++) {
      const waveGeometry = new THREE.PlaneGeometry(2, 0.5)
      const waveMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.3
      })
      
      const wave = new THREE.Mesh(waveGeometry, waveMaterial)
      wave.rotation.x = -Math.PI / 2
      wave.position.set(
        Math.random() * 40 - 20,
        0.05,
        -6 + Math.random() * 6 - 3
      )
      
      this.scene.add(wave)
      
      gsap.to(wave.position, {
        x: wave.position.x + (Math.random() > 0.5 ? 10 : -10),
        duration: 5 + Math.random() * 5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      })
      
      gsap.to(wave.material, {
        opacity: 0.1,
        duration: 2,
        repeat: -1,
        yoyo: true
      })
    }
  }

  createLogs() {
    const logLanes = [
      { z: -4, direction: 1, speed: 1, count: 3 },
      { z: -6, direction: -1, speed: 1.5, count: 3 },
      { z: -8, direction: 1, speed: 2, count: 3 }
    ]
    
    logLanes.forEach(lane => {
      for (let i = 0; i < lane.count; i++) {
        const log = this.createLogModel()
        const startX = -20 + i * 15
        log.position.set(startX, 0.2, lane.z)
        this.scene.add(log)
        
        this.logs.push({
          model: log,
          speed: lane.speed,
          direction: lane.direction,
          lane: lane.z
        })
      }
    })
  }

  createLogModel() {
    const logGroup = new THREE.Group()
    
    const logGeometry = new THREE.CylinderGeometry(0.8, 1, 6, 8)
    const logTexture = this.createWoodTexture()
    const logMaterial = new THREE.MeshPhongMaterial({
      map: logTexture,
      color: 0x8B4513
    })
    
    const log = new THREE.Mesh(logGeometry, logMaterial)
    log.rotation.z = Math.PI / 2
    log.castShadow = true
    log.receiveShadow = true
    logGroup.add(log)
    
    const endCapGeometry = new THREE.CircleGeometry(0.8, 16)
    const endCapMaterial = new THREE.MeshPhongMaterial({
      map: this.createWoodRingTexture(),
      color: 0x654321
    })
    
    const leftCap = new THREE.Mesh(endCapGeometry, endCapMaterial)
    leftCap.rotation.y = Math.PI / 2
    leftCap.position.x = -3
    logGroup.add(leftCap)
    
    const rightCap = new THREE.Mesh(endCapGeometry, endCapMaterial)
    rightCap.rotation.y = -Math.PI / 2
    rightCap.position.x = 3
    logGroup.add(rightCap)
    
    return logGroup
  }

  createWoodTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const context = canvas.getContext('2d')
    
    const gradient = context.createLinearGradient(0, 0, 256, 0)
    gradient.addColorStop(0, '#8B4513')
    gradient.addColorStop(0.5, '#A0522D')
    gradient.addColorStop(1, '#8B4513')
    
    context.fillStyle = gradient
    context.fillRect(0, 0, 256, 256)
    
    context.strokeStyle = '#654321'
    context.lineWidth = 2
    for (let i = 0; i < 256; i += 20) {
      context.beginPath()
      context.moveTo(0, i)
      context.lineTo(256, i)
      context.stroke()
    }
    
    return new THREE.CanvasTexture(canvas)
  }

  createWoodRingTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const context = canvas.getContext('2d')
    
    context.fillStyle = '#8B4513'
    context.fillRect(0, 0, 256, 256)
    
    context.strokeStyle = '#654321'
    context.lineWidth = 2
    
    for (let r = 20; r < 128; r += 20) {
      context.beginPath()
      context.arc(128, 128, r, 0, Math.PI * 2)
      context.stroke()
    }
    
    return new THREE.CanvasTexture(canvas)
  }

  createLilyPads() {
    const lilyPadPositions = [
      { x: -8, z: -12 },
      { x: -4, z: -12 },
      { x: 0, z: -12 },
      { x: 4, z: -12 },
      { x: 8, z: -12 }
    ]
    
    lilyPadPositions.forEach((pos, index) => {
      const lilyPad = this.createLilyPadModel()
      lilyPad.position.set(pos.x, 0.1, pos.z)
      this.scene.add(lilyPad)
      
      this.lilyPads.push({
        model: lilyPad,
        occupied: false,
        index: index
      })
      
      const glowLight = new THREE.PointLight(0xFFD700, 0.5, 5)
      glowLight.position.set(pos.x, 1, pos.z)
      this.scene.add(glowLight)
      
      gsap.to(glowLight, {
        intensity: 1,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      })
    })
  }

  createLilyPadModel() {
    const lilyPadGroup = new THREE.Group()
    
    const padGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.2, 16)
    const padMaterial = new THREE.MeshPhongMaterial({
      color: 0x228B22,
      emissive: 0x00FF00,
      emissiveIntensity: 0.1
    })
    
    const pad = new THREE.Mesh(padGeometry, padMaterial)
    pad.castShadow = true
    pad.receiveShadow = true
    lilyPadGroup.add(pad)
    
    const flowerGeometry = new THREE.SphereGeometry(0.3, 8, 8)
    const flowerMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
      emissive: 0xFFFF00,
      emissiveIntensity: 0.3
    })
    
    const flower = new THREE.Mesh(flowerGeometry, flowerMaterial)
    flower.position.y = 0.3
    lilyPadGroup.add(flower)
    
    const petalGeometry = new THREE.CircleGeometry(0.2, 8)
    const petalMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFB6C1,
      side: THREE.DoubleSide
    })
    
    for (let i = 0; i < 6; i++) {
      const petal = new THREE.Mesh(petalGeometry, petalMaterial)
      const angle = (i / 6) * Math.PI * 2
      petal.position.set(
        Math.cos(angle) * 0.4,
        0.3,
        Math.sin(angle) * 0.4
      )
      petal.rotation.x = -Math.PI / 4
      petal.rotation.z = angle
      lilyPadGroup.add(petal)
    }
    
    return lilyPadGroup
  }

  createTrees() {
    const treePositions = [
      { x: -15, z: 10 },
      { x: 15, z: 10 },
      { x: -12, z: -15 },
      { x: 12, z: -15 },
      { x: -18, z: 0 },
      { x: 18, z: 0 }
    ]
    
    treePositions.forEach(pos => {
      const tree = this.createTreeModel()
      tree.position.set(pos.x, 0, pos.z)
      tree.scale.set(1 + Math.random() * 0.5, 1 + Math.random() * 0.5, 1 + Math.random() * 0.5)
      tree.rotation.y = Math.random() * Math.PI * 2
      this.scene.add(tree)
    })
  }

  createTreeModel() {
    const treeGroup = new THREE.Group()
    
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 3)
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 })
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
    trunk.position.y = 1.5
    trunk.castShadow = true
    treeGroup.add(trunk)
    
    const leavesGeometry = new THREE.ConeGeometry(2, 4, 8)
    const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 })
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial)
    leaves.position.y = 4
    leaves.castShadow = true
    treeGroup.add(leaves)
    
    const topLeavesGeometry = new THREE.ConeGeometry(1.5, 3, 8)
    const topLeaves = new THREE.Mesh(topLeavesGeometry, leavesMaterial)
    topLeaves.position.y = 6
    topLeaves.castShadow = true
    treeGroup.add(topLeaves)
    
    return treeGroup
  }

  createGrass() {
    const grassCount = 100
    for (let i = 0; i < grassCount; i++) {
      const grassBlade = this.createGrassBlade()
      grassBlade.position.set(
        Math.random() * 40 - 20,
        0,
        Math.random() * 40 - 20
      )
      
      if (Math.abs(grassBlade.position.z - 2) > 5 && 
          Math.abs(grassBlade.position.z + 6) > 4) {
        this.scene.add(grassBlade)
      }
    }
  }

  createGrassBlade() {
    const bladeGeometry = new THREE.ConeGeometry(0.05, 0.5, 4)
    const bladeMaterial = new THREE.MeshBasicMaterial({ 
      color: new THREE.Color(0.2 + Math.random() * 0.1, 0.5 + Math.random() * 0.2, 0.1)
    })
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial)
    blade.position.y = 0.25
    return blade
  }

  update(deltaTime) {
    this.logs.forEach(log => {
      log.model.position.x += log.direction * log.speed * deltaTime * 0.001
      
      if (log.direction > 0 && log.model.position.x > 25) {
        log.model.position.x = -25
      } else if (log.direction < 0 && log.model.position.x < -25) {
        log.model.position.x = 25
      }
      
      log.model.rotation.x += deltaTime * 0.0005
    })
    
    if (this.waterPlane) {
      this.waterPlane.material.opacity = 0.7 + Math.sin(Date.now() * 0.001) * 0.1
    }
  }

  checkLogCollision(playerPosition) {
    for (let log of this.logs) {
      const logBox = new THREE.Box3().setFromObject(log.model)
      const playerPoint = new THREE.Vector3(playerPosition.x, playerPosition.y + 0.5, playerPosition.z)
      
      if (logBox.containsPoint(playerPoint)) {
        return log
      }
    }
    return null
  }

  checkWaterCollision(playerPosition) {
    return playerPosition.z < -3 && playerPosition.z > -9
  }

  checkLilyPadReached(playerPosition) {
    for (let lilyPad of this.lilyPads) {
      if (!lilyPad.occupied) {
        const distance = Math.sqrt(
          Math.pow(playerPosition.x - lilyPad.model.position.x, 2) +
          Math.pow(playerPosition.z - lilyPad.model.position.z, 2)
        )
        
        if (distance < 1.5) {
          lilyPad.occupied = true
          this.celebrateLilyPad(lilyPad.model.position)
          return lilyPad.index
        }
      }
    }
    return -1
  }

  celebrateLilyPad(position) {
    const particleCount = 50
    const particles = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      positions[i3] = position.x
      positions[i3 + 1] = position.y + 1
      positions[i3 + 2] = position.z
      
      colors[i3] = 1
      colors[i3 + 1] = 0.8
      colors[i3 + 2] = 0
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    })
    
    const particleSystem = new THREE.Points(particles, particleMaterial)
    this.scene.add(particleSystem)
    
    gsap.to(positions, {
      duration: 2,
      onUpdate: () => {
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += (Math.random() - 0.5) * 0.3
          positions[i + 1] += Math.random() * 0.2
          positions[i + 2] += (Math.random() - 0.5) * 0.3
        }
        particles.attributes.position.needsUpdate = true
      }
    })
    
    gsap.to(particleSystem.material, {
      opacity: 0,
      duration: 2,
      onComplete: () => {
        this.scene.remove(particleSystem)
      }
    })
  }

  reset() {
    this.lilyPads.forEach(lilyPad => {
      lilyPad.occupied = false
    })
  }
}