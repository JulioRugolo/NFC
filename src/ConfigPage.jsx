import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './ConfigPage.css'
import Footer from './Footer'

function ConfigPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    tipo: 'crianca', // 'crianca', 'pet' ou 'empresa'
    usoProprio: false, // se true (apenas crianca), exibe dados da própria pessoa
    nomeCrianca: '',
    tipoPet: '', // 'gato' ou 'cachorro' (apenas se tipo for 'pet')
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
    logoEmpresa: '', // URL da imagem do logo
    telefoneFixoEmpresa: '',
    telefoneCelularEmpresa: '',
    enderecoEmpresa: '',
    instagramEmpresa: '',
    facebookEmpresa: '',
    siteEmpresa: ''
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

  const formatPhoneInput = (value, isFixed = false) => {
    if (!value) return ''
    // Remove tudo que não é número
    const cleaned = value.replace(/\D/g, '')
    
    // Se não tem nada, retorna vazio
    if (cleaned.length === 0) return ''
    
    // Telefone fixo: 10 dígitos (DDD + 8) ou 11 dígitos (0 + DDD + 8)
    if (isFixed) {
      let digits = cleaned
      
      // Limita a 11 dígitos (0 + DDD + 8)
      if (digits.length > 11) {
        digits = digits.substring(0, 11)
      }
      
      // Formata: (0XX) XXXX-XXXX ou (XX) XXXX-XXXX
      if (digits.startsWith('0')) {
        // Com 0: (0XX) XXXX-XXXX
        if (digits.length <= 3) {
          return `(${digits}`
        } else if (digits.length <= 7) {
          return `(${digits.substring(0, 3)}) ${digits.substring(3)}`
        } else {
          return `(${digits.substring(0, 3)}) ${digits.substring(3, 7)}-${digits.substring(7)}`
        }
      } else {
        // Sem 0: (XX) XXXX-XXXX
        if (digits.length <= 2) {
          return `(${digits}`
        } else if (digits.length <= 6) {
          return `(${digits.substring(0, 2)}) ${digits.substring(2)}`
        } else {
          return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`
        }
      }
    }
    
    // Telefone celular: 11 dígitos (DDD + 9) ou 12 dígitos (0 + DDD + 9)
    // Ajusta o número de dígitos
    let digits = cleaned
    
    // Se já começa com 0
    if (digits.startsWith('0')) {
      // Permite até 12 dígitos (0XX + 9 dígitos)
      // Limita apenas se passar de 12
      if (digits.length > 12) {
        digits = digits.substring(0, 12)
      }
    } else {
      // Se não começa com 0
      // Permite digitar até 11 dígitos, depois adiciona 0 automaticamente
      if (digits.length === 11) {
        // Tem 11 dígitos completos, adiciona o 0
        digits = '0' + digits
      } else if (digits.length === 10) {
        // Tem 10 dígitos, também adiciona o 0
        digits = '0' + digits
      } else if (digits.length > 11) {
        // Se passou de 11 sem o 0, limita a 11
        digits = digits.substring(0, 11)
      }
      // Agora que pode ter o 0 adicionado, limita a 12
      if (digits.length > 12) {
        digits = digits.substring(0, 12)
      }
    }
    
    // Formata: (0XX) XXXXX-XXXX
    if (digits.length <= 3) {
      return `(${digits}`
    } else if (digits.length <= 8) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3)}`
    } else {
      // Formata com hífen: (0XX) XXXXX-XXXX
      return `(${digits.substring(0, 3)}) ${digits.substring(3, 8)}-${digits.substring(8)}`
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    setFormData(prev => {
      let processedValue = value
      
      // Se for campo de telefone, formata automaticamente
      if (name === 'telefonePai' || name === 'telefoneMae' || name === 'telefoneCelularEmpresa' || name === 'telefonePessoa') {
        processedValue = formatPhoneInput(value, false)
      } else if (name === 'telefoneFixoEmpresa') {
        processedValue = formatPhoneInput(value, true)
      } else {
        if (type === 'checkbox') {
          // Checkbox de gênero é especial (salva string menino/menina)
          processedValue = name === 'genero' ? (checked ? 'menino' : 'menina') : checked
        } else {
          processedValue = value
        }
      }
      
      const newData = {
        ...prev,
        [name]: processedValue
      }
      
      // Se mudou o tipo, limpa campos específicos
      if (name === 'tipo') {
        if (value === 'crianca') {
          newData.tipoPet = ''
          newData.usoProprio = false
          newData.telefonePessoa = ''
          // Limpa campos de empresa
          newData.nomeEmpresa = ''
          newData.logoEmpresa = ''
          newData.telefoneFixoEmpresa = ''
          newData.telefoneCelularEmpresa = ''
          newData.enderecoEmpresa = ''
          newData.instagramEmpresa = ''
          newData.facebookEmpresa = ''
          newData.siteEmpresa = ''
        } else if (value === 'pet') {
          newData.usoProprio = false
          newData.telefonePessoa = ''
          // Limpa campos de empresa
          newData.nomeEmpresa = ''
          newData.logoEmpresa = ''
          newData.telefoneFixoEmpresa = ''
          newData.telefoneCelularEmpresa = ''
          newData.enderecoEmpresa = ''
          newData.instagramEmpresa = ''
          newData.facebookEmpresa = ''
          newData.siteEmpresa = ''
        } else if (value === 'empresa') {
          // Limpa campos de criança/pet
          newData.usoProprio = false
          newData.nomeCrianca = ''
          newData.tipoPet = ''
          newData.genero = 'menina'
          newData.nomePai = ''
          newData.nomeMae = ''
          newData.instagramPai = ''
          newData.instagramMae = ''
          newData.telefonePai = ''
          newData.telefoneMae = ''
          newData.telefonePessoa = ''
        }
      }

      // Se marcou uso próprio, limpa dados de responsáveis
      if (name === 'usoProprio' && checked) {
        newData.nomePai = ''
        newData.nomeMae = ''
        newData.instagramPai = ''
        newData.instagramMae = ''
        newData.telefonePai = ''
        newData.telefoneMae = ''
      }
      
      return newData
    })
  }

  const generateUrl = () => {
    const params = new URLSearchParams()
    
      Object.keys(formData).forEach(key => {
      let value = formData[key]
      // Trata checkbox (genero) e campos de texto
      // Não inclui tipoPet se tipo não for 'pet'
      if (key === 'tipoPet' && formData.tipo !== 'pet') {
        return
      }
      
      // Não inclui campos de empresa se tipo não for 'empresa'
      if (formData.tipo !== 'empresa' && (key === 'nomeEmpresa' || key === 'logoEmpresa' || 
          key === 'telefoneFixoEmpresa' || key === 'telefoneCelularEmpresa' || key === 'enderecoEmpresa' || key === 'instagramEmpresa' || 
          key === 'facebookEmpresa' || key === 'siteEmpresa')) {
        return
      }
      
      // Não inclui campos de criança/pet se tipo for 'empresa'
      if (formData.tipo === 'empresa' && (key === 'nomeCrianca' || key === 'tipoPet' || 
          key === 'genero' || key === 'nomePai' || key === 'nomeMae' || 
          key === 'instagramPai' || key === 'instagramMae' || 
          key === 'telefonePai' || key === 'telefoneMae' || key === 'usoProprio' || key === 'telefonePessoa')) {
        return
      }

      // Se for uso próprio (crianca), não inclui dados de responsáveis nem gênero
      if (formData.tipo === 'crianca' && formData.usoProprio && (
        key === 'nomePai' || key === 'nomeMae' ||
        key === 'instagramPai' || key === 'instagramMae' ||
        key === 'telefonePai' || key === 'telefoneMae' ||
        key === 'genero'
      )) {
        return
      }
      
      // Para telefones, remove formatação e salva apenas números
      if (key === 'telefonePai' || key === 'telefoneMae' || key === 'telefoneCelularEmpresa' || key === 'telefonePessoa') {
        value = value.replace(/\D/g, '')
        // Garante que tenha o 0 no início se não tiver (e não já começar com 0)
        if (!value.startsWith('0') && (value.length === 10 || value.length === 11)) {
          value = '0' + value
        }
        // Limita a 12 dígitos (celular)
        if (value.length > 12) {
          value = value.substring(0, 12)
        }
      } else if (key === 'telefoneFixoEmpresa') {
        value = value.replace(/\D/g, '')
        // Telefone fixo: 10 dígitos (DDD + 8) ou 11 dígitos (0 + DDD + 8)
        // Garante que tenha o 0 no início se não tiver (e não já começar com 0)
        if (!value.startsWith('0') && value.length === 10) {
          value = '0' + value
        }
        // Limita a 11 dígitos (fixo)
        if (value.length > 11) {
          value = value.substring(0, 11)
        }
      }
      
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
      tipo: 'crianca',
      usoProprio: false,
      nomeCrianca: '',
      tipoPet: '',
      genero: 'menina',
      endereco: '',
      telefonePessoa: '',
      nomePai: '',
      nomeMae: '',
      instagramPai: '',
      instagramMae: '',
      telefonePai: '',
      telefoneMae: '',
      nomeEmpresa: '',
      logoEmpresa: '',
      telefoneFixoEmpresa: '',
      telefoneCelularEmpresa: '',
      enderecoEmpresa: '',
      instagramEmpresa: '',
      facebookEmpresa: '',
      siteEmpresa: ''
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
            <label>
              <span className="icon">🏷️</span>
              Tipo
            </label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="tipo"
                  value="crianca"
                  checked={formData.tipo === 'crianca'}
                  onChange={handleChange}
                />
                <span>Criança 👶</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="tipo"
                  value="pet"
                  checked={formData.tipo === 'pet'}
                  onChange={handleChange}
                />
                <span>Pet 🐾</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="tipo"
                  value="empresa"
                  checked={formData.tipo === 'empresa'}
                  onChange={handleChange}
                />
                <span>Empresa 🏢</span>
              </label>
            </div>
          </div>

          {/* Campos de Criança/Pet - Ocultos quando tipo for 'empresa' */}
          {formData.tipo !== 'empresa' && (
            <>
              {formData.tipo === 'crianca' && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="usoProprio"
                      checked={!!formData.usoProprio}
                      onChange={handleChange}
                    />
                    <span className="checkbox-text">Uso próprio (não é para criança)</span>
                  </label>
                  <p className="form-help">Se marcar, a página mostrará seu nome/telefone/endereço (sem pai/mãe)</p>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="nomeCrianca">
                  <span className="icon">{formData.tipo === 'pet' ? '🐾' : '👶'}</span>
                  {formData.tipo === 'pet' ? 'Nome do Pet' : (formData.usoProprio ? 'Nome da Pessoa' : 'Nome da Criança')}
                </label>
                <input
                  type="text"
                  id="nomeCrianca"
                  name="nomeCrianca"
                  value={formData.nomeCrianca}
                  onChange={handleChange}
                  placeholder={formData.tipo === 'pet' ? 'Ex: Rex' : (formData.usoProprio ? 'Ex: Caio' : 'Ex: Anna Julia Rugolo')}
                />
              </div>

              {formData.tipo === 'pet' && (
                <div className="form-group">
                  <label>
                    <span className="icon">🐱</span>
                    Tipo de Pet
                  </label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="tipoPet"
                        value="cachorro"
                        checked={formData.tipoPet === 'cachorro'}
                        onChange={handleChange}
                      />
                      <span>Cachorro 🐶</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="tipoPet"
                        value="gato"
                        checked={formData.tipoPet === 'gato'}
                        onChange={handleChange}
                      />
                      <span>Gato 🐱</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Gênero só faz sentido para pet e criança (quando NÃO for uso próprio) */}
              {(formData.tipo === 'pet' || (formData.tipo === 'crianca' && !formData.usoProprio)) && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="genero"
                      checked={formData.genero === 'menino'}
                      onChange={handleChange}
                    />
                    <span className="checkbox-text">{formData.tipo === 'pet' ? 'É macho' : 'É menino'}</span>
                  </label>
                  <p className="form-help">{formData.tipo === 'pet' ? 'Se não marcar, será considerado fêmea' : 'Se não marcar, será considerado menina'}</p>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="endereco">
                  <span className="icon">📍</span>
                  Endereço (opcional)
                </label>
                <input
                  type="text"
                  id="endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                  placeholder="Ex: Rua Exemplo, 123 - Bairro - Cidade/SP"
                />
              </div>

              {/* Uso próprio: um único telefone da pessoa */}
              {formData.tipo === 'crianca' && formData.usoProprio && (
                <div className="form-group">
                  <label htmlFor="telefonePessoa">
                    <span className="icon">📞</span>
                    Telefone (WhatsApp)
                  </label>
                  <input
                    type="text"
                    id="telefonePessoa"
                    name="telefonePessoa"
                    value={formData.telefonePessoa}
                    onChange={handleChange}
                    placeholder="(014) 99164-7966"
                  />
                </div>
              )}

              {/* Responsáveis (pet sempre tem tutor; criança só se NÃO for uso próprio) */}
              {(formData.tipo === 'pet' || (formData.tipo === 'crianca' && !formData.usoProprio)) && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="nomePai">
                        <span className="icon">{formData.tipo === 'pet' ? '👤' : '👨'}</span>
                        {formData.tipo === 'pet' ? 'Nome do Tutor' : 'Nome do Pai'}
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
                        {formData.tipo === 'pet' ? 'Telefone do Tutor' : 'Telefone do Pai'}
                      </label>
                      <input
                        type="text"
                        id="telefonePai"
                        name="telefonePai"
                        value={formData.telefonePai}
                        onChange={handleChange}
                        placeholder="(014) 99164-7966"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="instagramPai">
                      <span className="icon">📷</span>
                      {formData.tipo === 'pet' ? 'Instagram do Tutor (opcional)' : 'Instagram do Pai (opcional)'}
                    </label>
                    <input
                      type="text"
                      id="instagramPai"
                      name="instagramPai"
                      value={formData.instagramPai}
                      onChange={handleChange}
                      placeholder="Ex: juliorugolo"
                    />
                    <p className="form-help">Não precisa incluir o @</p>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="nomeMae">
                        <span className="icon">{formData.tipo === 'pet' ? '👤' : '👩'}</span>
                        {formData.tipo === 'pet' ? 'Nome da Tutora' : 'Nome da Mãe'}
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
                        {formData.tipo === 'pet' ? 'Telefone da Tutora' : 'Telefone da Mãe'}
                      </label>
                      <input
                        type="text"
                        id="telefoneMae"
                        name="telefoneMae"
                        value={formData.telefoneMae}
                        onChange={handleChange}
                        placeholder="(014) 99129-7163"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="instagramMae">
                      <span className="icon">📷</span>
                      {formData.tipo === 'pet' ? 'Instagram da Tutora (opcional)' : 'Instagram da Mãe (opcional)'}
                    </label>
                    <input
                      type="text"
                      id="instagramMae"
                      name="instagramMae"
                      value={formData.instagramMae}
                      onChange={handleChange}
                      placeholder="Ex: mirelarugolo"
                    />
                    <p className="form-help">Não precisa incluir o @</p>
                  </div>
                </>
              )}
            </>
          )}

          {/* Campos para Empresa */}
          {formData.tipo === 'empresa' && (
            <>
              <div className="form-group">
                <label htmlFor="nomeEmpresa">
                  <span className="icon">🏢</span>
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  id="nomeEmpresa"
                  name="nomeEmpresa"
                  value={formData.nomeEmpresa}
                  onChange={handleChange}
                  placeholder="Ex: BOTU3D"
                />
              </div>

              <div className="form-group">
                <label htmlFor="logoEmpresa">
                  <span className="icon">🖼️</span>
                  URL do Logo (opcional)
                </label>
                <input
                  type="url"
                  id="logoEmpresa"
                  name="logoEmpresa"
                  value={formData.logoEmpresa}
                  onChange={handleChange}
                  placeholder="https://exemplo.com/logo.png"
                />
                <p className="form-help">Cole a URL completa da imagem do logo</p>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="telefoneFixoEmpresa">
                    <span className="icon">📞</span>
                    Telefone Fixo (opcional)
                  </label>
                  <input
                    type="text"
                    id="telefoneFixoEmpresa"
                    name="telefoneFixoEmpresa"
                    value={formData.telefoneFixoEmpresa}
                    onChange={handleChange}
                    placeholder="(014) 3333-4444"
                  />
                  <p className="form-help">Apenas para ligação</p>
                </div>

                <div className="form-group">
                  <label htmlFor="telefoneCelularEmpresa">
                    <span className="icon">📱</span>
                    Telefone Celular (opcional)
                  </label>
                  <input
                    type="text"
                    id="telefoneCelularEmpresa"
                    name="telefoneCelularEmpresa"
                    value={formData.telefoneCelularEmpresa}
                    onChange={handleChange}
                    placeholder="(014) 99164-7966"
                  />
                  <p className="form-help">Para WhatsApp</p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="enderecoEmpresa">
                  <span className="icon">📍</span>
                  Endereço da Empresa (opcional)
                </label>
                <input
                  type="text"
                  id="enderecoEmpresa"
                  name="enderecoEmpresa"
                  value={formData.enderecoEmpresa}
                  onChange={handleChange}
                  placeholder="Ex: Rua Exemplo, 123 - Bairro - Cidade/SP"
                />
              </div>

              <div className="form-group">
                <label htmlFor="instagramEmpresa">
                  <span className="icon">📷</span>
                  Instagram (opcional)
                </label>
                <input
                  type="text"
                  id="instagramEmpresa"
                  name="instagramEmpresa"
                  value={formData.instagramEmpresa}
                  onChange={handleChange}
                  placeholder="Ex: botu.3d"
                />
                <p className="form-help">Não precisa incluir o @</p>
              </div>

              <div className="form-group">
                <label htmlFor="facebookEmpresa">
                  <span className="icon">👥</span>
                  Facebook (opcional)
                </label>
                <input
                  type="text"
                  id="facebookEmpresa"
                  name="facebookEmpresa"
                  value={formData.facebookEmpresa}
                  onChange={handleChange}
                  placeholder="Ex: botu3d"
                />
                <p className="form-help">Nome de usuário ou página do Facebook</p>
              </div>

              <div className="form-group">
                <label htmlFor="siteEmpresa">
                  <span className="icon">🌐</span>
                  Site (opcional)
                </label>
                <input
                  type="url"
                  id="siteEmpresa"
                  name="siteEmpresa"
                  value={formData.siteEmpresa}
                  onChange={handleChange}
                  placeholder="https://www.exemplo.com"
                />
              </div>
            </>
          )}

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

        <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
          <button onClick={() => navigate('/')} className="back-link">
            ← Voltar para a página principal
          </button>
        </div>
        <Footer />
      </div>
    </div>
  )
}

export default ConfigPage
