# Dockerfile para Railway com OpenSCAD pré-instalado
FROM node:18-slim

# Instala dependências do sistema, OpenSCAD e Xvfb (para renderização sem display)
RUN apt-get update && apt-get install -y \
    openscad \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho
WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências do Node.js
RUN npm install --legacy-peer-deps

# Copia o código da aplicação
COPY . .

# Build do frontend
RUN npm run build

# Expõe a porta (Railway usa a variável PORT)
EXPOSE 3001

# Comando para iniciar o servidor
CMD ["node", "server.js"]
