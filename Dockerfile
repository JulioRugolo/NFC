# Dockerfile para Coolify/VPS com OpenSCAD pré-instalado
FROM node:18-slim

# Instala dependências do sistema, OpenSCAD, Xvfb e fontconfig
RUN apt-get update && apt-get install -y \
    openscad \
    xvfb \
    fontconfig \
    wget \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Instala fonte Chewy do Google Fonts
RUN mkdir -p /usr/share/fonts/truetype/chewy && \
    wget -q https://github.com/google/fonts/raw/main/apache/chewy/Chewy-Regular.ttf -O /usr/share/fonts/truetype/chewy/Chewy-Regular.ttf && \
    fc-cache -fv

# Define o diretório de trabalho
WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências (inclui devDependencies para o build Vite)
RUN npm install --legacy-peer-deps --include=dev

# Copia o código da aplicação
COPY . .

# Build do frontend
RUN npm run build

# Remove devDependencies após o build
RUN npm prune --omit=dev

# Expõe a porta (Coolify usa a variável PORT)
EXPOSE 3001

# Comando para iniciar o servidor
CMD ["node", "server.js"]
