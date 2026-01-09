# Configuração do Backend para Geração de 3MF

## Verificar se OpenSCAD está instalado

Execute o script de verificação:

```bash
npm run check-openscad
```

Este script verifica se o OpenSCAD está instalado e mostra o caminho onde foi encontrado.

## Instalar OpenSCAD

### macOS (recomendado via Homebrew)

```bash
brew install --cask openscad
```

### macOS (instalação manual)

1. Baixe de: https://openscad.org/downloads.html
2. Instale arrastando para `/Applications`
3. O servidor detectará automaticamente em `/Applications/OpenSCAD.app`

### Windows

1. Baixe o instalador de: https://openscad.org/downloads.html
2. Execute o instalador
3. O servidor tentará encontrar em:
   - `C:\Program Files\OpenSCAD\openscad.exe`
   - `C:\Program Files (x86)\OpenSCAD\openscad.exe`

### Linux

```bash
# Ubuntu/Debian
sudo apt install openscad

# Fedora
sudo dnf install openscad
```

## Como usar

### 1. Iniciar o servidor backend

```bash
npm run server
```

O servidor irá rodar na porta 3001 por padrão.

### 2. Iniciar o frontend (em outro terminal)

```bash
npm run dev
```

### 3. Usar a aplicação

1. Acesse `http://localhost:5173/keychain`
2. Configure os parâmetros do chaveiro
3. Clique em "Baixar Arquivo .3mf (Backend)"
4. O arquivo será gerado usando OpenSCAD e baixado automaticamente

## Verificar se OpenSCAD está instalado

Execute no terminal:

```bash
openscad --version
```

Se retornar a versão, está instalado corretamente.

## Variáveis de Ambiente

Você pode configurar a porta do servidor:

```bash
PORT=3001 npm run server
```

E a URL da API no frontend (crie um arquivo `.env`):

```
VITE_API_URL=http://localhost:3001
```

## Troubleshooting

### Erro: "OpenSCAD execution failed"

- Certifique-se de que o OpenSCAD está instalado
- Verifique se está no PATH: `which openscad` (Linux/Mac) ou `where openscad` (Windows)
- Tente usar o caminho completo no código do servidor

### Erro: "Servidor backend não está rodando"

- Certifique-se de que executou `npm run server`
- Verifique se a porta 3001 está disponível
- Verifique se há firewall bloqueando a conexão

### Arquivo 3MF não é gerado

- Verifique os logs do servidor para ver erros do OpenSCAD
- Tente gerar o arquivo .scad primeiro e abrir manualmente no OpenSCAD
- Verifique se o OpenSCAD suporta exportação direta para 3MF (versão 2019.05+)
