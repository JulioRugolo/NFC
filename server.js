import express from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink, readFile, access } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import cors from 'cors'

const execAsync = promisify(exec)
const app = express()
const PORT = process.env.PORT || 3001

// Middlewares básicos (devem vir primeiro)
app.use(cors())
app.use(express.json())

// Função para gerar código OpenSCAD (precisa estar antes das rotas)
function generateOpenSCAD(config) {
  const { name, line2, show2ndLine, faceDownMode, fontSize, thickness, textThickness,
          keychainHoleSize, keychainHoleOffset, edgeRadius, line2Offset, line2VerticalOffset,
          boxWidth, boxHeight, boxXOffset, boxYOffset, font, fontStyle } = config

  return `// Parameters
$fn = 100;
name = "${name.replace(/"/g, '\\"')}"; // Change this to the desired name
line2 = "${line2.replace(/"/g, '\\"')}"; // Change this to the desired second line text
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

module keychain(name, line2, fontSize, thickness, textThickness, keychainHoleSize, keychainHoleOffset, font, 2ndline, line2Offset, line2VerticalOffset, boxWidth, boxHeight, boxXOffset, boxYOffset) {
    // Create the background "bubble" for the first line
    translate([0, 0, 0])
        linear_extrude(height = thickness)
            offset(r = r)
                text(name, size = fontSize, valign = "center", halign = "left", font = font);

    // Create the background "bubble" for the second line if 2ndline is true
    if (2ndline) {
        translate([line2Offset, line2VerticalOffset, 0])
            linear_extrude(height = thickness)
                offset(r = r)
                    text(line2, size = fontSize, valign = "center", halign = "left", font = font);
    }

    // Extrude the text for the first line
    if (facedownmode){
          translate([0, 0, thickness])
        color([0,0,0])linear_extrude(height = 0.1)
            text(name, size = fontSize, valign = "center", halign = "left", font = font);  
    } else{
           translate([0, 0, thickness])
        color([0,0,0])linear_extrude(height = textThickness)
            text(name, size = fontSize, valign = "center", halign = "left", font = font);
    }

    // Extrude the text for the second line if 2ndline is true
    if (2ndline) {
        
        if(facedownmode){
            color([0,0,0])translate([line2Offset, line2VerticalOffset, thickness])
            linear_extrude(height = 0.1)
                text(line2, size = fontSize, valign = "center", halign = "left", font = font);
        }else{
            color([0,0,0])translate([line2Offset, line2VerticalOffset, thickness])
            linear_extrude(height = textThickness)
                text(line2, size = fontSize, valign = "center", halign = "left", font = font);
        }
    }
    
    // Add the customizable box
    translate([boxXOffset, boxYOffset, 0])
        linear_extrude(height = thickness)
            square([boxWidth, boxHeight], center = false);

    difference() {
        // Add the keychain hole
        union() {
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
keychain(name, line2, fontSize, thickness, textThickness, keychainHoleSize, keychainHoleOffset, font, 2ndline, line2Offset, line2VerticalOffset, boxWidth, boxHeight, boxXOffset, boxYOffset);
`
}

// Função auxiliar para detectar OpenSCAD
async function findOpenSCAD() {
  const isWindows = process.platform === 'win32'
  const isMac = process.platform === 'darwin'
  let openscadPath = null
  
  if (isMac) {
    const macPath = '/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD'
    try {
      await access(macPath)
      openscadPath = macPath
    } catch {
      try {
        const { stdout } = await execAsync('which openscad')
        openscadPath = stdout.trim()
      } catch {
        openscadPath = 'openscad'
      }
    }
  } else if (isWindows) {
    const windowsPaths = [
      'C:\\Program Files\\OpenSCAD\\openscad.exe',
      'C:\\Program Files (x86)\\OpenSCAD\\openscad.exe'
    ]
    for (const path of windowsPaths) {
      try {
        await access(path)
        openscadPath = path
        break
      } catch {}
    }
    if (!openscadPath) {
      openscadPath = 'openscad.exe'
    }
  } else {
    try {
      const { stdout } = await execAsync('which openscad')
      openscadPath = stdout.trim()
    } catch {
      openscadPath = 'openscad'
    }
  }
  
  return { openscadPath, isMac, isWindows }
}

// ========== ROTAS DE API (devem vir ANTES do catch-all) ==========

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' })
})

