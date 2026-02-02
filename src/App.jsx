import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import './App.css'
import ConfigPage from './ConfigPage'
import KeychainPage from './KeychainPage'
import Footer from './Footer'

function App() {
  const location = useLocation()
  
  // Se estiver na rota /config, mostra a página de configuração
  if (location.pathname === '/config') {
    return <ConfigPage />
  }
  
  // Se estiver na rota /keychain, mostra a página de personalização de chaveiro
  if (location.pathname === '/keychain') {
    return <KeychainPage />
  }
  const [info, setInfo] = useState({
    tipo: 'crianca', // 'crianca', 'pet' ou 'empresa'
    usoProprio: false, // se true (apenas crianca), exibe dados da própria pessoa
    nomeCrianca: '',
    tipoPet: '', // 'gato' ou 'cachorro'
    genero: 'menina', // 'menino' ou 'menina'
    endereco: '',
    telefonePessoa: '',
    nomePai: '',
    nomeMae: '',
    instagramPai: '',
    instagramMae: '',
    telefonePai: '',
    telefoneMae: '',
    // Campos para empresa
    nomeEmpresa: '',
    logoEmpresa: '',
    telefoneFixoEmpresa: '',
    telefoneCelularEmpresa: '',
    enderecoEmpresa: '',
    instagramEmpresa: '',
    facebookEmpresa: '',
    siteEmpresa: ''
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

    const parseBool = (value) => {
      const v = decodeParam(value || '').toString().trim().toLowerCase()
      return v === 'true' || v === '1' || v === 'sim' || v === 'yes' || v === 'on'
    }
    
    setInfo({
      tipo: decodeParam(params.get('tipo') || '') || 'crianca',
      usoProprio: parseBool(params.get('usoProprio') || params.get('uso_proprio')),
      nomeCrianca: decodeParam(params.get('nomeCrianca') || params.get('nome_crianca') || ''),
      tipoPet: decodeParam(params.get('tipoPet') || ''),
      genero: decodeParam(params.get('genero') || '') || 'menina',
      endereco: decodeParam(params.get('endereco') || ''),
      telefonePessoa: decodeParam(params.get('telefonePessoa') || params.get('telefone_pessoa') || ''),
      nomePai: decodeParam(params.get('nomePai') || params.get('nome_pai') || ''),
      nomeMae: decodeParam(params.get('nomeMae') || params.get('nome_mae') || ''),
      instagramPai: decodeParam(params.get('instagramPai') || params.get('instagram_pai') || ''),
      instagramMae: decodeParam(params.get('instagramMae') || params.get('instagram_mae') || ''),
      telefonePai: decodeParam(params.get('telefonePai') || params.get('telefone_pai') || ''),
      telefoneMae: decodeParam(params.get('telefoneMae') || params.get('telefone_mae') || ''),
      // Campos para empresa
      nomeEmpresa: decodeParam(params.get('nomeEmpresa') || ''),
      logoEmpresa: decodeParam(params.get('logoEmpresa') || ''),
      telefoneFixoEmpresa: decodeParam(params.get('telefoneFixoEmpresa') || ''),
      telefoneCelularEmpresa: decodeParam(params.get('telefoneCelularEmpresa') || ''),
      enderecoEmpresa: decodeParam(params.get('enderecoEmpresa') || ''),
      instagramEmpresa: decodeParam(params.get('instagramEmpresa') || ''),
      facebookEmpresa: decodeParam(params.get('facebookEmpresa') || ''),
      siteEmpresa: decodeParam(params.get('siteEmpresa') || '')
    })
  }, [])

  const formatPhone = (phone, isFixed = false) => {
    if (!phone) return ''
    // Remove caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '')
    
    // Telefone fixo: 10 dígitos (DDD + 8) ou 11 dígitos (0 + DDD + 8)
    if (isFixed) {
      if (cleaned.startsWith('0')) {
        // Formato com 0: (0XX) XXXX-XXXX
        if (cleaned.length === 11) {
          return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 7)}-${cleaned.substring(7)}`
        } else if (cleaned.length > 11) {
          cleaned = cleaned.substring(0, 11)
          return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 7)}-${cleaned.substring(7)}`
        }
      } else {
        // Formato sem 0: (XX) XXXX-XXXX
        if (cleaned.length === 10) {
          return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`
        } else if (cleaned.length > 10) {
          cleaned = cleaned.substring(0, 10)
          return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`
        }
      }
      // Se não conseguir formatar, retorna como está
      return phone
    }
    
    // Telefone celular: 11 dígitos (DDD + 9 dígitos) ou 12 dígitos (0 + DDD + 9 dígitos)
    // Se já começa com 0, mantém como está
    if (cleaned.startsWith('0')) {
      // Limita a 12 dígitos
      if (cleaned.length > 12) {
        cleaned = cleaned.substring(0, 12)
      }
    } else {
      // Se não começa com 0 e tem 10 ou 11 dígitos, adiciona o 0
      if (cleaned.length === 10 || cleaned.length === 11) {
        cleaned = '0' + cleaned
      }
    }
    
    // Formata como (0XX) XXXXX-XXXX (12 dígitos total)
    if (cleaned.length === 12) {
      // Formato completo: (0XX) 9XXXX-XXXX
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 8)}-${cleaned.substring(8)}`
    } else if (cleaned.length === 11) {
      // Formato antigo sem 0: (XX) 9XXXX-XXXX
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`
    } else if (cleaned.length === 10) {
      // Formato fixo: (XX) XXXX-XXXX
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`
    }
    
    // Se não conseguir formatar, retorna como está
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
      let message = ''
      
      if (info.tipo === 'empresa') {
        message = `Olá, gostaria de mais informações sobre ${info.nomeEmpresa || 'a empresa'}`
      } else if (info.tipo === 'crianca' && info.usoProprio) {
        const nome = responsibleName || info.nomeCrianca || ''
        message = `Olá ${nome}, encontrei sua tag NFC. Podemos conversar?`
      } else {
        const nome = info.nomeCrianca || (info.tipo === 'pet' ? 'pet' : 'criança')
        const pronome = info.genero === 'menino' ? 'do' : 'da'
        message = `Olá ${responsibleName}, tudo bem? Achei os pertences ${pronome} ${nome}`
      }
      
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

  // Verifica se há informações realmente preenchidas (ignorando valores padrão)
  const hasInfo = info.nomeCrianca || info.nomePai || info.nomeMae || 
                  info.telefonePai || info.telefoneMae || info.endereco || info.telefonePessoa ||
                  (info.tipo === 'pet' && info.tipoPet) ||
                  info.nomeEmpresa || info.telefoneFixoEmpresa || info.telefoneCelularEmpresa || info.enderecoEmpresa

  // Se estiver na rota raiz sem parâmetros, mostra a página inicial
  if (!hasInfo && location.pathname === '/') {
    return (
      <div className="app">
        <div className="container">
          <div className="home-page">
            <header className="home-header">
              <h1 className="home-title">🔖 BOTU3D</h1>
              <p className="home-subtitle">Sistema de Tags NFC e Chaveiros 3D</p>
            </header>
            
            <div className="home-content">
              <div className="home-cards">
                <Link to="/config" className="home-card">
                  <div className="card-icon">⚙️</div>
                  <h2 className="card-title">Configurar Tag NFC</h2>
                  <p className="card-description">
                    Crie e configure suas tags NFC personalizadas com informações de contato
                  </p>
                  <div className="card-arrow">→</div>
                </Link>

                <Link to="/keychain" className="home-card">
                  <div className="card-icon">🔑</div>
                  <h2 className="card-title">Personalizar Chaveiro 3D</h2>
                  <p className="card-description">
                    Crie chaveiros 3D personalizados com texto, cores e estilos únicos
                  </p>
                  <div className="card-arrow">→</div>
                </Link>

                <a 
                  href="/?nomeCrianca=João%20Silva&nomePai=Carlos%20Silva&nomeMae=Maria%20Silva&telefonePai=11999999999&telefoneMae=11888888888&endereco=Rua%20Exemplo,%20123&genero=menino" 
                  className="home-card card-example"
                >
                  <div className="card-icon">👁️</div>
                  <h2 className="card-title">Ver Exemplo</h2>
                  <p className="card-description">
                    Veja como fica uma tag NFC com informações de exemplo
                  </p>
                  <div className="card-arrow">→</div>
                </a>
              </div>
            </div>

            <Footer />
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
              <div className="modal-logo">BOTU3D</div>
              <h3 className="modal-title">Tags NFC Personalizadas</h3>
              <p className="modal-text">
                Esta tag foi feita pela <strong>BOTU3D</strong>!
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
              <div className="modal-instagram">
                <button 
                  className="modal-btn-instagram"
                  onClick={() => window.open('https://instagram.com/botu.3d', '_blank')}
                >
                  📷 Siga-nos no Instagram: @botu.3d
                </button>
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
          {info.tipo === 'empresa' && info.nomeEmpresa ? (
            <>
              {info.logoEmpresa && info.logoEmpresa.trim() !== '' && (
                <div style={{ 
                  marginBottom: '1rem', 
                  textAlign: 'center',
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <img 
                    src={info.logoEmpresa} 
                    alt={`Logo ${info.nomeEmpresa}`}
                    style={{ 
                      maxWidth: '200px', 
                      maxHeight: '150px', 
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      display: 'block',
                      margin: '0 auto'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )}
              <h1 className="child-name">{info.nomeEmpresa}</h1>
              {info.enderecoEmpresa && info.enderecoEmpresa.trim() !== '' && (
                <p className="address-text">📍 {info.enderecoEmpresa}</p>
              )}
              <p className="header-instruction">Entre em contato conosco através dos botões abaixo</p>
            </>
          ) : info.nomeCrianca && (
            <>
              {!info.usoProprio && (
                <p className="header-subtitle">
                  Você achou os pertences {info.genero === 'menino' ? 'do' : 'da'}
                </p>
              )}
              <h1 className="child-name">
                {info.nomeCrianca}
                {info.tipo === 'pet' && info.tipoPet && (
                  <span className="pet-type-badge"> {info.tipoPet === 'cachorro' ? '🐶' : '🐱'}</span>
                )}
              </h1>
              {info.endereco && info.endereco.trim() !== '' && (
                <p className="address-text">📍 {info.endereco}</p>
              )}
              <p className="header-instruction">
                {info.usoProprio ? 'Clique nos botões abaixo para entrar em contato comigo' : 'Clique nos botões abaixo para entrar em contato com os responsáveis'}
              </p>
            </>
          )}
        </header>

        {/* Seção para Empresa */}
        {info.tipo === 'empresa' && (info.nomeEmpresa || info.telefoneFixoEmpresa || info.telefoneCelularEmpresa) && (
          <div className="responsibles-section">
            <h2 className="section-title">Informações de Contato</h2>
            <div className="responsibles-content">
              {/* Telefone Fixo - Só liga */}
              {info.telefoneFixoEmpresa && (
                <div className="responsible-item responsible-item-pai">
                  <div className="contact-section">
                    <div className="contact-info">
                      <div className="contact-name-row">
                        <span className="contact-label">Telefone Fixo:</span>
                        <span className="contact-name">{info.nomeEmpresa || 'Empresa'}</span>
                      </div>
                      <div className="phone-number" onClick={() => {
                        navigator.clipboard.writeText(info.telefoneFixoEmpresa.replace(/\D/g, '')).then(() => {
                          alert('Número copiado!')
                        })
                      }}>
                        {formatPhone(info.telefoneFixoEmpresa, true)}
                      </div>
                    </div>
                    <div className="contact-buttons">
                      <button 
                        className="btn-icon btn-phone-icon" 
                        onClick={() => handleCall(info.telefoneFixoEmpresa)}
                        title={`Ligar ${formatPhone(info.telefoneFixoEmpresa, true)}`}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Telefone Celular - WhatsApp */}
              {info.telefoneCelularEmpresa && (
                <div className="responsible-item responsible-item-pai">
                  <div className="contact-section">
                    <div className="contact-info">
                      <div className="contact-name-row">
                        <span className="contact-label">Celular:</span>
                        <span className="contact-name">{info.nomeEmpresa || 'Empresa'}</span>
                      </div>
                      <div className="phone-number" onClick={() => {
                        navigator.clipboard.writeText(info.telefoneCelularEmpresa.replace(/\D/g, '')).then(() => {
                          alert('Número copiado!')
                        })
                      }}>
                        {formatPhone(info.telefoneCelularEmpresa)}
                      </div>
                    </div>
                    <div className="contact-buttons">
                      <button 
                        className="btn-icon btn-phone-icon" 
                        onClick={() => handleCall(info.telefoneCelularEmpresa)}
                        title={`Ligar ${formatPhone(info.telefoneCelularEmpresa)}`}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button 
                        className="btn-icon btn-whatsapp-icon" 
                        onClick={() => handleWhatsApp(info.telefoneCelularEmpresa, info.nomeEmpresa)}
                        title={`WhatsApp ${formatPhone(info.telefoneCelularEmpresa)}`}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="currentColor"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {info.instagramEmpresa && info.instagramEmpresa.trim() !== '' && (
                <button 
                  className="btn-instagram-small"
                  onClick={() => {
                    const username = info.instagramEmpresa.trim().replace(/^@/, '')
                    window.open(`https://instagram.com/${username}`, '_blank')
                  }}
                >
                  📷 @{info.instagramEmpresa.trim().replace(/^@/, '')}
                </button>
              )}
              
              {info.facebookEmpresa && info.facebookEmpresa.trim() !== '' && (
                <button 
                  className="btn-instagram-small"
                  onClick={() => {
                    const username = info.facebookEmpresa.trim().replace(/^@/, '')
                    window.open(`https://facebook.com/${username}`, '_blank')
                  }}
                  style={{ marginTop: '0.5rem' }}
                >
                  👥 Facebook: {info.facebookEmpresa.trim()}
                </button>
              )}
              
              {info.siteEmpresa && info.siteEmpresa.trim() !== '' && (
                <button 
                  className="btn-instagram-small"
                  onClick={() => window.open(info.siteEmpresa, '_blank')}
                  style={{ marginTop: '0.5rem' }}
                >
                  🌐 Visitar Site
                </button>
              )}
            </div>
          </div>
        )}

        {/* Seção para Uso Próprio (Pessoa) */}
        {(info.tipo === 'crianca' && info.usoProprio) && (info.nomeCrianca || info.telefonePessoa || info.endereco) && (
          <div className="responsibles-section">
            <h2 className="section-title">Contato</h2>
            <div className="responsibles-content">
              {(info.telefonePessoa || info.nomeCrianca) && (
                <div className="responsible-item responsible-item-pai">
                  {info.telefonePessoa && (
                    <div className="contact-section">
                      <div className="contact-info">
                        <div className="contact-name-row">
                          <span className="contact-label">Telefone:</span>
                          <span className="contact-name">{info.nomeCrianca || 'Contato'}</span>
                        </div>
                        <div className="phone-number" onClick={() => {
                          navigator.clipboard.writeText(info.telefonePessoa.replace(/\D/g, '')).then(() => {
                            alert('Número copiado!')
                          })
                        }}>
                          {formatPhone(info.telefonePessoa)}
                        </div>
                      </div>
                      <div className="contact-buttons">
                        <button 
                          className="btn-icon btn-phone-icon" 
                          onClick={() => handleCall(info.telefonePessoa)}
                          title={`Ligar ${formatPhone(info.telefonePessoa)}`}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/>
                          </svg>
                        </button>
                        <button 
                          className="btn-icon btn-whatsapp-icon" 
                          onClick={() => handleWhatsApp(info.telefonePessoa, info.nomeCrianca)}
                          title={`WhatsApp ${formatPhone(info.telefonePessoa)}`}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="currentColor"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Seção para Criança/Pet */}
        {(info.tipo !== 'empresa' && !(info.tipo === 'crianca' && info.usoProprio)) && (info.nomePai || info.nomeMae || info.telefonePai || info.telefoneMae) && (
          <div className="responsibles-section">
            <h2 className="section-title">Dados Responsáveis</h2>
            <div className="responsibles-content">
              {info.nomePai && (
                <div className="responsible-item responsible-item-pai">
                  {info.telefonePai && (
                    <div className="contact-section">
                      <div className="contact-info">
                        <div className="contact-name-row">
                          <span className="contact-label">{info.tipo === 'pet' ? 'Tutor:' : 'Pai:'}</span>
                          <span className="contact-name">{info.nomePai}</span>
                        </div>
                        <div className="phone-number" onClick={() => {
                          navigator.clipboard.writeText(info.telefonePai.replace(/\D/g, '')).then(() => {
                            alert('Número copiado!')
                          })
                        }}>
                          {formatPhone(info.telefonePai)}
                        </div>
                      </div>
                      <div className="contact-buttons">
                        <button 
                          className="btn-icon btn-phone-icon" 
                          onClick={() => handleCall(info.telefonePai)}
                          title={`Ligar ${formatPhone(info.telefonePai)}`}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/>
                          </svg>
                        </button>
                        <button 
                          className="btn-icon btn-whatsapp-icon" 
                          onClick={() => handleWhatsApp(info.telefonePai, info.nomePai)}
                          title={`WhatsApp ${formatPhone(info.telefonePai)}`}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="currentColor"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  {info.instagramPai && info.instagramPai.trim() !== '' && (
                    <button 
                      className="btn-instagram-small"
                      onClick={() => {
                        const username = info.instagramPai.trim().replace(/^@/, '')
                        window.open(`https://instagram.com/${username}`, '_blank')
                      }}
                    >
                      📷 @{info.instagramPai.trim().replace(/^@/, '')}
                    </button>
                  )}
                </div>
              )}

              {info.nomeMae && (
                <div className="responsible-item responsible-item-mae">
                  {info.telefoneMae && (
                    <div className="contact-section">
                      <div className="contact-info">
                        <div className="contact-name-row">
                          <span className="contact-label">{info.tipo === 'pet' ? 'Tutora:' : 'Mãe:'}</span>
                          <span className="contact-name">{info.nomeMae}</span>
                        </div>
                        <div className="phone-number" onClick={() => {
                          navigator.clipboard.writeText(info.telefoneMae.replace(/\D/g, '')).then(() => {
                            alert('Número copiado!')
                          })
                        }}>
                          {formatPhone(info.telefoneMae)}
                        </div>
                      </div>
                      <div className="contact-buttons">
                        <button 
                          className="btn-icon btn-phone-icon" 
                          onClick={() => handleCall(info.telefoneMae)}
                          title={`Ligar ${formatPhone(info.telefoneMae)}`}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/>
                          </svg>
                        </button>
                        <button 
                          className="btn-icon btn-whatsapp-icon" 
                          onClick={() => handleWhatsApp(info.telefoneMae, info.nomeMae)}
                          title={`WhatsApp ${formatPhone(info.telefoneMae)}`}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="currentColor"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  {info.instagramMae && info.instagramMae.trim() !== '' && (
                    <button 
                      className="btn-instagram-small"
                      onClick={() => {
                        const username = info.instagramMae.trim().replace(/^@/, '')
                        window.open(`https://instagram.com/${username}`, '_blank')
                      }}
                    >
                      📷 @{info.instagramMae.trim().replace(/^@/, '')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  )
}

export default App
