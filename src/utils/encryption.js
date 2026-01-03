import CryptoJS from 'crypto-js'

// Chave de criptografia - em produção, considere usar uma variável de ambiente
const SECRET_KEY = '3DIdeas-NFC-Tag-Secret-Key-2024'

/**
 * Criptografa um objeto de dados
 * @param {Object} data - Objeto com os dados a serem criptografados
 * @returns {string} - String criptografada e codificada em base64
 */
export const encryptData = (data) => {
  try {
    const jsonString = JSON.stringify(data)
    const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString()
    // Codifica em base64 para uso seguro em URL
    return encodeURIComponent(btoa(encrypted))
  } catch (error) {
    console.error('Erro ao criptografar dados:', error)
    return null
  }
}

/**
 * Descriptografa uma string criptografada
 * @param {string} encryptedData - String criptografada
 * @returns {Object|null} - Objeto com os dados descriptografados ou null em caso de erro
 */
export const decryptData = (encryptedData) => {
  try {
    if (!encryptedData) return null
    
    // Decodifica da URL
    const decoded = decodeURIComponent(encryptedData)
    
    // Decodifica do base64
    const encrypted = atob(decoded)
    
    // Descriptografa
    const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY)
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8)
    
    if (!jsonString) {
      console.error('Erro: dados descriptografados vazios')
      return null
    }
    
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Erro ao descriptografar dados:', error)
    return null
  }
}


