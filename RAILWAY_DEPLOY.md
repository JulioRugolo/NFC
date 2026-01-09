# Deploy no Railway

Este projeto está configurado para rodar no Railway sem necessidade de instalar nada manualmente.

## Como fazer o Deploy

### 1. Preparar o projeto

1. Certifique-se de que todos os arquivos estão commitados:
   ```bash
   git add .
   git commit -m "Preparar para deploy no Railway"
   ```

### 2. Criar projeto no Railway

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em "New Project"
4. Selecione "Deploy from GitHub repo"
5. Escolha este repositório

### 3. Configurar variáveis de ambiente (opcional)

No Railway, você pode configurar:
- `PORT`: Porta do servidor (Railway define automaticamente)
- `NODE_ENV`: `production`

### 4. Build e Deploy

O Railway irá:
1. Detectar o `Dockerfile`
2. Construir a imagem Docker com OpenSCAD pré-instalado
3. Fazer deploy automaticamente

### 5. Configurar o frontend (Opcional)

O frontend detecta automaticamente a URL da API em produção. Se precisar configurar manualmente, adicione no Railway:

**Variáveis de Ambiente:**
- `VITE_API_URL`: URL da API (geralmente não necessário, detecta automaticamente)

## Estrutura

- **Dockerfile**: Contém OpenSCAD pré-instalado
- **server.js**: Servidor Express que serve a API e arquivos estáticos
- **railway.json**: Configuração do Railway

## Como funciona

1. O Dockerfile instala OpenSCAD no container
2. O servidor Node.js roda no container
3. Quando você gera um 3MF, o servidor usa o OpenSCAD instalado no container
4. Não é necessário instalar nada manualmente!

## Troubleshooting

### OpenSCAD não encontrado

Se der erro de OpenSCAD não encontrado:
1. Verifique os logs do Railway
2. Certifique-se de que o Dockerfile está sendo usado
3. Verifique se o build foi bem-sucedido

### Porta não configurada

O Railway define automaticamente a variável `PORT`. O servidor já está configurado para usar `process.env.PORT`.

### Frontend não carrega

Se o frontend não carregar:
1. Certifique-se de fazer build do frontend: `npm run build`
2. O servidor serve arquivos estáticos da pasta `dist`
3. Ou configure o Railway para servir o frontend separadamente
