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

  const [showModal, setShowModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  useEffect(() => {
    // Lê os parâmetros da URL e decodifica caracteres especiais
    const params = new URLSearchParams(window.location.search)
    
    // Função auxiliar para decodificar valores
    // URLSearchParams já decodifica automaticamente, mas tratamos casos especiais
    const decodeParam = (value) => {
      if (!value) return ''
      try {
        // URLSearchParams.get() já retorna decodificado, mas se houver encoding duplo, decodificamos novamente
        const decoded = decodeURIComponent(value.replace(/\+/g, ' '))
        return decoded
      } catch (e) {
        // Se falhar o decode, retorna o valor original
        return value
      }
    }
    
    setInfo({
      nomeCrianca: decodeParam(params.get('nomeCrianca') || params.get('nome_crianca') || ''),
      nomePai: decodeParam(params.get('nomePai') || params.get('nome_pai') || ''),
      nomeMae: decodeParam(params.get('nomeMae') || params.get('nome_mae') || ''),
      telefonePai: decodeParam(params.get('telefonePai') || params.get('telefone_pai') || ''),
      telefoneMae: decodeParam(params.get('telefoneMae') || params.get('telefone_mae') || '')
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

  const handleCall = (phone, showPromo = true) => {
    if (phone) {
      const cleaned = phone.replace(/\D/g, '')
      if (showPromo) {
        setPendingAction(() => () => {
          window.location.href = `tel:${cleaned}`
        })
        setShowModal(true)
      } else {
        window.location.href = `tel:${cleaned}`
      }
    }
  }

  const handleWhatsApp = (phone, responsibleName, showPromo = true) => {
    if (phone) {
      const cleaned = phone.replace(/\D/g, '')
      const message = `Olá ${responsibleName}, tudo bem? Achei os pertences da ${info.nomeCrianca || 'criança'}`
      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `https://wa.me/55${cleaned}?text=${encodedMessage}`
      
      if (showPromo) {
        setPendingAction(() => () => {
          window.open(whatsappUrl, '_blank')
        })
        setShowModal(true)
      } else {
        window.open(whatsappUrl, '_blank')
      }
    }
  }

  const handleContinue = () => {
    if (pendingAction) {
      pendingAction()
    }
    setShowModal(false)
    setPendingAction(null)
  }

  const handleSkip = () => {
    setShowModal(false)
    if (pendingAction) {
      pendingAction()
    }
    setPendingAction(null)
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
      {showModal && (
        <div className="modal-overlay" onClick={handleSkip}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleSkip}>×</button>
            <div className="modal-body">
              <div className="modal-logo">3DIdeas</div>
              <h3 className="modal-title">Tags NFC Personalizadas</h3>
              <p className="modal-text">
                Esta tag foi feita pela <strong>3DIdeas</strong>!
              </p>
              <p className="modal-text">
                Procurando uma solução segura para identificar itens das crianças?
                Nossas tags NFC são personalizadas, duráveis e fáceis de usar.
              </p>
              <div className="modal-features">
                <div className="modal-feature">✓ Personalização completa</div>
                <div className="modal-feature">✓ Impressão 3D de qualidade</div>
                <div className="modal-feature">✓ Fácil instalação</div>
              </div>
              <div className="modal-actions">
                <button className="modal-btn modal-btn-primary" onClick={handleContinue}>
                  Continuar contato
                </button>
                <button className="modal-btn modal-btn-secondary" onClick={handleSkip}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="container">
        <header>
          {info.nomeCrianca && (
            <>
              <p className="header-subtitle">Você achou os pertences da</p>
              <h1 className="child-name">{info.nomeCrianca}</h1>
              <p className="header-instruction">Clique nos botões abaixo para entrar em contato com os responsáveis</p>
            </>
          )}
        </header>

        {(info.nomePai || info.nomeMae || info.telefonePai || info.telefoneMae) && (
          <div className="responsibles-section">
            <h2 className="section-title">Dados Responsáveis</h2>
            <div className="responsibles-content">
              {info.nomePai && (
                <div className="responsible-item responsible-item-pai">
                  <div className="responsible-header">
                    <span className="responsible-label">Pai:</span>
                    <span className="responsible-name">{info.nomePai}</span>
                  </div>
                  {info.telefonePai && (
                    <div className="contact-buttons">
                      <button 
                        className="btn btn-phone" 
                        onClick={() => handleCall(info.telefonePai)}
                      >
                        Ligar {formatPhone(info.telefonePai)}
                      </button>
                      <button 
                        className="btn btn-whatsapp" 
                        onClick={() => handleWhatsApp(info.telefonePai, info.nomePai)}
                      >
                        WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              )}

              {info.nomeMae && (
                <div className="responsible-item responsible-item-mae">
                  <div className="responsible-header">
                    <span className="responsible-label">Mãe:</span>
                    <span className="responsible-name">{info.nomeMae}</span>
                  </div>
                  {info.telefoneMae && (
                    <div className="contact-buttons">
                      <button 
                        className="btn btn-phone" 
                        onClick={() => handleCall(info.telefoneMae)}
                      >
                        Ligar {formatPhone(info.telefoneMae)}
                      </button>
                      <button 
                        className="btn btn-whatsapp" 
                        onClick={() => handleWhatsApp(info.telefoneMae, info.nomeMae)}
                      >
                        WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <footer>
          <div className="brand-section">
            <div className="brand-info">
              <h3>3DIdeas</h3>
              <p className="brand-tagline">Tags NFC Personalizadas</p>
            </div>
            <div className="brand-contact">
              <button 
                className="contact-btn" 
                onClick={() => handleWhatsApp('14991647966', false)}
              >
                <span className="contact-label">WhatsApp</span>
                <span className="contact-phone">(14) 99164-7966</span>
              </button>
              <button 
                className="contact-btn" 
                onClick={() => handleWhatsApp('14991297163', false)}
              >
                <span className="contact-label">WhatsApp</span>
                <span className="contact-phone">(14) 99129-7163</span>
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
