import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './ConfigPage.css'

function ConfigPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nomeCrianca: '',
    genero: 'menina', // 'menino' ou 'menina'
    instagram: '',
    nomePai: '',
    nomeMae: '',
    telefonePai: '',
    telefoneMae: ''
  })

  const [generatedUrl, setGeneratedUrl] = useState('')
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    // Detecta a URL base
    const url = window.location.origin
    setBaseUrl(url)
  }, [])

  useEffect(() => {
    // Gera a URL quando os dados mudam
    generateUrl()
  }, [formData, baseUrl])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 'menino' : 'menina') : value
    }))
  }

  const generateUrl = () => {
    const params = new URLSearchParams()
    
    Object.keys(formData).forEach(key => {
      const value = formData[key]
      // Trata checkbox (genero) e campos de texto
      if (typeof value === 'string' && value.trim() !== '') {
        params.append(key, value.trim())
      } else if (typeof value !== 'string' && value) {
        params.append(key, value)
      }
    })

    // URLSearchParams.toString() já retorna a query string com encoding correto
    const queryString = params.toString()
    const url = queryString 
      ? `${baseUrl}/?${queryString}`
      : `${baseUrl}/`
    
    setGeneratedUrl(url)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedUrl).then(() => {
      alert('URL copiada para a área de transferência!')
    }).catch(() => {
      // Fallback para navegadores antigos
      const textArea = document.createElement('textarea')
      textArea.value = generatedUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('URL copiada para a área de transferência!')
    })
  }

  const clearForm = () => {
    setFormData({
      nomeCrianca: '',
      genero: 'menina',
      instagram: '',
      nomePai: '',
      nomeMae: '',
      telefonePai: '',
      telefoneMae: ''
    })
  }

  const openUrl = () => {
    window.open(generatedUrl, '_blank')
  }

  return (
    <div className="config-page">
      <div className="config-container">
        <header className="config-header">
          <h1>⚙️ Configurador de URL NFC</h1>
          <p>Preencha os campos abaixo para gerar a URL da tag NFC</p>
        </header>

        <form className="config-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label htmlFor="nomeCrianca">
              <span className="icon">👶</span>
              Nome da Criança
            </label>
            <input
              type="text"
              id="nomeCrianca"
              name="nomeCrianca"
              value={formData.nomeCrianca}
              onChange={handleChange}
              placeholder="Ex: Anna Julia Rugolo"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="genero"
                checked={formData.genero === 'menino'}
                onChange={handleChange}
              />
              <span className="checkbox-text">É menino</span>
            </label>
            <p className="form-help">Se não marcar, será considerado menina</p>
          </div>

          <div className="form-group">
            <label htmlFor="instagram">
              <span className="icon">📷</span>
              Instagram (opcional)
            </label>
            <input
              type="text"
              id="instagram"
              name="instagram"
              value={formData.instagram}
              onChange={handleChange}
              placeholder="Ex: @juliorugolo ou juliorugolo"
            />
            <p className="form-help">Não precisa incluir o @</p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nomePai">
                <span className="icon">👨</span>
                Nome do Pai
              </label>
              <input
                type="text"
                id="nomePai"
                name="nomePai"
                value={formData.nomePai}
                onChange={handleChange}
                placeholder="Ex: Julio Rugolo"
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefonePai">
                <span className="icon">📞</span>
                Telefone do Pai
              </label>
              <input
                type="text"
                id="telefonePai"
                name="telefonePai"
                value={formData.telefonePai}
                onChange={handleChange}
                placeholder="Ex: 14991647966"
                maxLength="15"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nomeMae">
                <span className="icon">👩</span>
                Nome da Mãe
              </label>
              <input
                type="text"
                id="nomeMae"
                name="nomeMae"
                value={formData.nomeMae}
                onChange={handleChange}
                placeholder="Ex: Mirela Rugolo"
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefoneMae">
                <span className="icon">📞</span>
                Telefone da Mãe
              </label>
              <input
                type="text"
                id="telefoneMae"
                name="telefoneMae"
                value={formData.telefoneMae}
                onChange={handleChange}
                placeholder="Ex: 14991297163"
                maxLength="15"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-clear" onClick={clearForm}>
              🗑️ Limpar
            </button>
          </div>
        </form>

        {generatedUrl && (
          <div className="url-preview">
            <h2>🔗 URL Gerada</h2>
            <div className="url-box">
              <input
                type="text"
                value={generatedUrl}
                readOnly
                className="url-input"
                onClick={(e) => e.target.select()}
              />
              <div className="url-actions">
                <button className="btn btn-copy" onClick={copyToClipboard}>
                  📋 Copiar
                </button>
                <button className="btn btn-open" onClick={openUrl}>
                  🔍 Visualizar
                </button>
              </div>
            </div>
            <p className="url-hint">
              💡 Use esta URL para configurar sua tag NFC<br/>
              <span style={{fontSize: '11px', opacity: 0.8}}>
                Caracteres especiais (ã, ç, á, etc.) são suportados automaticamente
              </span>
            </p>
          </div>
        )}

        <footer className="config-footer">
          <button onClick={() => navigate('/')} className="back-link">
            ← Voltar para a página principal
          </button>
        </footer>
      </div>
    </div>
  )
}

export default ConfigPage
