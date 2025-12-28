#!/bin/bash

# Script para fazer push do código para o GitHub
# Uso: ./push-to-github.sh SEU_USUARIO_GITHUB NOME_DO_REPOSITORIO

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "❌ Uso: ./push-to-github.sh SEU_USUARIO_GITHUB NOME_DO_REPOSITORIO"
    echo "Exemplo: ./push-to-github.sh juliorugolo NFC"
    exit 1
fi

USERNAME=$1
REPO_NAME=$2

echo "📦 Configurando repositório remoto..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/${USERNAME}/${REPO_NAME}.git

echo "🚀 Fazendo push para o GitHub..."
git branch -M main
git push -u origin main

echo "✅ Pronto! Seu código está no GitHub:"
echo "   https://github.com/${USERNAME}/${REPO_NAME}"
