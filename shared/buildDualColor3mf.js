import JSZip from 'jszip'

/**
 * Parse STL binário ou ASCII → lista de triângulos [{ n, a, b, c }].
 */
export function parseStl(buffer) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
  if (buf.length >= 84 && !isAsciiStl(buf)) {
    return parseBinaryStl(buf)
  }
  return parseAsciiStl(buf.toString('utf8'))
}

function isAsciiStl(buf) {
  const head = buf.subarray(0, Math.min(80, buf.length)).toString('utf8').toLowerCase()
  return head.includes('solid') && !looksLikeBinaryHeader(buf)
}

function looksLikeBinaryHeader(buf) {
  if (buf.length < 84) return false
  const triCount = buf.readUInt32LE(80)
  return triCount > 0 && buf.length >= 84 + triCount * 50
}

function parseBinaryStl(buf) {
  const triCount = buf.readUInt32LE(80)
  const tris = []
  let offset = 84
  for (let i = 0; i < triCount; i++) {
    const n = [buf.readFloatLE(offset), buf.readFloatLE(offset + 4), buf.readFloatLE(offset + 8)]
    const a = [buf.readFloatLE(offset + 12), buf.readFloatLE(offset + 16), buf.readFloatLE(offset + 20)]
    const b = [buf.readFloatLE(offset + 24), buf.readFloatLE(offset + 28), buf.readFloatLE(offset + 32)]
    const c = [buf.readFloatLE(offset + 36), buf.readFloatLE(offset + 40), buf.readFloatLE(offset + 44)]
    tris.push({ n, a, b, c })
    offset += 50
  }
  return tris
}

function parseAsciiStl(text) {
  const tris = []
  const facetRe =
    /facet\s+normal\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)[\s\S]*?vertex\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)[\s\S]*?vertex\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)[\s\S]*?vertex\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)/gi
  let m
  while ((m = facetRe.exec(text))) {
    tris.push({
      n: [Number(m[1]), Number(m[2]), Number(m[3])],
      a: [Number(m[4]), Number(m[5]), Number(m[6])],
      b: [Number(m[7]), Number(m[8]), Number(m[9])],
      c: [Number(m[10]), Number(m[11]), Number(m[12])],
    })
  }
  return tris
}

function hexToDisplayColor(hex, alpha = 'FF') {
  const h = String(hex || '#000000').replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padStart(6, '0')
  return `#${full.toUpperCase()}${alpha}`
}

function meshXmlFromTriangles(tris) {
  const vertices = []
  const triangles = []
  const index = new Map()

  const vid = (p) => {
    const key = `${p[0].toFixed(5)},${p[1].toFixed(5)},${p[2].toFixed(5)}`
    if (index.has(key)) return index.get(key)
    const id = vertices.length
    index.set(key, id)
    vertices.push(p)
    return id
  }

  for (const t of tris) {
    triangles.push([vid(t.a), vid(t.b), vid(t.c)])
  }

  const vertsXml = vertices
    .map((v) => `        <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`)
    .join('\n')
  const trisXml = triangles
    .map(([a, b, c]) => `        <triangle v1="${a}" v2="${b}" v3="${c}" />`)
    .join('\n')

  return { vertsXml, trisXml, vertexCount: vertices.length, triangleCount: triangles.length }
}

/**
 * Monta 3MF com base + texto em cores distintas, mas como UM único item
 * no build (assembly via components). Assim o fatiador trata como uma peça
 * com 2 materiais, em vez de dois objetos soltos que se separam.
 * OpenSCAD 2021 não exporta color() — meshes entram separados e o 3MF junta.
 */
export async function buildDualColor3mf({
  baseStl,
  textStl,
  baseColor = '#000000',
  textColor = '#ffffff',
  modelName = 'keychain',
} = {}) {
  const baseTris = parseStl(baseStl)
  const textTris = parseStl(textStl)
  if (!baseTris.length) throw new Error('STL da base vazio ou inválido')
  if (!textTris.length) throw new Error('STL do texto vazio ou inválido')

  const baseMesh = meshXmlFromTriangles(baseTris)
  const textMesh = meshXmlFromTriangles(textTris)
  const baseDisplay = hexToDisplayColor(baseColor)
  const textDisplay = hexToDisplayColor(textColor)
  const safeName = String(modelName || 'keychain').replace(/[<>&"']/g, '')

  const model = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US"
  xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"
  xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <m:basematerials id="10">
      <m:base name="Base" displaycolor="${baseDisplay}" />
      <m:base name="Text" displaycolor="${textDisplay}" />
    </m:basematerials>
    <object id="1" type="model" name="${safeName}_base" pid="10" pindex="0">
      <mesh>
        <vertices>
${baseMesh.vertsXml}
        </vertices>
        <triangles>
${baseMesh.trisXml}
        </triangles>
      </mesh>
    </object>
    <object id="2" type="model" name="${safeName}_text" pid="10" pindex="1">
      <mesh>
        <vertices>
${textMesh.vertsXml}
        </vertices>
        <triangles>
${textMesh.trisXml}
        </triangles>
      </mesh>
    </object>
    <object id="3" type="model" name="${safeName}">
      <components>
        <component objectid="1" />
        <component objectid="2" />
      </components>
    </object>
  </resources>
  <build>
    <item objectid="3" />
  </build>
</model>
`

  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`

  const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`

  const zip = new JSZip()
  zip.file('[Content_Types].xml', contentTypes)
  zip.folder('_rels').file('.rels', rels)
  zip.folder('3D').file('3dmodel.model', model)

  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  return {
    content,
    extension: '3mf',
    contentType: 'application/3mf',
    meta: {
      baseTriangles: baseMesh.triangleCount,
      textTriangles: textMesh.triangleCount,
    },
  }
}
