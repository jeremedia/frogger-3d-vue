import * as THREE from 'three'
import { gsap } from 'gsap'

export default class FrogController {
  constructor(scene, camera) {
    this.scene = scene
    this.camera = camera
    this.gridSize = 2
    this.isJumping = false
    this.position = { x: 0, y: 0, z: 8 }
    this.rotation = 0
    this.onPlatform = null
    this.powerUps = {
      speed: false,
      shield: false,
      doubleJump: false
    }
    
    this.createFrogModel()
    this.setupAnimations()
  }

  createFrogModel() {
    const frogGroup = new THREE.Group()
    
    const bodyGeometry = new THREE.SphereGeometry(0.8, 16, 16)
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x00FF00,
      emissive: 0x004400,
      emissiveIntensity: 0.2,
      shininess: 100
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.5
    body.castShadow = true
    body.receiveShadow = true
    frogGroup.add(body)
    
    const headGeometry = new THREE.SphereGeometry(0.6, 16, 16)
    const head = new THREE.Mesh(headGeometry, bodyMaterial)
    head.position.set(0, 1.2, 0.3)
    head.castShadow = true
    frogGroup.add(head)
    
    const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8)
    const eyeMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.3
    })
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    leftEye.position.set(-0.3, 1.4, 0.6)
    frogGroup.add(leftEye)
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    rightEye.position.set(0.3, 1.4, 0.6)
    frogGroup.add(rightEye)
    
    const pupilGeometry = new THREE.SphereGeometry(0.08, 8, 8)
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
    
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial)
    leftPupil.position.set(-0.3, 1.4, 0.7)
    frogGroup.add(leftPupil)
    
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial)
    rightPupil.position.set(0.3, 1.4, 0.7)
    frogGroup.add(rightPupil)
    
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.8)
    const legMaterial = new THREE.MeshPhongMaterial({
      color: 0x00CC00
    })
    
    const leftLegFront = new THREE.Mesh(legGeometry, legMaterial)
    leftLegFront.position.set(-0.4, 0.2, 0.3)
    leftLegFront.rotation.z = 0.2
    frogGroup.add(leftLegFront)
    
    const rightLegFront = new THREE.Mesh(legGeometry, legMaterial)
    rightLegFront.position.set(0.4, 0.2, 0.3)
    rightLegFront.rotation.z = -0.2
    frogGroup.add(rightLegFront)
    
    const leftLegBack = new THREE.Mesh(legGeometry, legMaterial)
    leftLegBack.position.set(-0.4, 0.2, -0.3)
    leftLegBack.rotation.z = 0.2
    frogGroup.add(leftLegBack)
    
    const rightLegBack = new THREE.Mesh(legGeometry, legMaterial)
    rightLegBack.position.set(0.4, 0.2, -0.3)
    rightLegBack.rotation.z = -0.2
    frogGroup.add(rightLegBack)
    
    if (this.powerUps.shield) {
      const shieldGeometry = new THREE.SphereGeometry(1.5, 32, 32)
      const shieldMaterial = new THREE.MeshPhongMaterial({
        color: 0x00FFFF,
        transparent: true,
        opacity: 0.3,
        emissive: 0x00FFFF,
        emissiveIntensity: 0.5
      })
      const shield = new THREE.Mesh(shieldGeometry, shieldMaterial)
      shield.position.y = 0.8
      frogGroup.add(shield)
      this.shield = shield
    }
    
    this.frogModel = frogGroup
    this.frogModel.position.set(this.position.x, this.position.y, this.position.z)
    this.scene.add(this.frogModel)
    
    this.body = body
    this.head = head
    this.leftEye = leftEye
    this.rightEye = rightEye
    this.legs = [leftLegFront, rightLegFront, leftLegBack, rightLegBack]
  }

  setupAnimations() {
    this.jumpTimeline = null
    this.idleAnimation = null
    this.startIdleAnimation()
  }

  startIdleAnimation() {
    if (this.idleAnimation) this.idleAnimation.kill()
    
    this.idleAnimation = gsap.timeline({ repeat: -1 })
    this.idleAnimation.to(this.body.scale, {
      x: 1.05,
      y: 0.95,
      z: 1.05,
      duration: 1,
      ease: "sine.inOut"
    })
    .to(this.body.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1,
      ease: "sine.inOut"
    })
  }

  handleInput(key) {
    if (this.isJumping && !this.powerUps.doubleJump) return
    
    let direction = null
    let targetRotation = this.frogModel.rotation.y
    
    switch(key.toLowerCase()) {
      case 'arrowup':
      case 'w':
        direction = { x: 0, z: -1 }
        targetRotation = 0
        break
      case 'arrowdown':
      case 's':
        direction = { x: 0, z: 1 }
        targetRotation = Math.PI
        break
      case 'arrowleft':
      case 'a':
        direction = { x: -1, z: 0 }
        targetRotation = Math.PI / 2
        break
      case 'arrowright':
      case 'd':
        direction = { x: 1, z: 0 }
        targetRotation = -Math.PI / 2
        break
    }
    
    if (direction) {
      this.jump(direction, targetRotation)
    }
  }

  jump(direction, targetRotation) {
    if (this.isJumping && !this.powerUps.doubleJump) return
    
    this.isJumping = true
    if (this.idleAnimation) this.idleAnimation.kill()
    
    const jumpDistance = this.powerUps.speed ? this.gridSize * 1.5 : this.gridSize
    const newX = this.position.x + direction.x * jumpDistance
    const newZ = this.position.z + direction.z * jumpDistance
    
    const jumpHeight = 2
    const jumpDuration = this.powerUps.speed ? 0.3 : 0.5
    
    if (this.jumpTimeline) this.jumpTimeline.kill()
    
    this.jumpTimeline = gsap.timeline({
      onComplete: () => {
        this.isJumping = false
        this.position.x = newX
        this.position.z = newZ
        this.startIdleAnimation()
      }
    })
    
    this.jumpTimeline.to(this.frogModel.rotation, {
      y: targetRotation,
      duration: 0.1,
      ease: "power2.out"
    }, 0)
    
    this.jumpTimeline.to(this.body.scale, {
      x: 0.7,
      y: 1.4,
      z: 0.7,
      duration: jumpDuration * 0.3,
      ease: "power2.out"
    }, 0)
    
    this.jumpTimeline.to(this.body.scale, {
      x: 1.3,
      y: 0.7,
      z: 1.3,
      duration: jumpDuration * 0.3,
      ease: "power2.in"
    }, jumpDuration * 0.3)
    
    this.jumpTimeline.to(this.body.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: jumpDuration * 0.4,
      ease: "power2.out"
    }, jumpDuration * 0.6)
    
    this.jumpTimeline.to(this.frogModel.position, {
      x: newX,
      z: newZ,
      duration: jumpDuration,
      ease: "power2.inOut"
    }, 0)
    
    this.jumpTimeline.to(this.frogModel.position, {
      y: jumpHeight,
      duration: jumpDuration * 0.5,
      ease: "power2.out"
    }, 0)
    
    this.jumpTimeline.to(this.frogModel.position, {
      y: 0,
      duration: jumpDuration * 0.5,
      ease: "power2.in"
    }, jumpDuration * 0.5)
    
    this.legs.forEach((leg, index) => {
      this.jumpTimeline.to(leg.rotation, {
        x: Math.PI * 0.3 * (index % 2 === 0 ? 1 : -1),
        duration: jumpDuration * 0.5,
        ease: "power2.out"
      }, 0)
      
      this.jumpTimeline.to(leg.rotation, {
        x: 0,
        duration: jumpDuration * 0.5,
        ease: "power2.in"
      }, jumpDuration * 0.5)
    })
  }

  activatePowerUp(type) {
    this.powerUps[type] = true
    
    if (type === 'shield') {
      this.addShieldEffect()
    }
    
    setTimeout(() => {
      this.powerUps[type] = false
      if (type === 'shield' && this.shield) {
        this.frogModel.remove(this.shield)
        this.shield = null
      }
    }, 10000)
  }

  addShieldEffect() {
    if (this.shield) return
    
    const shieldGeometry = new THREE.SphereGeometry(1.5, 32, 32)
    const shieldMaterial = new THREE.MeshPhongMaterial({
      color: 0x00FFFF,
      transparent: true,
      opacity: 0.3,
      emissive: 0x00FFFF,
      emissiveIntensity: 0.5,
      wireframe: true
    })
    this.shield = new THREE.Mesh(shieldGeometry, shieldMaterial)
    this.shield.position.y = 0.8
    this.frogModel.add(this.shield)
    
    gsap.to(this.shield.rotation, {
      y: Math.PI * 2,
      duration: 2,
      repeat: -1,
      ease: "none"
    })
  }

  takeDamage() {
    if (this.powerUps.shield) {
      this.powerUps.shield = false
      if (this.shield) {
        this.frogModel.remove(this.shield)
        this.shield = null
      }
      return false
    }
    return true
  }

  reset() {
    this.position = { x: 0, y: 0, z: 8 }
    this.frogModel.position.set(0, 0, 8)
    this.frogModel.rotation.y = 0
    this.isJumping = false
    this.powerUps = {
      speed: false,
      shield: false,
      doubleJump: false
    }
    if (this.shield) {
      this.frogModel.remove(this.shield)
      this.shield = null
    }
  }

  update(deltaTime) {
    this.animationTime = (this.animationTime || 0) + deltaTime * 0.005
    if (this.shield) {
      this.shield.material.opacity = 0.3 + Math.sin(this.animationTime) * 0.1
    }
  }

  getPosition() {
    return new THREE.Vector3(this.position.x, this.position.y, this.position.z)
  }

  getBoundingBox() {
    return new THREE.Box3(
      new THREE.Vector3(this.position.x - 0.8, 0, this.position.z - 0.8),
      new THREE.Vector3(this.position.x + 0.8, 2, this.position.z + 0.8)
    )
  }
}