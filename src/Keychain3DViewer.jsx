import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './Keychain3DViewer.css'

function parseSTL(stlString) {
  const lines = stlString.split('\n')
  const vertices = []
  const normals = []
  let currentNormal = null

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
          if (currentNormal) {
            normals.push(currentNormal.x, currentNormal.y, currentNormal.z)
          } else {
            normals.push(0, 0, 1)
          }
        }
      }
    } else if (line.startsWith('endfacet')) {
      currentNormal = null
    }
  }

  return { vertices, normals }
}

export default function Keychain3DViewer({ stlData, baseStlData, textStlData, baseColor = '#4a90e2', textColor = '#ffffff' }) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const baseMeshRef = useRef(null)
  const textMeshRef = useRef(null)

  useEffect(() => {
    let baseStl = null
    let textStl = null

    if (stlData && typeof stlData === 'object' && stlData.base && stlData.text) {
      baseStl = stlData.base
      textStl = stlData.text
    } else if (baseStlData && textStlData) {
      baseStl = baseStlData
      textStl = textStlData
    }

    if (!baseStl || !textStl || !containerRef.current) return

    const container = containerRef.current
    container.innerHTML = ''

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf1f5f9)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      1000
    )
    camera.position.set(0, 0, 50)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    scene.add(new THREE.AmbientLight(0xffffff, 0.65))

    const light1 = new THREE.DirectionalLight(0xffffff, 0.85)
    light1.position.set(10, 10, 5)
    scene.add(light1)

    const light2 = new THREE.DirectionalLight(0xffffff, 0.45)
    light2.position.set(-10, -8, -5)
    scene.add(light2)

    try {
      const baseData = parseSTL(baseStl)
      const textData = parseSTL(textStl)

      if (baseData.vertices.length === 0 || textData.vertices.length === 0) {
        throw new Error('STL vazio ou formato inválido')
      }

      const baseGeometry = new THREE.BufferGeometry()
      baseGeometry.setAttribute('position', new THREE.Float32BufferAttribute(baseData.vertices, 3))
      if (baseData.normals.length > 0) {
        baseGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(baseData.normals, 3))
      } else {
        baseGeometry.computeVertexNormals()
      }

      const textGeometry = new THREE.BufferGeometry()
      textGeometry.setAttribute('position', new THREE.Float32BufferAttribute(textData.vertices, 3))
      if (textData.normals.length > 0) {
        textGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(textData.normals, 3))
      } else {
        textGeometry.computeVertexNormals()
      }

      const combinedBox = new THREE.Box3()
      baseGeometry.computeBoundingBox()
      textGeometry.computeBoundingBox()
      combinedBox.union(baseGeometry.boundingBox)
      combinedBox.union(textGeometry.boundingBox)

      const center = new THREE.Vector3()
      combinedBox.getCenter(center)
      baseGeometry.translate(-center.x, -center.y, -center.z)
      textGeometry.translate(-center.x, -center.y, -center.z)

      const baseMaterial = new THREE.MeshStandardMaterial({
        color: parseInt(baseColor.replace('#', '0x'), 16),
        metalness: 0.25,
        roughness: 0.75
      })

      const textMaterial = new THREE.MeshStandardMaterial({
        color: parseInt(textColor.replace('#', '0x'), 16),
        metalness: 0.25,
        roughness: 0.75
      })

      const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial)
      const textMesh = new THREE.Mesh(textGeometry, textMaterial)
      scene.add(baseMesh)
      scene.add(textMesh)
      baseMeshRef.current = baseMesh
      textMeshRef.current = textMesh

      const box = new THREE.Box3().setFromObject(baseMesh).union(new THREE.Box3().setFromObject(textMesh))
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const fov = camera.fov * (Math.PI / 180)
      const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.55
      camera.position.set(0, 0, cameraZ)
      camera.lookAt(0, 0, 0)
    } catch (error) {
      console.error('Erro ao carregar STL:', error)
      const errorDiv = document.createElement('div')
      errorDiv.className = 'viewer-3d--loading'
      errorDiv.textContent = `Erro ao carregar modelo: ${error.message}`
      container.appendChild(errorDiv)
    }

    let isDragging = false
    let previousPointer = { x: 0, y: 0 }
    let rotationX = 0
    let rotationY = 0
    let pinchStartDistance = 0
    let pinchStartCameraZ = camera.position.z

    const applyRotation = () => {
      if (baseMeshRef.current) {
        baseMeshRef.current.rotation.y = rotationY
        baseMeshRef.current.rotation.x = rotationX
      }
      if (textMeshRef.current) {
        textMeshRef.current.rotation.y = rotationY
        textMeshRef.current.rotation.x = rotationX
      }
    }

    const clampZoom = (z) => Math.max(8, Math.min(250, z))

    const getTouchDistance = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.hypot(dx, dy)
    }

    const onPointerDown = (x, y) => {
      isDragging = true
      previousPointer = { x, y }
      container.style.cursor = 'grabbing'
    }

    const onPointerMove = (x, y) => {
      if (!isDragging || (!baseMeshRef.current && !textMeshRef.current)) return

      const deltaMove = { x: x - previousPointer.x, y: y - previousPointer.y }
      rotationY += deltaMove.x * 0.012
      rotationX += deltaMove.y * 0.012
      rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX))
      applyRotation()
      previousPointer = { x, y }
    }

    const onPointerUp = () => {
      isDragging = false
      container.style.cursor = 'grab'
    }

    const onMouseDown = (e) => onPointerDown(e.clientX, e.clientY)
    const onMouseMove = (e) => onPointerMove(e.clientX, e.clientY)
    const onWheel = (e) => {
      e.preventDefault()
      camera.position.z = clampZoom(camera.position.z + e.deltaY * 0.08)
      camera.lookAt(0, 0, 0)
    }

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY)
      } else if (e.touches.length === 2) {
        isDragging = false
        pinchStartDistance = getTouchDistance(e.touches)
        pinchStartCameraZ = camera.position.z
      }
    }

    const onTouchMove = (e) => {
      e.preventDefault()
      if (e.touches.length === 1 && isDragging) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY)
      } else if (e.touches.length === 2) {
        const distance = getTouchDistance(e.touches)
        if (pinchStartDistance > 0) {
          const scale = pinchStartDistance / distance
          camera.position.z = clampZoom(pinchStartCameraZ * scale)
          camera.lookAt(0, 0, 0)
        }
      }
    }

    const onTouchEnd = (e) => {
      if (e.touches.length === 0) {
        onPointerUp()
        pinchStartDistance = 0
      } else if (e.touches.length === 1) {
        isDragging = true
        previousPointer = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        pinchStartDistance = 0
      }
    }

    const canvas = renderer.domElement
    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onPointerUp)
    canvas.addEventListener('mouseleave', onPointerUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: true })
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: true })

    let animationId = 0
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      if (w === 0 || h === 0) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onPointerUp)
      canvas.removeEventListener('mouseleave', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchEnd)

      if (container.contains(canvas)) {
        container.removeChild(canvas)
      }
      renderer.dispose()
      baseMeshRef.current = null
      textMeshRef.current = null
    }
  }, [stlData, baseStlData, textStlData, baseColor, textColor])

  useEffect(() => {
    if (baseMeshRef.current?.material) {
      baseMeshRef.current.material.color.setHex(parseInt(baseColor.replace('#', '0x'), 16))
    }
    if (textMeshRef.current?.material) {
      textMeshRef.current.material.color.setHex(parseInt(textColor.replace('#', '0x'), 16))
    }
  }, [baseColor, textColor])

  const hasData = (stlData && typeof stlData === 'object' && stlData.base && stlData.text) ||
    (baseStlData && textStlData)

  if (!hasData) {
    return (
      <div className="viewer-3d viewer-3d--empty">
        <p>👁️ Visualização 3D</p>
        <p className="viewer-empty-hint">Toque em &quot;Gerar Visualização 3D&quot; para ver o modelo</p>
      </div>
    )
  }

  return (
    <div className="viewer-3d-wrap">
      <div ref={containerRef} className="viewer-3d">
        <div className="viewer-hint viewer-hint-mobile">
          👆 Um dedo: girar &nbsp;•&nbsp; 🤏 Dois dedos: zoom
        </div>
        <div className="viewer-hint viewer-hint-desktop">
          🖱️ Arraste para rotacionar &nbsp;•&nbsp; Scroll para zoom
        </div>
      </div>
      <p className="viewer-caption">
        Modelo gerado pelo OpenSCAD — gire para ver todos os lados
      </p>
    </div>
  )
}