// Rota para gerar visualização 3D (imagem PNG)
app.post('/api/generate-preview', async (req, res) => {
  const config = req.body
  const tempId = randomUUID()
  const tempDir = tmpdir()
  const scadFile = join(tempDir, `keychain_preview_${tempId}.scad`)
  const previewImage = join(tempDir, `keychain_preview_${tempId}.png`)

  try {
    if (!config.name) {
      return res.status(400).json({ error: 'Nome é obrigatório' })
    }

    // 1. Gera o arquivo OpenSCAD
    const openSCADCode = generateOpenSCAD(config)
    await writeFile(scadFile, openSCADCode, 'utf8')
    console.log(`📝 Arquivo OpenSCAD criado para preview: ${scadFile}`)

    // 2. Detecta OpenSCAD
    const { openscadPath } = await findOpenSCAD()

    // 3. Renderiza imagem PNG usando OpenSCAD com Xvfb (para servidor sem display)
    // Xvfb cria um framebuffer virtual para o OpenSCAD renderizar
    // --render: renderiza o modelo completamente
    // --imgsize: tamanho da imagem (largura,altura)
    // --viewall: ajusta a câmera para mostrar tudo
    // --autocenter: centraliza o modelo
    // -o com extensão .png: exporta como PNG
    const isLinux = process.platform === 'linux'
    const previewCommand = isLinux
      ? `xvfb-run -a -s "-screen 0 1024x768x24" "${openscadPath}" --render --imgsize=800,600 --viewall --autocenter "${scadFile}" -o "${previewImage}"`
      : `"${openscadPath}" --render --imgsize=800,600 --viewall --autocenter "${scadFile}" -o "${previewImage}"`
    console.log(`🔧 Gerando preview: ${previewCommand}`)

    try {
      const { stdout, stderr } = await execAsync(previewCommand, { timeout: 60000 })
      
      if (stderr && !stderr.includes('WARNING')) {
        console.warn('OpenSCAD stderr:', stderr)
      }

      // Verifica se a imagem foi criada
      const imageContent = await readFile(previewImage)
      
      if (imageContent.length === 0) {
        throw new Error('Imagem de preview gerada está vazia')
      }

      // Limpa arquivo temporário
      await unlink(scadFile).catch(() => {})

      // Retorna a imagem como base64 ou como arquivo
      const base64Image = imageContent.toString('base64')
      
      // Limpa a imagem após enviar
      setTimeout(() => {
        unlink(previewImage).catch(() => {})
      }, 5000)

      res.json({
        success: true,
        image: `data:image/png;base64,${base64Image}`
      })

    } catch (previewErr) {
      console.error('Erro ao gerar preview:', previewErr)
      
      // Limpa arquivos temporários
      await unlink(scadFile).catch(() => {})
      await unlink(previewImage).catch(() => {})
      
      throw new Error(`Erro ao gerar visualização: ${previewErr.message}`)
    }

  } catch (error) {
    console.error('Erro ao gerar preview:', error)
    
    await unlink(scadFile).catch(() => {})
    await unlink(previewImage).catch(() => {})
    
    res.status(500).json({
      error: 'Erro ao gerar visualização',
      message: error.message
    })
  }
})

