import * as THREE from 'three'

export default class SceneManager {
  constructor(container) {
    this.container = container
    this.scene = new THREE.Scene()
    this.setupRenderer()
    this.setupCamera()
    this.setupLighting()
    this.setupFog()
    this.setupSkybox()
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    this.container.appendChild(this.renderer.domElement)
  }

  setupCamera() {
    const aspect = window.innerWidth / window.innerHeight
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
    this.camera.position.set(0, 15, 20)
    this.camera.lookAt(0, 0, 0)
    
    this.cameraTarget = new THREE.Vector3(0, 0, 0)
    this.cameraOffset = new THREE.Vector3(0, 15, 20)
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.camera.left = -20
    directionalLight.shadow.camera.right = 20
    directionalLight.shadow.camera.top = 20
    directionalLight.shadow.camera.bottom = -20
    directionalLight.shadow.mapSize.width = 1024
    directionalLight.shadow.mapSize.height = 1024
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50
    this.scene.add(directionalLight)

    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B7355, 0.4)
    this.scene.add(hemisphereLight)
  }

  setupFog() {
    this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.02)
  }

  setupSkybox() {
    const skyGeometry = new THREE.SphereGeometry(400, 32, 32)
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x87CEEB,
      side: THREE.BackSide
    })
    const skybox = new THREE.Mesh(skyGeometry, skyMaterial)
    this.scene.add(skybox)

    const loader = new THREE.TextureLoader()
    const cloudTexture = this.generateCloudTexture()
    
    const cloudGeometry = new THREE.PlaneGeometry(100, 100)
    const cloudMaterial = new THREE.MeshBasicMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    })

    for (let i = 0; i < 5; i++) {
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial)
      cloud.position.set(
        Math.random() * 100 - 50,
        30 + Math.random() * 20,
        Math.random() * 100 - 50
      )
      cloud.rotation.x = Math.PI / 2
      this.scene.add(cloud)
    }
  }

  generateCloudTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const context = canvas.getContext('2d')
    
    const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    context.fillStyle = gradient
    context.fillRect(0, 0, 256, 256)
    
    return new THREE.CanvasTexture(canvas)
  }

  updateCameraPosition(target) {
    this.cameraTarget.lerp(target, 0.1)
    this.camera.position.x = this.cameraTarget.x + this.cameraOffset.x
    this.camera.position.y = this.cameraTarget.y + this.cameraOffset.y
    this.camera.position.z = this.cameraTarget.z + this.cameraOffset.z
    this.camera.lookAt(this.cameraTarget)
  }

  setCameraMode(mode) {
    switch(mode) {
      case 'follow':
        this.cameraOffset.set(0, 15, 20)
        break
      case 'top':
        this.cameraOffset.set(0, 30, 0.1)
        break
      case 'cinematic':
        this.cameraOffset.set(10, 10, 15)
        break
      case 'action':
        this.cameraOffset.set(-5, 8, 12)
        break
    }
  }

  handleResize() {
    const width = window.innerWidth
    const height = window.innerHeight
    
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  destroy() {
    this.renderer.dispose()
    this.container.removeChild(this.renderer.domElement)
  }
}