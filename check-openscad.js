#!/usr/bin/env node

import { exec } from 'child_process'
import { promisify } from 'util'
import { access } from 'fs/promises'
import { constants } from 'fs'

const execAsync = promisify(exec)

const isMac = process.platform === 'darwin'
const isWindows = process.platform === 'win32'

console.log('🔍 Verificando instalação do OpenSCAD...\n')

let found = false
let path = null

if (isMac) {
  // Verifica no local padrão do macOS
  const macPath = '/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD'
  try {
    await access(macPath, constants.F_OK)
    console.log('✅ OpenSCAD encontrado em:', macPath)
    found = true
    path = macPath
  } catch {
    console.log('❌ Não encontrado em /Applications/OpenSCAD.app')
  }
  
  // Verifica via Homebrew
  try {
    const { stdout } = await execAsync('which openscad')
    const brewPath = stdout.trim()
    if (brewPath && !found) {
      console.log('✅ OpenSCAD encontrado via Homebrew:', brewPath)
      found = true
      path = brewPath
    }
  } catch {
    console.log('❌ Não encontrado no PATH')
  }
} else if (isWindows) {
  const windowsPaths = [
    'C:\\Program Files\\OpenSCAD\\openscad.exe',
    'C:\\Program Files (x86)\\OpenSCAD\\openscad.exe'
  ]
  
  for (const winPath of windowsPaths) {
    try {
      await access(winPath, constants.F_OK)
      console.log('✅ OpenSCAD encontrado em:', winPath)
      found = true
      path = winPath
      break
    } catch {}
  }
  
  if (!found) {
    console.log('❌ Não encontrado nos locais padrão do Windows')
  }
} else {
  // Linux
  try {
    const { stdout } = await execAsync('which openscad')
    const linuxPath = stdout.trim()
    if (linuxPath) {
      console.log('✅ OpenSCAD encontrado em:', linuxPath)
      found = true
      path = linuxPath
    }
  } catch {
    console.log('❌ Não encontrado no PATH')
  }
}

console.log('\n' + '='.repeat(50))

if (found) {
  console.log('✅ OpenSCAD está instalado!')
  console.log('📍 Caminho:', path)
  
  // Tenta verificar a versão
  try {
    const { stdout } = await execAsync(`"${path}" --version`)
    console.log('📦 Versão:', stdout.trim())
  } catch {
    console.log('⚠️  Não foi possível verificar a versão')
  }
} else {
  console.log('❌ OpenSCAD NÃO está instalado!')
  console.log('\n📥 Como instalar:')
  
  if (isMac) {
    console.log('\n1. Via Homebrew (recomendado):')
    console.log('   brew install --cask openscad')
    console.log('\n2. Ou baixe manualmente:')
    console.log('   https://openscad.org/downloads.html')
  } else if (isWindows) {
    console.log('\n1. Baixe o instalador:')
    console.log('   https://openscad.org/downloads.html')
    console.log('\n2. Execute o instalador')
    console.log('3. Reinicie o servidor após instalar')
  } else {
    console.log('\n1. Ubuntu/Debian:')
    console.log('   sudo apt install openscad')
    console.log('\n2. Fedora:')
    console.log('   sudo dnf install openscad')
    console.log('\n3. Ou baixe de:')
    console.log('   https://openscad.org/downloads.html')
  }
}

console.log('\n' + '='.repeat(50))
