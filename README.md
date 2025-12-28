# Página de Informações NFC

Aplicação React single page que exibe informações de contato a partir de parâmetros na URL. Ideal para uso com tags NFC.

## 🚀 Instalação

```bash
npm install
```

## 💻 Desenvolvimento

```bash
npm run dev
```

## 🏗️ Build para Produção

```bash
npm run build
```

Os arquivos estarão na pasta `dist/`.

## 📱 Uso

A aplicação lê parâmetros da URL e exibe as informações. Exemplos de uso:

### Parâmetros suportados:

- `nomeCrianca` ou `nome_crianca` - Nome da criança
- `nomePai` ou `nome_pai` - Nome do pai
- `nomeMae` ou `nome_mae` - Nome da mãe
- `telefonePai` ou `telefone_pai` - Telefone do pai
- `telefoneMae` ou `telefone_mae` - Telefone da mãe

### Exemplo de URL:

```
https://seusite.com/?nomeCrianca=João&nomePai=Carlos&nomeMae=Maria&telefonePai=11999999999&telefoneMae=11888888888
```

### Funcionalidades:

- ✅ Exibe informações formatadas e organizadas
- ✅ Botões de ligação direta (tel:)
- ✅ Botões de WhatsApp
- ✅ Formatação automática de telefone
- ✅ Design responsivo e moderno
- ✅ Funciona offline após o primeiro carregamento

## 📝 Notas

Para usar com tags NFC, configure a URL da tag para apontar para sua página com os parâmetros desejados. Exemplo:

```
https://seusite.com/?nomeCrianca=João Silva&nomePai=Carlos Silva&telefonePai=11987654321
```
