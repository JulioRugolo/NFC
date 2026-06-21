# Dockerfile para Railway com OpenSCAD pré-instalado
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
