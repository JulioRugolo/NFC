import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './ConfigPage.css'
import * as THREE from 'three'
import JSZip from 'jszip'
import Keychain3DViewer from './Keychain3DViewer'

function KeychainPage() {
  const navigate = useNavigate()
  
  const [keychainConfig, setKeychainConfig] = useState({
    name: 'Name',
    line2: 'Line2',
    show2ndLine: true,
    faceDownMode: false,
    fontSize: 15,
    line2Offset: 0,
    line2VerticalOffset: -15,
    thickness: 2,
    textThickness: 1,
    keychainHoleSize: 4,
    keychainHoleOffset: 1,
    edgeRadius: 3,
    boxWidth: 0,
    boxHeight: 0,
    boxXOffset: 0,
    boxYOffset: -30,
    font: 'Chewy',
    fontStyle: 'Black Italic',
    baseColor: '#4a90e2', // Azul padrão
    textColor: '#ffffff'   // Branco padrão
  })

  const [previewImage, setPreviewImage] = useState(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [stlData, setStlData] = useState(null)
  const [isGenerating3D, setIsGenerating3D] = useState(false)

  const fonts = [
    'Inter', 'Rubik', 'Open Sans', 'Inter Tight', 'Source Sans 3', 'Noto Emoji',
    'Ubuntu Sans', 'Roboto Slab', 'Plus Jakarta Sans', 'Roboto Serif', 'HarmonyOS Sans',
    'Roboto Flex', 'Roboto Mono', 'Playfair Display', 'Merriweather Sans', 'Noto Sans SC',
    'Work Sans', 'Ubuntu Sans Mono', 'Raleway', 'Nunito Sans', 'Montserrat', 'Roboto',
    'Roboto Condensed', 'Open Sans Condensed', 'Oswald', 'Noto Sans', 'Nunito', 'Chewy'
  ]

  const fontStyles = [
    'Black Italic', 'Thin', 'Bold', 'Medium', 'Thin Italic', 'Regular', 'Medium Italic',
    'Bold Italic', 'ExtraBold Italic', 'ExtraBold', 'Light Italic', 'SemiBold Italic',
    'Light', 'ExtraLight Italic', 'ExtraLight', 'SemiBold', 'Black', 'Italic'
  ]

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    setKeychainConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
    }))
  }

  // Converte cor hex para RGB 0-1 (formato OpenSCAD)
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ] : [0, 0, 0]
  }

  const generateOpenSCAD = () => {
    const { name, line2, show2ndLine, faceDownMode, fontSize, thickness, textThickness,
            keychainHoleSize, keychainHoleOffset, edgeRadius, line2Offset, line2VerticalOffset,
            boxWidth, boxHeight, boxXOffset, boxYOffset, font, fontStyle, baseColor, textColor } = keychainConfig
    
    const baseRgb = hexToRgb(baseColor)
    const textRgb = hexToRgb(textColor)

    return `// Parameters
$fn = 100;
name = "${name}"; // Change this to the desired name
line2 = "${line2}"; // Change this to the desired second line text
2ndline = ${show2ndLine};
facedownmode = ${faceDownMode};
fontSize = ${fontSize};       // Font size for the name
line2Offset = ${line2Offset};    // Offset for the second line horizontally
line2VerticalOffset = ${line2VerticalOffset}; // Vertical offset for the second line
thickness = ${thickness};       // Thickness of the base
textThickness = ${textThickness};

keychainHoleSize = ${keychainHoleSize}; // Diameter of the keychain hole
keychainHoleOffset = ${keychainHoleOffset};// Offset of the keychain hole from the left
// Radius of edge, Increase to fill in gaps
r = ${edgeRadius};

// Box customization parameters
boxWidth = ${boxWidth};      // Width of the box
boxHeight = ${boxHeight};     // Height of the box
boxXOffset = ${boxXOffset};     // Horizontal offset for the box
boxYOffset = ${boxYOffset};   // Vertical offset for the box

Font = "${font}"; // [Inter, Rubik, Open Sans, Inter Tight, Source Sans 3, Noto Emoji, Ubuntu Sans, Roboto Slab, Plus Jakarta Sans, Roboto Serif, HarmonyOS Sans, Roboto Flex, Roboto Mono, Playfair Display, Merriweather Sans, Noto Sans SC, Work Sans, Ubuntu Sans Mono, Raleway, Nunito Sans, Montserrat, Roboto, Roboto Condensed, Open Sans Condensed, Oswald, Noto Sans, Nunito]
FontStyle = "${fontStyle}"; // [Black Italic, Thin, Bold, Medium, Thin Italic, Regular, Medium Italic, Bold Italic, ExtraBold Italic, ExtraBold, Light Italic, SemiBold Italic, Light, ExtraLight Italic, ExtraLight, SemiBold, Black, Italic]
font = str(Font , ":style=", FontStyle);

// Colors (RGB 0-1)
baseColor = [${baseRgb[0]}, ${baseRgb[1]}, ${baseRgb[2]}];
textColor = [${textRgb[0]}, ${textRgb[1]}, ${textRgb[2]}];

module keychain(name, line2, fontSize, thickness, textThickness, keychainHoleSize, keychainHoleOffset, font, 2ndline, line2Offset, line2VerticalOffset, boxWidth, boxHeight, boxXOffset, boxYOffset, baseColor, textColor) {
    // Create the background "bubble" for the first line
    color(baseColor) translate([0, 0, 0])
        linear_extrude(height = thickness)
            offset(r = r)
                text(name, size = fontSize, valign = "center", halign = "left", font = font);

    // Create the background "bubble" for the second line if 2ndline is true
    if (2ndline) {
        color(baseColor) translate([line2Offset, line2VerticalOffset, 0])
            linear_extrude(height = thickness)
                offset(r = r)
                    text(line2, size = fontSize, valign = "center", halign = "left", font = font);
    }

    // Extrude the text for the first line
    if (facedownmode){
          color(textColor) translate([0, 0, thickness])
        linear_extrude(height = 0.1)
            text(name, size = fontSize, valign = "center", halign = "left", font = font);  
    } else{
           color(textColor) translate([0, 0, thickness])
        linear_extrude(height = textThickness)
            text(name, size = fontSize, valign = "center", halign = "left", font = font);
    }

    // Extrude the text for the second line if 2ndline is true
    if (2ndline) {
        
        if(facedownmode){
            color(textColor) translate([line2Offset, line2VerticalOffset, thickness])
            linear_extrude(height = 0.1)
                text(line2, size = fontSize, valign = "center", halign = "left", font = font);
        }else{
            color(textColor) translate([line2Offset, line2VerticalOffset, thickness])
            linear_extrude(height = textThickness)
                text(line2, size = fontSize, valign = "center", halign = "left", font = font);
        }
    }
    
    // Add the customizable box
    color(baseColor) translate([boxXOffset, boxYOffset, 0])
        linear_extrude(height = thickness)
            square([boxWidth, boxHeight], center = false);

    difference() {
        // Add the keychain hole
        color(baseColor) union() {
            translate([-keychainHoleOffset - 3, 0, 0]) {
                cylinder(h = thickness, d = keychainHoleSize + 3, center = false);
            }
            translate([-keychainHoleOffset - 4, -keychainHoleSize / 2 - 1.25, 0]){
                cube(size = [7 + keychainHoleOffset, keychainHoleSize + 2.5, thickness], center = false);
            }
        }
        translate([-keychainHoleOffset - 3, 0, 0]) {
            cylinder(h = thickness, d = keychainHoleSize, center = false);
        }
    }
}

// Main call
keychain(name, line2, fontSize, thickness, textThickness, keychainHoleSize, keychainHoleOffset, font, 2ndline, line2Offset, line2VerticalOffset, boxWidth, boxHeight, boxXOffset, boxYOffset, baseColor, textColor);
`
  }

  const downloadSCAD = () => {
    const code = generateOpenSCAD()
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `keychain_${keychainConfig.name || 'personalizado'}.scad`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = () => {
    const code = generateOpenSCAD()
    navigator.clipboard.writeText(code).then(() => {
      alert('Código OpenSCAD copiado para a área de transferência!')
    }).catch(() => {
      const textArea = document.createElement('textarea')
      textArea.value = code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('Código OpenSCAD copiado para a área de transferência!')
    })
  }

  const geometryToVerticesAndTriangles = (geometry) => {
    const vertices = []
    const vertexMap = new Map()
    const triangles = []
    let vertexIndex = 0
    
    geometry.computeVertexNormals()
    
    const positions = geometry.attributes.position
    const indices = geometry.index ? geometry.index.array : null
    
    const getOrAddVertex = (x, y, z) => {
      const key = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`
      if (vertexMap.has(key)) {
        return vertexMap.get(key)
      }
      vertices.push(x, y, z)
      vertexMap.set(key, vertexIndex)
      return vertexIndex++
    }
    
    // Se tem índices, usa eles
    if (indices) {
      for (let i = 0; i < indices.length; i += 3) {
        const idx0 = indices[i]
        const idx1 = indices[i + 1]
        const idx2 = indices[i + 2]
        
        const x0 = positions.array[idx0 * 3]
        const y0 = positions.array[idx0 * 3 + 1]
        const z0 = positions.array[idx0 * 3 + 2]
        
        const x1 = positions.array[idx1 * 3]
        const y1 = positions.array[idx1 * 3 + 1]
        const z1 = positions.array[idx1 * 3 + 2]
        
        const x2 = positions.array[idx2 * 3]
        const y2 = positions.array[idx2 * 3 + 1]
        const z2 = positions.array[idx2 * 3 + 2]
        
        const v0 = getOrAddVertex(x0, y0, z0)
        const v1 = getOrAddVertex(x1, y1, z1)
        const v2 = getOrAddVertex(x2, y2, z2)
        
        triangles.push(v0, v1, v2)
      }
    } else {
      // Sem índices, assume que são triângulos sequenciais
      for (let i = 0; i < positions.count; i += 3) {
        const x0 = positions.array[i * 3]
        const y0 = positions.array[i * 3 + 1]
        const z0 = positions.array[i * 3 + 2]
        
        const x1 = positions.array[(i + 1) * 3]
        const y1 = positions.array[(i + 1) * 3 + 1]
        const z1 = positions.array[(i + 1) * 3 + 2]
        
        const x2 = positions.array[(i + 2) * 3]
        const y2 = positions.array[(i + 2) * 3 + 1]
        const z2 = positions.array[(i + 2) * 3 + 2]
        
        const v0 = getOrAddVertex(x0, y0, z0)
        const v1 = getOrAddVertex(x1, y1, z1)
        const v2 = getOrAddVertex(x2, y2, z2)
        
        triangles.push(v0, v1, v2)
      }
    }
    
    return { vertices, triangles }
  }

  const generate3DModel = async () => {
    try {
      if (!keychainConfig.name) {
        alert('Por favor, preencha o nome do chaveiro primeiro!')
        return
      }

      setIsGenerating3D(true)
      setStlData(null)

      const API_URL = import.meta.env.VITE_API_URL || 
        (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001')
      
      const response = await fetch(`${API_URL}/api/generate-3d-model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(keychainConfig)
      })

      if (!response.ok) {
        let errorMessage = 'Erro ao gerar modelo 3D'
        
        try {
          const error = await response.json()
          errorMessage = error.message || error.error || errorMessage
        } catch (e) {
          const text = await response.text()
          errorMessage = text || errorMessage
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (data.success && data.stl) {
        // Decodifica o STL de base64 para string
        const stlString = atob(data.stl)
        setStlData(stlString)
      } else {
        throw new Error('Resposta inválida do servidor')
      }

    } catch (error) {
      console.error('Erro ao gerar modelo 3D:', error)
      alert(`Erro ao gerar modelo 3D: ${error.message}\n\nCertifique-se de que o servidor backend está rodando.`)
    } finally {
      setIsGenerating3D(false)
    }
  }

  const generatePreview = async () => {
    try {
      if (!keychainConfig.name) {
        alert('Por favor, preencha o nome do chaveiro primeiro!')
        return
      }

      setIsGeneratingPreview(true)
      setPreviewImage(null)

      const API_URL = import.meta.env.VITE_API_URL || 
        (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001')
      
      const response = await fetch(`${API_URL}/api/generate-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(keychainConfig)
      })

      if (!response.ok) {
        let errorMessage = 'Erro ao gerar visualização'
        
        try {
          const error = await response.json()
          errorMessage = error.message || error.error || errorMessage
        } catch (e) {
          const text = await response.text()
          errorMessage = text || errorMessage
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (data.success && data.image) {
        setPreviewImage(data.image)
      } else {
        throw new Error('Resposta inválida do servidor')
      }

    } catch (error) {
      console.error('Erro ao gerar preview:', error)
      alert(`Erro ao gerar visualização: ${error.message}\n\nCertifique-se de que o servidor backend está rodando.`)
    } finally {
      setIsGeneratingPreview(false)
    }
  }

  const generate3MF = async () => {
    try {
      if (!keychainConfig.name) {
        alert('Por favor, preencha o nome do chaveiro primeiro!')
        return
      }

      // Chama o backend para gerar SCAD, abrir no OpenSCAD e exportar 3MF
      // Em produção, usa a mesma URL do frontend (Railway)
      const API_URL = import.meta.env.VITE_API_URL || 
        (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001')
      
      // Mostra mensagem informativa
      const userConfirmed = confirm(
        'O sistema irá:\n' +
        '1. Gerar o arquivo .scad\n' +
        '2. Abrir no OpenSCAD\n' +
        '3. Renderizar e exportar como 3MF automaticamente\n\n' +
        'O OpenSCAD será aberto e o arquivo 3MF será baixado em alguns segundos.\n\n' +
        'Continuar?'
      )
      
      if (!userConfirmed) return
      
      const response = await fetch(`${API_URL}/api/generate-and-export-3mf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(keychainConfig)
      })

      // Verifica o tipo de conteúdo da resposta
      const contentType = response.headers.get('content-type') || ''
      
      if (!response.ok) {
        let errorMessage = 'Erro ao gerar arquivo 3MF'
        let errorHint = ''
        
        // Lê o erro como texto primeiro para não bloquear o body
        const errorText = await response.text()
        
        try {
          const error = JSON.parse(errorText)
          errorMessage = error.message || error.error || errorMessage
          errorHint = error.hint || ''
        } catch (e) {
          errorMessage = errorText || errorMessage
        }
        
        throw new Error(errorMessage + (errorHint ? `\n\n${errorHint}` : ''))
      }

      // Se chegou aqui, a resposta está OK - baixa o arquivo
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `keychain_${keychainConfig.name.replace(/\s+/g, '_') || 'personalizado'}.3mf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      alert('✅ Arquivo 3MF gerado com sucesso!\n\nO OpenSCAD foi aberto com o modelo. O arquivo 3MF foi baixado automaticamente.')
      return
    } catch (error) {
      console.error('Erro ao gerar 3MF:', error)
      
      // Se o backend não estiver disponível, mostra mensagem
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        alert('⚠️ Servidor backend não está rodando!\n\nPara gerar o arquivo 3MF:\n1. Execute: npm run server\n2. Ou use o arquivo .scad no OpenSCAD')
      } else {
        alert(`Erro ao gerar arquivo 3MF: ${error.message}\n\nCertifique-se de que o OpenSCAD está instalado.`)
      }
    }
  }

  // Função antiga (mantida como fallback, mas não será usada se o backend funcionar)
  const generate3MF_old = async () => {
    try {
      if (!keychainConfig.name) {
        alert('Por favor, preencha o nome do chaveiro primeiro!')
        return
      }

      // IMPORTANTE: O arquivo 3MF gerado aqui é uma aproximação simplificada.
      // Para o modelo completo com texto renderizado, use o arquivo .scad no OpenSCAD
      // e exporte de lá para 3MF.

      // Cria a geometria do chaveiro usando Three.js
      const allVertices = []
      const allTriangles = []
      let globalVertexIndex = 0
      
      // Calcula dimensões aproximadas baseadas no texto
      const textWidth = Math.max(keychainConfig.name.length * keychainConfig.fontSize * 0.6, 20)
      const textHeight = keychainConfig.fontSize * 1.2
      const padding = keychainConfig.edgeRadius * 2
      const totalWidth = textWidth + padding
      const totalHeight = textHeight + padding
      
      // Posição do buraco do chaveiro
      const holeX = -totalWidth / 2 - keychainConfig.keychainHoleOffset - 3
      const holeY = 0
      const holeZ = 0
      const holeRadius = keychainConfig.keychainHoleSize / 2
      const holeOuterRadius = holeRadius + 1.5
      
      // 1. Base principal do chaveiro (retângulo com buraco)
      // Criamos manualmente a geometria da base com o buraco
      const baseWidth = totalWidth
      const baseHeight = totalHeight
      const baseThickness = keychainConfig.thickness
      
      // Cria vértices da base retangular com buraco
      const baseVerts = []
      const baseTris = []
      
      // Vértices do retângulo externo
      const halfW = baseWidth / 2
      const halfH = baseHeight / 2
      
      // Vértices da base (8 vértices do paralelepípedo)
      const baseCorners = [
        [-halfW, -halfH, 0], [halfW, -halfH, 0], [halfW, halfH, 0], [-halfW, halfH, 0], // bottom
        [-halfW, -halfH, baseThickness], [halfW, -halfH, baseThickness], [halfW, halfH, baseThickness], [-halfW, halfH, baseThickness] // top
      ]
      
      // Adiciona vértices da base
      baseCorners.forEach(corner => {
        baseVerts.push(...corner)
      })
      
      // Triângulos da base (sem o buraco por enquanto - simplificado)
      // Face inferior
      baseTris.push(0, 1, 2, 0, 2, 3)
      // Face superior
      baseTris.push(4, 7, 6, 4, 6, 5)
      // Faces laterais
      baseTris.push(0, 4, 5, 0, 5, 1) // frente
      baseTris.push(2, 6, 7, 2, 7, 3) // trás
      baseTris.push(0, 3, 7, 0, 7, 4) // esquerda
      baseTris.push(1, 5, 6, 1, 6, 2) // direita
      
      // Adiciona a base
      allVertices.push(...baseVerts)
      allTriangles.push(...baseTris.map(t => t + globalVertexIndex))
      globalVertexIndex += baseVerts.length / 3
      
      // 2. Texto (simulado como uma placa elevada)
      const textWidthActual = textWidth * 0.9
      const textHeightActual = textHeight * 0.7
      const textGeometry = new THREE.BoxGeometry(
        textWidthActual,
        textHeightActual,
        keychainConfig.textThickness
      )
      const textMesh = new THREE.Mesh(textGeometry)
      textMesh.position.set(0, 0, keychainConfig.thickness)
      textMesh.updateMatrixWorld()
      
      textGeometry.applyMatrix4(textMesh.matrixWorld)
      const { vertices: textVerts, triangles: textTris } = geometryToVerticesAndTriangles(textGeometry)
      const textVertexCount = textVerts.length / 3
      allVertices.push(...textVerts)
      allTriangles.push(...textTris.map(t => t + globalVertexIndex))
      globalVertexIndex += textVertexCount
      
      // 3. Buraco do chaveiro - estrutura externa (anel)
      const holeSegments = 32
      const holeOuterVerts = []
      const holeOuterTris = []
      const startIndex = globalVertexIndex
      
      // Cria o anel externo do buraco
      for (let i = 0; i <= holeSegments; i++) {
        const angle = (i / holeSegments) * Math.PI * 2
        const x = Math.cos(angle) * holeOuterRadius
        const y = Math.sin(angle) * holeOuterRadius
        
        // Vértices inferior e superior do anel
        holeOuterVerts.push(holeX + x, holeY + y, holeZ)
        holeOuterVerts.push(holeX + x, holeY + y, holeZ + baseThickness)
      }
      
      // Triângulos do anel
      for (let i = 0; i < holeSegments; i++) {
        const base = startIndex + i * 2
        // Face externa
        holeOuterTris.push(base, base + 2, base + 1)
        holeOuterTris.push(base + 1, base + 2, base + 3)
      }
      
      allVertices.push(...holeOuterVerts)
      allTriangles.push(...holeOuterTris)
      globalVertexIndex += holeOuterVerts.length / 3
      
      // 4. Segunda linha se habilitada
      if (keychainConfig.show2ndLine && keychainConfig.line2) {
        const line2Width = Math.max(keychainConfig.line2.length * keychainConfig.fontSize * 0.6, 20)
        const line2Geometry = new THREE.BoxGeometry(
          line2Width + padding,
          textHeight + padding,
          keychainConfig.thickness
        )
        const line2Mesh = new THREE.Mesh(line2Geometry)
        line2Mesh.position.set(
          keychainConfig.line2Offset,
          keychainConfig.line2VerticalOffset,
          0
        )
        line2Mesh.updateMatrixWorld()
        line2Geometry.applyMatrix4(line2Mesh.matrixWorld)
        const { vertices: line2Verts, triangles: line2Tris } = geometryToVerticesAndTriangles(line2Geometry)
        const line2VertexCount = line2Verts.length / 3
        allVertices.push(...line2Verts)
        allTriangles.push(...line2Tris.map(t => t + globalVertexIndex))
        globalVertexIndex += line2VertexCount
        
        // Texto da segunda linha
        const line2TextGeometry = new THREE.BoxGeometry(
          line2Width * 0.9,
          textHeight * 0.7,
          keychainConfig.textThickness
        )
        const line2TextMesh = new THREE.Mesh(line2TextGeometry)
        line2TextMesh.position.set(
          keychainConfig.line2Offset,
          keychainConfig.line2VerticalOffset,
          keychainConfig.thickness
        )
        line2TextMesh.updateMatrixWorld()
        line2TextGeometry.applyMatrix4(line2TextMesh.matrixWorld)
        const { vertices: line2TextVerts, triangles: line2TextTris } = geometryToVerticesAndTriangles(line2TextGeometry)
        const line2TextVertexCount = line2TextVerts.length / 3
        allVertices.push(...line2TextVerts)
        allTriangles.push(...line2TextTris.map(t => t + globalVertexIndex))
        globalVertexIndex += line2TextVertexCount
      }
      
      // 5. Caixa personalizada se configurada
      if (keychainConfig.boxWidth > 0 && keychainConfig.boxHeight > 0) {
        const boxGeometry = new THREE.BoxGeometry(
          keychainConfig.boxWidth,
          keychainConfig.boxHeight,
          keychainConfig.thickness
        )
        const boxMesh = new THREE.Mesh(boxGeometry)
        boxMesh.position.set(
          keychainConfig.boxXOffset,
          keychainConfig.boxYOffset,
          keychainConfig.thickness / 2
        )
        boxMesh.updateMatrixWorld()
        boxGeometry.applyMatrix4(boxMesh.matrixWorld)
        const { vertices: boxVerts, triangles: boxTris } = geometryToVerticesAndTriangles(boxGeometry)
        const boxVertexCount = boxVerts.length / 3
        allVertices.push(...boxVerts)
        allTriangles.push(...boxTris.map(t => t + globalVertexIndex))
        globalVertexIndex += boxVerts.length / 3
      }
      
      // Cria o XML do modelo 3MF
      let verticesXML = ''
      for (let i = 0; i < allVertices.length; i += 3) {
        verticesXML += `        <vertex x="${allVertices[i].toFixed(6)}" y="${allVertices[i + 1].toFixed(6)}" z="${allVertices[i + 2].toFixed(6)}"/>\n`
      }
      
      let trianglesXML = ''
      for (let i = 0; i < allTriangles.length; i += 3) {
        trianglesXML += `        <triangle v1="${allTriangles[i]}" v2="${allTriangles[i + 1]}" v3="${allTriangles[i + 2]}"/>\n`
      }
      
      const model3mf = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Application">NFC Keychain Generator</metadata>
  <resources>
    <object id="1" type="model">
      <mesh>
        <vertices>
${verticesXML}        </vertices>
        <triangles>
${trianglesXML}        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1"/>
  </build>
</model>`
      
      // Cria o arquivo ZIP (3MF é um ZIP)
      const zip = new JSZip()
      
      const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`
      
      const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`
      
      zip.file('[Content_Types].xml', contentTypes)
      zip.file('_rels/.rels', rels)
      zip.file('3D/3dmodel.model', model3mf)
      
      // Gera o arquivo ZIP
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `keychain_${keychainConfig.name.replace(/\s+/g, '_') || 'personalizado'}.3mf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      alert('⚠️ Arquivo 3MF gerado!\n\nNota: Este é uma aproximação simplificada do modelo.\nPara o modelo completo com texto renderizado, use o arquivo .scad no OpenSCAD e exporte de lá para 3MF.')
    } catch (error) {
      console.error('Erro ao gerar 3MF:', error)
      alert('Erro ao gerar arquivo 3MF. Tente usar o arquivo .scad no OpenSCAD.')
    }
  }

  return (
    <div className="config-page">
      <div className="config-container">
        <header className="config-header">
          <h1>🔑 Personalizador de Chaveiro 3D</h1>
          <p>Configure os parâmetros do seu chaveiro personalizado e gere o arquivo para impressão 3D</p>
        </header>

        {/* Visualização 3D Interativa */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.3rem', margin: 0 }}>👁️ Visualização 3D Interativa do Chaveiro</h2>
            <button
              type="button"
              className="btn btn-primary"
              onClick={generate3DModel}
              disabled={isGenerating3D || !keychainConfig.name}
              style={{ minWidth: '200px' }}
            >
              {isGenerating3D ? '⏳ Gerando modelo 3D...' : '🎮 Gerar Visualização 3D'}
            </button>
          </div>
          
          {stlData ? (
            <div>
              <Keychain3DViewer 
                stlData={stlData} 
                baseColor={keychainConfig.baseColor}
                textColor={keychainConfig.textColor}
              />
              <p style={{ marginTop: '0.5rem', fontSize: '0.9em', color: '#666', textAlign: 'center' }}>
                ✅ Modelo 3D gerado pelo OpenSCAD - Arraste para rotacionar e use o scroll para dar zoom!
              </p>
            </div>
          ) : (
            <div style={{
              width: '100%',
              height: '500px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              background: '#f5f5f5',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999'
            }}>
              {!keychainConfig.name ? (
                <>
                  <p style={{ fontSize: '1.1em', marginBottom: '0.5rem' }}>📝 Preencha o nome do chaveiro</p>
                  <p style={{ fontSize: '0.9em' }}>Depois clique em "Gerar Visualização 3D" para ver o modelo interativo</p>
                </>
              ) : isGenerating3D ? (
                <>
                  <p style={{ fontSize: '1.1em', marginBottom: '0.5rem' }}>⏳ Gerando modelo 3D...</p>
                  <p style={{ fontSize: '0.9em' }}>Aguarde enquanto o OpenSCAD processa o modelo</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '1.1em', marginBottom: '0.5rem' }}>👆 Clique em "Gerar Visualização 3D"</p>
                  <p style={{ fontSize: '0.9em' }}>O sistema gerará um modelo 3D interativo que você pode rotacionar e dar zoom</p>
                </>
              )}
            </div>
          )}
        </div>

        <form className="config-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label htmlFor="name">
              <span className="icon">✏️</span>
              Nome Principal (Linha 1) <span style={{fontSize: '0.85em', fontWeight: 'normal', color: '#666'}}>* Obrigatório</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={keychainConfig.name}
              onChange={handleChange}
              placeholder="Ex: João Silva"
            />
            <p className="form-help">Digite o nome que aparecerá na primeira linha do chaveiro</p>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="show2ndLine"
                checked={keychainConfig.show2ndLine}
                onChange={handleChange}
              />
              <span className="checkbox-text">Adicionar segunda linha de texto</span>
            </label>
            <p className="form-help">Marque esta opção se quiser adicionar uma segunda linha abaixo do nome (ex: telefone, endereço, etc)</p>
          </div>

          {keychainConfig.show2ndLine && (
            <div className="form-group">
              <label htmlFor="line2">
                <span className="icon">✏️</span>
                Texto da Segunda Linha
              </label>
              <input
                type="text"
                id="line2"
                name="line2"
                value={keychainConfig.line2}
                onChange={handleChange}
                placeholder="Ex: Telefone: (11) 99999-9999"
              />
              <p className="form-help">Digite o texto que aparecerá na segunda linha (pode ser telefone, endereço, email, etc)</p>
            </div>
          )}

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="faceDownMode"
                checked={keychainConfig.faceDownMode}
                onChange={handleChange}
              />
              <span className="checkbox-text">Texto invertido (Face Down)</span>
            </label>
            <p className="form-help">Marque esta opção se o chaveiro será impresso de cabeça para baixo. O texto ficará mais fino para ser lido quando virado</p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fontSize">
                <span className="icon">📏</span>
                Tamanho da Fonte
              </label>
              <input
                type="number"
                id="fontSize"
                name="fontSize"
                value={keychainConfig.fontSize}
                onChange={handleChange}
                min="5"
                max="50"
                step="1"
              />
              <p className="form-help">Tamanho do texto em milímetros. Valores maiores = texto maior (padrão: 15)</p>
            </div>

            <div className="form-group">
              <label htmlFor="thickness">
                <span className="icon">📏</span>
                Espessura da Base (Altura)
              </label>
              <input
                type="number"
                id="thickness"
                name="thickness"
                value={keychainConfig.thickness}
                onChange={handleChange}
                min="1"
                max="10"
                step="0.5"
              />
              <p className="form-help">Altura total do chaveiro em milímetros. Valores maiores = chaveiro mais grosso (padrão: 2mm)</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="textThickness">
                <span className="icon">📏</span>
                Altura do Texto em Relevo
              </label>
              <input
                type="number"
                id="textThickness"
                name="textThickness"
                value={keychainConfig.textThickness}
                onChange={handleChange}
                min="0.1"
                max="5"
                step="0.1"
              />
              <p className="form-help">Quanto o texto fica elevado acima da base. Valores maiores = texto mais destacado (padrão: 1mm)</p>
            </div>

            <div className="form-group">
              <label htmlFor="edgeRadius">
                <span className="icon">📏</span>
                Raio da Borda (r) - Preencher Buracos
              </label>
              <input
                type="number"
                id="edgeRadius"
                name="edgeRadius"
                value={keychainConfig.edgeRadius}
                onChange={handleChange}
                min="0"
                max="10"
                step="0.5"
              />
              <p className="form-help">
                <strong>Importante:</strong> Aumenta o contorno da borda da fonte para preencher buracos e espaços vazios no texto. 
                Se o texto tiver letras com espaços internos (como "A", "O", "P", etc), aumente este valor para preencher esses buracos. 
                Valores maiores = mais preenchimento (padrão: 3mm)
              </p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="keychainHoleSize">
                <span className="icon">🔗</span>
                Tamanho do Buraco do Chaveiro
              </label>
              <input
                type="number"
                id="keychainHoleSize"
                name="keychainHoleSize"
                value={keychainConfig.keychainHoleSize}
                onChange={handleChange}
                min="2"
                max="10"
                step="0.5"
              />
              <p className="form-help">Diâmetro do buraco onde passa o anel do chaveiro. Ajuste conforme o tamanho do seu anel (padrão: 4mm)</p>
            </div>

            <div className="form-group">
              <label htmlFor="keychainHoleOffset">
                <span className="icon">🔗</span>
                Distância do Buraco
              </label>
              <input
                type="number"
                id="keychainHoleOffset"
                name="keychainHoleOffset"
                value={keychainConfig.keychainHoleOffset}
                onChange={handleChange}
                min="0"
                max="10"
                step="0.5"
              />
              <p className="form-help">Distância do buraco até a borda esquerda do chaveiro. Valores maiores = buraco mais para a direita (padrão: 1mm)</p>
            </div>
          </div>

          {keychainConfig.show2ndLine && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="line2Offset">
                  <span className="icon">↔️</span>
                  Posição Horizontal da Linha 2
                </label>
                <input
                  type="number"
                  id="line2Offset"
                  name="line2Offset"
                  value={keychainConfig.line2Offset}
                  onChange={handleChange}
                  min="-50"
                  max="50"
                  step="1"
                />
                <p className="form-help">Mova a segunda linha para esquerda (valores negativos) ou direita (valores positivos). 0 = centralizado (padrão: 0)</p>
              </div>

              <div className="form-group">
                <label htmlFor="line2VerticalOffset">
                  <span className="icon">↕️</span>
                  Posição Vertical da Linha 2
                </label>
                <input
                  type="number"
                  id="line2VerticalOffset"
                  name="line2VerticalOffset"
                  value={keychainConfig.line2VerticalOffset}
                  onChange={handleChange}
                  min="-50"
                  max="50"
                  step="1"
                />
                <p className="form-help">Mova a segunda linha para cima (valores positivos) ou para baixo (valores negativos). Padrão: -15mm (abaixo da primeira linha)</p>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="font">
                <span className="icon">🔤</span>
                Tipo de Fonte
              </label>
              <select
                id="font"
                name="font"
                value={keychainConfig.font}
                onChange={handleChange}
              >
                {fonts.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
              <p className="form-help">Escolha o estilo de letra do texto. "Chewy" é uma fonte mais arredondada e divertida (padrão)</p>
            </div>

            <div className="form-group">
              <label htmlFor="fontStyle">
                <span className="icon">🔤</span>
                Peso da Fonte (Negrito, Regular, etc)
              </label>
              <select
                id="fontStyle"
                name="fontStyle"
                value={keychainConfig.fontStyle}
                onChange={handleChange}
              >
                {fontStyles.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
              <p className="form-help">Escolha se o texto será normal, negrito, itálico, etc. "Black Italic" = negrito e itálico (padrão)</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="baseColor">
                <span className="icon">🎨</span>
                Cor da Base/Borda
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="color"
                  id="baseColor"
                  name="baseColor"
                  value={keychainConfig.baseColor}
                  onChange={handleChange}
                  style={{
                    width: '60px',
                    height: '40px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={keychainConfig.baseColor}
                  onChange={(e) => {
                    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                      handleChange({ target: { name: 'baseColor', value: e.target.value } })
                    }
                  }}
                  placeholder="#4a90e2"
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
              <p className="form-help">Cor da base, borda e verso do chaveiro. Esta é a cor principal do chaveiro (padrão: azul #4a90e2)</p>
            </div>

            <div className="form-group">
              <label htmlFor="textColor">
                <span className="icon">🎨</span>
                Cor do Texto
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="color"
                  id="textColor"
                  name="textColor"
                  value={keychainConfig.textColor}
                  onChange={handleChange}
                  style={{
                    width: '60px',
                    height: '40px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={keychainConfig.textColor}
                  onChange={(e) => {
                    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                      handleChange({ target: { name: 'textColor', value: e.target.value } })
                    }
                  }}
                  placeholder="#ffffff"
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
              <p className="form-help">Cor do texto em relevo. Escolha uma cor que contraste bem com a cor da base (padrão: branco #ffffff)</p>
            </div>
          </div>

          <div className="form-group">
            <label>
              <span className="icon">📦</span>
              Caixa/Retângulo Adicional (Opcional - Avançado)
            </label>
            <p className="form-help" style={{marginBottom: '1rem'}}>Adicione um retângulo extra ao chaveiro (útil para logos ou decorações). Deixe tudo em 0 para não adicionar nada.</p>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="boxWidth">Largura da Caixa</label>
                <input
                  type="number"
                  id="boxWidth"
                  name="boxWidth"
                  value={keychainConfig.boxWidth}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="1"
                />
                <p className="form-help" style={{fontSize: '0.8em'}}>Largura em mm</p>
              </div>
              <div className="form-group">
                <label htmlFor="boxHeight">Altura da Caixa</label>
                <input
                  type="number"
                  id="boxHeight"
                  name="boxHeight"
                  value={keychainConfig.boxHeight}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="1"
                />
                <p className="form-help" style={{fontSize: '0.8em'}}>Altura em mm</p>
              </div>
              <div className="form-group">
                <label htmlFor="boxXOffset">Posição Horizontal</label>
                <input
                  type="number"
                  id="boxXOffset"
                  name="boxXOffset"
                  value={keychainConfig.boxXOffset}
                  onChange={handleChange}
                  min="-100"
                  max="100"
                  step="1"
                />
                <p className="form-help" style={{fontSize: '0.8em'}}>Esquerda (-) ou direita (+)</p>
              </div>
              <div className="form-group">
                <label htmlFor="boxYOffset">Posição Vertical</label>
                <input
                  type="number"
                  id="boxYOffset"
                  name="boxYOffset"
                  value={keychainConfig.boxYOffset}
                  onChange={handleChange}
                  min="-100"
                  max="100"
                  step="1"
                />
                <p className="form-help" style={{fontSize: '0.8em'}}>Abaixo (-) ou acima (+)</p>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={generate3MF}>
              📦 Gerar .scad, Abrir no OpenSCAD e Exportar .3mf
            </button>
            <button type="button" className="btn btn-primary" onClick={downloadSCAD}>
              💾 Baixar Arquivo .scad
            </button>
            <button type="button" className="btn btn-copy" onClick={copyToClipboard}>
              📋 Copiar Código
            </button>
          </div>
          <div style={{marginTop: '1rem', padding: '1rem', background: '#d1ecf1', border: '1px solid #bee5eb', borderRadius: '4px', fontSize: '0.9rem'}}>
            <strong>💡 Como usar:</strong>
            <ol style={{marginTop: '0.5rem', paddingLeft: '1.5rem', marginBottom: '0.5rem'}}>
              <li>Preencha pelo menos o <strong>Nome Principal</strong> (obrigatório)</li>
              <li>Ajuste os outros campos conforme sua preferência (valores padrão já estão configurados)</li>
              <li>Clique em <strong>"Gerar .scad, Abrir no OpenSCAD e Exportar .3mf"</strong></li>
              <li>O sistema gerará o arquivo .3mf automaticamente e fará o download</li>
              <li>Abra o arquivo .3mf no Bambu Studio ou outro software de impressão 3D</li>
            </ol>
            <p style={{marginTop: '0.5rem', marginBottom: 0}}>
              <strong>💾 Alternativa:</strong> Você também pode baixar o arquivo .scad e abrir no OpenSCAD para visualizar e ajustar antes de exportar.
            </p>
          </div>
        </form>

        <footer className="config-footer">
          <button onClick={() => navigate('/')} className="back-link">
            ← Voltar para a página principal
          </button>
          <button onClick={() => navigate('/config')} className="back-link">
            ⚙️ Ir para Configuração NFC
          </button>
        </footer>
      </div>
    </div>
  )
}

export default KeychainPage
