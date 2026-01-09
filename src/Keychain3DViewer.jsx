import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// STL Loader para formato ASCII
function parseSTL(stlString) {
  const lines = stlString.split('\n')
  const vertices = []
  const normals = []
  let currentNormal = null
  let vertexCount = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (line.startsWith('facet normal')) {
      const parts = line.split(/\s+/)
      if (parts.length >= 5) {
        currentNormal = new THREE.Vector3(
          parseFloat(parts[2]),
          parseFloat(parts[3]),
          parseFloat(parts[4])
        )
      }
    } else if (line.startsWith('vertex')) {
      const parts = line.split(/\s+/)
      if (parts.length >= 4) {
        const x = parseFloat(parts[1])
        const y = parseFloat(parts[2])
        const z = parseFloat(parts[3])
        
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          vertices.push(x, y, z)
          vertexCount++
          
          // Adiciona normal para cada vértice
          if (currentNormal) {
            normals.push(currentNormal.x, currentNormal.y, currentNormal.z)
          } else {
            normals.push(0, 0, 1) // Normal padrão
          }
        }
      }
    } else if (line.startsWith('endfacet')) {
      currentNormal = null
    }
  }

  return { vertices, normals, vertexCount }
}

export default function Keychain3DViewer({ stlData }) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const meshRef = useRef(null)

  useEffect(() => {
    if (!stlData || !containerRef.current) return

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

    // Carrega o modelo STL
    try {
      const { vertices, normals } = parseSTL(stlData)
      
      if (vertices.length === 0) {
        throw new Error('STL vazio ou formato inválido')
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
      
      if (normals.length > 0) {
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
      } else {
        geometry.computeVertexNormals()
      }

      // Calcula o centro do modelo
      geometry.computeBoundingBox()
      const center = new THREE.Vector3()
      geometry.boundingBox.getCenter(center)
      geometry.translate(-center.x, -center.y, -center.z)

      const material = new THREE.MeshStandardMaterial({
        color: 0x4a90e2,
        metalness: 0.3,
        roughness: 0.7
      })

      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)
      meshRef.current = mesh

      // Ajusta a câmera para mostrar todo o modelo
      const box = new THREE.Box3().setFromObject(mesh)
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const fov = camera.fov * (Math.PI / 180)
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
      cameraZ *= 1.5 // Adiciona um pouco de espaço
      camera.position.set(0, 0, cameraZ)
      camera.lookAt(0, 0, 0)

    } catch (error) {
      console.error('Erro ao carregar STL:', error)
      // Mostra mensagem de erro na tela
      const errorDiv = document.createElement('div')
      errorDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: red; text-align: center;'
      errorDiv.textContent = `Erro ao carregar modelo: ${error.message}`
      containerRef.current.appendChild(errorDiv)
    }

    // Controles de rotação simples (mouse)
    let isDragging = false
    let previousMousePosition = { x: 0, y: 0 }
    let rotationX = 0
    let rotationY = 0

    const onMouseDown = (e) => {
      isDragging = true
      previousMousePosition = { x: e.clientX, y: e.clientY }
      containerRef.current.style.cursor = 'grabbing'
    }

    const onMouseMove = (e) => {
      if (!isDragging || !meshRef.current) return

      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
      }

      rotationY += deltaMove.x * 0.01
      rotationX += deltaMove.y * 0.01

      meshRef.current.rotation.y = rotationY
      meshRef.current.rotation.x = rotationX

      previousMousePosition = {
        x: e.clientX,
        y: e.clientY
      }
    }

    const onMouseUp = () => {
      isDragging = false
      containerRef.current.style.cursor = 'grab'
    }

    const onWheel = (e) => {
      e.preventDefault()
      camera.position.z += e.deltaY * 0.1
      camera.position.z = Math.max(10, Math.min(200, camera.position.z))
      camera.lookAt(0, 0, 0)
    }

    renderer.domElement.addEventListener('mousedown', onMouseDown)
    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('mouseup', onMouseUp)
    renderer.domElement.addEventListener('mouseleave', onMouseUp)
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
      renderer.domElement.removeEventListener('mouseleave', onMouseUp)
      renderer.domElement.removeEventListener('wheel', onWheel)
      
      if (containerRef.current && renderer.domElement.parentNode) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [stlData])

  if (!stlData) {
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
        Carregando modelo 3D...
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '500px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        background: '#f5f5f5',
        position: 'relative',
        cursor: 'grab',
        overflow: 'hidden'
      }}
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
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        🖱️ Arraste para rotacionar • 🖱️ Scroll para zoom
      </div>
    </div>
  )
}