// Rota para gerar SCAD, abrir no OpenSCAD e exportar 3MF automaticamente
app.post('/api/generate-and-export-3mf', async (req, res) => {
  const config = req.body
  const tempId = randomUUID()
  const tempDir = tmpdir()
  const scadFile = join(tempDir, `keychain_${tempId}.scad`)
  const output3mfFile = join(tempDir, `keychain_${tempId}.3mf`)

  try {
    if (!config.name) {
      return res.status(400).json({ error: 'Nome é obrigatório' })
    }

    // 1. Gera o arquivo OpenSCAD
    const openSCADCode = generateOpenSCAD(config)
    await writeFile(scadFile, openSCADCode, 'utf8')
    console.log(`📝 Arquivo OpenSCAD criado: ${scadFile}`)

    // 2. Detecta OpenSCAD
    const { openscadPath } = await findOpenSCAD()

    // 3. Executa OpenSCAD via linha de comando para renderizar e exportar 3MF
    // Nota: Não tentamos abrir GUI no servidor (Railway/Docker não tem display)
    const openscadCommand = `"${openscadPath}" -o "${output3mfFile}" "${scadFile}"`
    console.log(`🔧 Executando: ${openscadCommand}`)
    
    try {
      const { stdout, stderr } = await execAsync(openscadCommand, { timeout: 60000 })
      
      if (stderr && !stderr.includes('WARNING')) {
        console.warn('OpenSCAD stderr:', stderr)
      }
      
      // Verifica se o arquivo foi criado
      const fileContent = await readFile(output3mfFile)
      
      if (fileContent.length === 0) {
        throw new Error('Arquivo 3MF gerado está vazio')
      }
      
      // Limpa arquivo temporário
      await unlink(scadFile).catch(() => {})
      
      // Retorna o arquivo 3MF
      res.setHeader('Content-Type', 'application/3mf')
      res.setHeader('Content-Disposition', `attachment; filename="keychain_${config.name.replace(/\s+/g, '_')}.3mf"`)
      res.send(fileContent)
      
      // Limpa o arquivo 3MF após enviar
      setTimeout(() => {
        unlink(output3mfFile).catch(() => {})
      }, 5000)
      
    } catch (exportErr) {
      // Se 3MF falhar, tenta STL
      console.log('3MF não suportado, tentando STL...')
      const stlFile = join(tempDir, `keychain_${tempId}.stl`)
      const stlCommand = `"${openscadPath}" -o "${stlFile}" "${scadFile}"`
      
      try {
        const { stdout, stderr } = await execAsync(stlCommand, { timeout: 60000 })
        const stlContent = await readFile(stlFile)
        
        await unlink(scadFile).catch(() => {})
        await unlink(stlFile).catch(() => {})
        
        res.setHeader('Content-Type', 'application/sla')
        res.setHeader('Content-Disposition', `attachment; filename="keychain_${config.name.replace(/\s+/g, '_')}.stl"`)
        res.send(stlContent)
      } catch (stlErr) {
        const errorDetails = stlErr.stderr || stlErr.message || 'Erro desconhecido'
        throw new Error(`OpenSCAD execution failed: ${errorDetails}`)
      }
    }

  } catch (error) {
    console.error('Erro ao gerar e exportar 3MF:', error)
    
    await unlink(scadFile).catch(() => {})
    await unlink(output3mfFile).catch(() => {})
    
    const isWindows = process.platform === 'win32'
    const isMac = process.platform === 'darwin'
    let hint = 'Certifique-se de que o OpenSCAD está instalado'
    
    if (error.message.includes('command not found') || error.message.includes('openscad')) {
      if (isMac) {
        hint = 'OpenSCAD não encontrado. Instale via:\n1. Homebrew: brew install --cask openscad\n2. Ou baixe de https://openscad.org/downloads.html\n3. Depois reinicie o servidor'
      } else if (isWindows) {
        hint = 'OpenSCAD não encontrado. Baixe e instale de https://openscad.org/downloads.html'
      } else {
        hint = 'OpenSCAD não encontrado. Instale via: sudo apt install openscad (ou equivalente)'
      }
    }
    
    res.status(500).json({ 
      error: 'Erro ao gerar arquivo 3MF',
      message: error.message,
      hint: hint
    })
  }
})

