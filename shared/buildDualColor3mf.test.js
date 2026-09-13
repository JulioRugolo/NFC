import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import { parseStl, buildDualColor3mf } from '../shared/buildDualColor3mf.js'

function tinyAsciiStl(label, z = 0) {
  return `solid ${label}
  facet normal 0 0 1
    outer loop
      vertex 0 0 ${z}
      vertex 1 0 ${z}
      vertex 0 1 ${z}
    endloop
  endfacet
endsolid ${label}
`
}

describe('buildDualColor3mf', () => {
  it('parseia STL ASCII', () => {
    const tris = parseStl(Buffer.from(tinyAsciiStl('base')))
    assert.equal(tris.length, 1)
    assert.deepEqual(tris[0].a, [0, 0, 0])
  })

  it('gera 3MF com 2 objetos e materiais preto/branco', async () => {
    const result = await buildDualColor3mf({
      baseStl: Buffer.from(tinyAsciiStl('base', 0)),
      textStl: Buffer.from(tinyAsciiStl('text', 2)),
      baseColor: '#000000',
      textColor: '#ffffff',
      modelName: 'TESTE',
    })
    assert.equal(result.extension, '3mf')
    const zip = await JSZip.loadAsync(result.content)
    const model = await zip.file('3D/3dmodel.model').async('string')
    assert.match(model, /basematerials/)
    assert.match(model, /displaycolor="#000000FF"/)
    assert.match(model, /displaycolor="#FFFFFFFF"/)
    assert.match(model, /name="TESTE_base"/)
    assert.match(model, /name="TESTE_text"/)
    assert.match(model, /<components>/)
    assert.match(model, /<component objectid="1"/)
    assert.match(model, /<component objectid="2"/)
    assert.match(model, /<item objectid="3"/)
    assert.doesNotMatch(model, /<build>\s*<item objectid="1"/)
  })
})
