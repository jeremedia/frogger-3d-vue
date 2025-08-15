export default class PerformanceMonitor {
  constructor() {
    this.fps = 60
    this.frameCount = 0
    this.lastTime = performance.now()
    this.lastFpsUpdate = this.lastTime
    this.lowFpsThreshold = 30
    this.warningThreshold = 45
    this.debugMode = true
    
    this.metrics = {
      drawCalls: 0,
      triangles: 0,
      geometries: 0,
      textures: 0,
      particles: 0,
      lights: 0
    }
    
    if (this.debugMode) {
      this.createDebugPanel()
    }
  }

  createDebugPanel() {
    const panel = document.createElement('div')
    panel.id = 'fps-monitor'
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      border-radius: 5px;
      min-width: 200px;
    `
    document.body.appendChild(panel)
    this.panel = panel
    this.updatePanel()
  }

  update(renderer, scene) {
    this.frameCount++
    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastTime
    
    if (currentTime - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate))
      this.frameCount = 0
      this.lastFpsUpdate = currentTime
      
      if (this.fps < this.lowFpsThreshold) {
        console.warn(`⚠️ LOW FPS: ${this.fps}fps - Performance issues detected!`)
        this.logPerformanceMetrics(renderer, scene)
      } else if (this.fps < this.warningThreshold) {
        console.warn(`⚠️ FPS Warning: ${this.fps}fps`)
      }
      
      this.updateMetrics(renderer, scene)
      this.updatePanel()
    }
    
    this.lastTime = currentTime
    return deltaTime
  }

  updateMetrics(renderer, scene) {
    if (renderer && renderer.info) {
      this.metrics.drawCalls = renderer.info.render.calls
      this.metrics.triangles = renderer.info.render.triangles
      this.metrics.geometries = renderer.info.memory.geometries
      this.metrics.textures = renderer.info.memory.textures
    }
    
    if (scene) {
      this.metrics.lights = 0
      this.metrics.particles = 0
      
      scene.traverse((object) => {
        if (object.isLight) this.metrics.lights++
        if (object.isPoints) this.metrics.particles++
      })
    }
  }

  updatePanel() {
    if (!this.panel) return
    
    const fpsColor = this.fps >= 55 ? '#00ff00' : 
                     this.fps >= 30 ? '#ffff00' : '#ff0000'
    
    this.panel.innerHTML = `
      <div style="color: ${fpsColor}; font-size: 16px; font-weight: bold;">FPS: ${this.fps}</div>
      <div>Draw Calls: ${this.metrics.drawCalls}</div>
      <div>Triangles: ${this.metrics.triangles.toLocaleString()}</div>
      <div>Geometries: ${this.metrics.geometries}</div>
      <div>Textures: ${this.metrics.textures}</div>
      <div>Lights: ${this.metrics.lights}</div>
      <div>Particles: ${this.metrics.particles}</div>
    `
  }

  logPerformanceMetrics(renderer, scene) {
    console.group('🔍 Performance Diagnostics')
    console.log('FPS:', this.fps)
    console.log('Draw Calls:', this.metrics.drawCalls)
    console.log('Triangles:', this.metrics.triangles)
    console.log('Geometries in Memory:', this.metrics.geometries)
    console.log('Textures in Memory:', this.metrics.textures)
    console.log('Active Lights:', this.metrics.lights)
    console.log('Active Particle Systems:', this.metrics.particles)
    
    if (scene) {
      let meshCount = 0
      let totalVertices = 0
      
      scene.traverse((object) => {
        if (object.isMesh) {
          meshCount++
          if (object.geometry && object.geometry.attributes.position) {
            totalVertices += object.geometry.attributes.position.count
          }
        }
      })
      
      console.log('Total Meshes:', meshCount)
      console.log('Total Vertices:', totalVertices.toLocaleString())
    }
    
    console.groupEnd()
  }

  destroy() {
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel)
    }
  }
}