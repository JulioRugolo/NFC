import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './App.css'
import ConfigPage from './ConfigPage'

function App() {
  const location = useLocation()
  
  // Se estiver na rota /config, mostra a página de configuração
  if (location.pathname === '/config') {
    return <ConfigPage />
  }
  const [info, setInfo] = useState({
    nomeCrianca: '',
    nomePai: '',
    nomeMae: '',
    telefonePai: '',
    telefoneMae: ''
  })

  useEffect(() => {
    // Lê os parâmetros da URL
    const params = new URLSearchParams(window.location.search)
    
    setInfo({
      nomeCrianca: params.get('nomeCrianca') || params.get('nome_crianca') || '',
      nomePai: params.get('nomePai') || params.get('nome_pai') || '',
      nomeMae: params.get('nomeMae') || params.get('nome_mae') || '',
      telefonePai: params.get('telefonePai') || params.get('telefone_pai') || '',
      telefoneMae: params.get('telefoneMae') || params.get('telefone_mae') || ''
    })
  }, [])

  const formatPhone = (phone) => {
    if (!phone) return ''
    // Remove caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '')
    // Formata como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`
    } else if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`
    }
    return phone
  }

  const handleCall = (phone) => {
    if (phone) {
      const cleaned = phone.replace(/\D/g, '')
      window.location.href = `tel:${cleaned}`
    }
  }

  const handleWhatsApp = (phone) => {
    if (phone) {
      const cleaned = phone.replace(/\D/g, '')
      window.open(`https://wa.me/55${cleaned}`, '_blank')
    }
  }

  const hasInfo = Object.values(info).some(value => value !== '')

  if (!hasInfo) {
    return (
      <div className="app">
        <div className="container">
          <div className="empty-state">
            <h1>Informações de Contato</h1>
            <p>Nenhuma informação foi encontrada na URL.</p>
            <p className="help-text">
              Use parâmetros na URL como:<br/>
              ?nomeCrianca=João&nomePai=Carlos&telefonePai=11999999999
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="container">
        <header>
          <h1>Informações de Contato</h1>
          {info.nomeCrianca && (
            <div className="child-badge">
              <span className="child-icon">👶</span>
              <span className="child-name">{info.nomeCrianca}</span>
            </div>
          )}
        </header>

        <div className="info-grid">
          {info.nomePai && (
            <div className="info-card">
              <div className="card-header">
                <span className="icon">👨</span>
                <h2>Pai</h2>
              </div>
              <div className="card-content">
                <p className="name">{info.nomePai}</p>
                {info.telefonePai && (
                  <div className="contact-buttons">
                    <button 
                      className="btn btn-phone" 
                      onClick={() => handleCall(info.telefonePai)}
                      title="Ligar"
                    >
                      📞 {formatPhone(info.telefonePai)}
                    </button>
                    <button 
                      className="btn btn-whatsapp" 
                      onClick={() => handleWhatsApp(info.telefonePai)}
                      title="WhatsApp"
                    >
                      💬 WhatsApp
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {info.nomeMae && (
            <div className="info-card">
              <div className="card-header">
                <span className="icon">👩</span>
                <h2>Mãe</h2>
              </div>
              <div className="card-content">
                <p className="name">{info.nomeMae}</p>
                {info.telefoneMae && (
                  <div className="contact-buttons">
                    <button 
                      className="btn btn-phone" 
                      onClick={() => handleCall(info.telefoneMae)}
                      title="Ligar"
                    >
                      📞 {formatPhone(info.telefoneMae)}
                    </button>
                    <button 
                      className="btn btn-whatsapp" 
                      onClick={() => handleWhatsApp(info.telefoneMae)}
                      title="WhatsApp"
                    >
                      💬 WhatsApp
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <footer>
          <p>Tag NFC de Identificação</p>
        </footer>
      </div>
    </div>
  )
}

export default App