// Rota para gerar 3MF diretamente (mantida para compatibilidade)
app.post('/api/generate-3mf', async (req, res) => {
  const config = req.body
  const tempId = randomUUID()
  const tempDir = tmpdir()
  const scadFile = join(tempDir, `keychain_${tempId}.scad`)
  const stlFile = join(tempDir, `keychain_${tempId}.stl`)
  const output3mfFile = join(tempDir, `keychain_${tempId}.3mf`)

  // Detecta o sistema operacional (fora do try para usar no catch)
  const isWindows = process.platform === 'win32'
  const isMac = process.platform === 'darwin'
  
  try {
    // Validação básica
    if (!config.name) {
      return res.status(400).json({ error: 'Nome é obrigatório' })
    }

    // 1. Gera o arquivo OpenSCAD
    const openSCADCode = generateOpenSCAD(config)
    await writeFile(scadFile, openSCADCode, 'utf8')
    console.log(`📝 Arquivo OpenSCAD criado: ${scadFile}`)

    // 2. Detecta o caminho do OpenSCAD usando função auxiliar
    const { openscadPath } = await findOpenSCAD()
    
    // 3. Executa OpenSCAD para renderizar e exportar como 3MF
    // OpenSCAD 2019.05+ suporta exportação direta para 3MF
    const openscadCommand = `"${openscadPath}" -o "${output3mfFile}" "${scadFile}"`
    
    try {
      await execAsync(openscadCommand, { timeout: 30000 })
      
      // Verifica se o arquivo foi criado
      try {
        const fileContent = await readFile(output3mfFile)
        
        // Limpa arquivos temporários
        await unlink(scadFile).catch(() => {})
        
        // Retorna o arquivo 3MF
        res.setHeader('Content-Type', 'application/3mf')
        res.setHeader('Content-Disposition', `attachment; filename="keychain_${config.name.replace(/\s+/g, '_')}.3mf"`)
        res.send(fileContent)
        
        // Limpa o arquivo 3MF após enviar
        setTimeout(() => {
          unlink(output3mfFile).catch(() => {})
        }, 5000)
        
      } catch (err) {
        // Se 3MF não funcionou, tenta STL e converte
        throw new Error('3MF export failed, trying STL conversion')
      }
    } catch (err) {
      // Fallback: exporta como STL e informa que precisa conversão
      console.log('3MF não suportado, tentando exportar como STL...')
      const stlCommand = `"${openscadPath}" -o "${stlFile}" "${scadFile}"`
      
      try {
        console.log(`🔧 Executando STL: ${stlCommand}`)
        const { stdout, stderr } = await execAsync(stlCommand, { timeout: 60000 })
        
        if (stderr && !stderr.includes('WARNING')) {
          console.warn('OpenSCAD stderr:', stderr)
        }
        
        const stlContent = await readFile(stlFile)
        
        if (stlContent.length === 0) {
          throw new Error('Arquivo STL gerado está vazio')
        }
        
        // Limpa arquivos temporários
        await unlink(scadFile).catch(() => {})
        await unlink(stlFile).catch(() => {})
        
        // Retorna STL com aviso
        res.setHeader('Content-Type', 'application/sla')
        res.setHeader('Content-Disposition', `attachment; filename="keychain_${config.name.replace(/\s+/g, '_')}.stl"`)
        res.send(stlContent)
      } catch (stlErr) {
        // Captura stderr para ver o erro real do OpenSCAD
        const errorDetails = stlErr.stderr || stlErr.message || 'Erro desconhecido'
        console.error('Erro do OpenSCAD:', errorDetails)
        throw new Error(`OpenSCAD execution failed: ${errorDetails}`)
      }
    }
    
  } catch (error) {
    console.error('Erro ao gerar 3MF:', error)
    
    // Limpa arquivos temporários em caso de erro
    await unlink(scadFile).catch(() => {})
    await unlink(stlFile).catch(() => {})
    await unlink(output3mfFile).catch(() => {})
    
    let errorMessage = error.message
    let hint = 'Certifique-se de que o OpenSCAD está instalado'
    
    if (errorMessage.includes('command not found') || errorMessage.includes('openscad')) {
      if (isMac) {
        hint = 'OpenSCAD não encontrado. Instale via:\n1. Homebrew: brew install --cask openscad\n2. Ou baixe de https://openscad.org/downloads.html\n3. Depois reinicie o servidor'
      } else if (isWindows) {
        hint = 'OpenSCAD não encontrado. Baixe e instale de https://openscad.org/downloads.html'
      } else {
        hint = 'OpenSCAD não encontrado. Instale via: sudo apt install openscad (ou equivalente)'
      }
    }
    
    res.status(500).json({ 
      error: 'Erro ao gerar arquivo 3MF',
      message: errorMessage,
      hint: hint
    })
  }
})

// ========== SERVER STATIC FILES AND CATCH-ALL (DEPOIS DE TODAS AS ROTAS DE API) ==========

// Serve arquivos estáticos e rota catch-all (depois das APIs)
const distPath = join(process.cwd(), 'dist')
access(distPath).then(() => {
  // Serve arquivos estáticos (CSS, JS, imagens, etc)
  app.use(express.static(distPath))
  
  // Rota catch-all para SPA - DEVE vir por último, depois de todas as rotas de API
  // Serve index.html para todas as rotas que não são API
  // Usa função middleware ao invés de '*' para compatibilidade
  app.use((req, res, next) => {
    // Se for uma rota de API, passa para o próximo middleware
    if (req.path.startsWith('/api/')) {
      return next()
    }
    // Caso contrário, serve o index.html do frontend
    res.sendFile(join(distPath, 'index.html'))
  })
  console.log('✅ Frontend estático servido de /dist')
}).catch(() => {
  console.log('⚠️ Pasta dist não encontrada - servindo apenas API')
  
  // Mesmo sem dist, adiciona middleware catch-all para não dar erro 404
  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Rota de API não encontrada' })
    }
    res.status(404).send('Frontend não encontrado. Execute "npm run build" primeiro.')
  })
})

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
  console.log(`📦 Endpoint: http://localhost:${PORT}/api/generate-3mf`)
  console.log(`💡 OpenSCAD pré-instalado no container`)
  
  // Verifica se OpenSCAD está disponível
  execAsync('openscad --version').then(({ stdout }) => {
    console.log(`✅ OpenSCAD encontrado: ${stdout.trim()}`)
  }).catch(() => {
    console.warn('⚠️ OpenSCAD não encontrado - verifique a instalação no Dockerfile')
  })
})
