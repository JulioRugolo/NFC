import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function KeychainViewer({ config }) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)

  useEffect(() => {
    if (!config || !config.name || !containerRef.current) return

    // Calcula dimensões
    const textWidth = Math.max(config.name.length * config.fontSize * 0.6, 20)
    const textHeight = config.fontSize * 1.2
    const padding = config.edgeRadius * 2
    const totalWidth = textWidth + padding
    const totalHeight = textHeight + padding

    // Cria a cena
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf5f5f5)
    sceneRef.current = scene

    // Câmera
    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 0, 50)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight1.position.set(10, 10, 5)
    scene.add(directionalLight1)

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4)
    directionalLight2.position.set(-10, -10, -5)
    scene.add(directionalLight2)

    // Grupo principal
    const group = new THREE.Group()

    // 1. Base principal
    const baseGeometry = new THREE.BoxGeometry(totalWidth, totalHeight, config.thickness)
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x4a90e2 })
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial)
    baseMesh.position.z = config.thickness / 2
    group.add(baseMesh)

    // 2. Texto (simulado como caixa elevada)
    const textWidthActual = textWidth * 0.9
    const textHeightActual = textHeight * 0.7
    const textGeometry = new THREE.BoxGeometry(textWidthActual, textHeightActual, config.textThickness)
    const textMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3e50 })
    const textMesh = new THREE.Mesh(textGeometry, textMaterial)
    textMesh.position.set(0, 0, config.thickness + config.textThickness / 2)
    group.add(textMesh)

    // 3. Buraco do chaveiro (anel externo)
    const holeX = -totalWidth / 2 - config.keychainHoleOffset - 3
    const holeRadius = (config.keychainHoleSize + 3) / 2
    const holeGeometry = new THREE.CylinderGeometry(holeRadius, holeRadius, config.thickness, 32)
    const holeMaterial = new THREE.MeshStandardMaterial({ color: 0x4a90e2 })
    const holeMesh = new THREE.Mesh(holeGeometry, holeMaterial)
    holeMesh.rotation.x = Math.PI / 2
    holeMesh.position.set(holeX, 0, config.thickness / 2)
    group.add(holeMesh)

    // Buraco interno (mais escuro)
    const innerHoleRadius = config.keychainHoleSize / 2
    const innerHoleGeometry = new THREE.CylinderGeometry(innerHoleRadius, innerHoleRadius, config.thickness * 1.5, 32)
    const innerHoleMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    const innerHoleMesh = new THREE.Mesh(innerHoleGeometry, innerHoleMaterial)
    innerHoleMesh.rotation.x = Math.PI / 2
    innerHoleMesh.position.set(holeX, 0, config.thickness / 2)
    group.add(innerHoleMesh)

    // 4. Segunda linha se habilitada
    if (config.show2ndLine && config.line2) {
      const line2Width = Math.max(config.line2.length * config.fontSize * 0.6, 20)
      const line2Geometry = new THREE.BoxGeometry(line2Width + padding, totalHeight, config.thickness)
      const line2Mesh = new THREE.Mesh(line2Geometry, baseMaterial)
      line2Mesh.position.set(config.line2Offset, config.line2VerticalOffset, config.thickness / 2)
      group.add(line2Mesh)

      const line2TextGeometry = new THREE.BoxGeometry(line2Width * 0.9, textHeightActual, config.textThickness)
      const line2TextMesh = new THREE.Mesh(line2TextGeometry, textMaterial)
      line2TextMesh.position.set(
        config.line2Offset,
        config.line2VerticalOffset,
        config.thickness + config.textThickness / 2
      )
      group.add(line2TextMesh)
    }

    // 5. Caixa personalizada se configurada
    if (config.boxWidth > 0 && config.boxHeight > 0) {
      const boxGeometry = new THREE.BoxGeometry(config.boxWidth, config.boxHeight, config.thickness)
      const boxMaterial = new THREE.MeshStandardMaterial({ color: 0xe74c3c, transparent: true, opacity: 0.7 })
      const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial)
      boxMesh.position.set(config.boxXOffset, config.boxYOffset, config.thickness / 2)
      group.add(boxMesh)
    }

    scene.add(group)

    // Controles de rotação simples (mouse)
    let isDragging = false
    let previousMousePosition = { x: 0, y: 0 }

    const onMouseDown = (e) => {
      isDragging = true
    }

    const onMouseMove = (e) => {
      if (!isDragging) return

      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
      }

      group.rotation.y += deltaMove.x * 0.01
      group.rotation.x += deltaMove.y * 0.01

      previousMousePosition = {
        x: e.clientX,
        y: e.clientY
      }
    }

    const onMouseUp = () => {
      isDragging = false
    }

    const onWheel = (e) => {
      e.preventDefault()
      camera.position.z += e.deltaY * 0.1
      camera.position.z = Math.max(20, Math.min(100, camera.position.z))
      camera.lookAt(0, 0, 0)
    }

    renderer.domElement.addEventListener('mousedown', onMouseDown)
    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('mouseup', onMouseUp)
    renderer.domElement.addEventListener('wheel', onWheel)

    // Animação
    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    // Ajusta câmera quando redimensiona
    const handleResize = () => {
      if (!containerRef.current) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('mousedown', onMouseDown)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      renderer.domElement.removeEventListener('mouseup', onMouseUp)
      renderer.domElement.removeEventListener('wheel', onWheel)
      
      if (containerRef.current && renderer.domElement.parentNode) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [config])

  if (!config || !config.name) {
    return (
      <div style={{
        width: '100%',
        height: '400px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        background: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999'
      }}>
        Preencha o nome do chaveiro para ver a visualização
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '400px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        background: '#f5f5f5',
        position: 'relative',
        cursor: 'grab'
      }}
      onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
      onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
      onMouseLeave={(e) => e.currentTarget.style.cursor = 'grab'}
    >
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.6)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '0.85em',
        zIndex: 10
      }}>
        🖱️ Arraste para rotacionar • 🖱️ Scroll para zoom
      </div>
    </div>
  )
}
