import './Footer.css'

export default function Footer() {
  const handleWhatsApp = (phone, showPromo = false) => {
    if (phone) {
      const cleaned = phone.replace(/\D/g, '')
      const whatsappUrl = `https://wa.me/55${cleaned}`
      
      if (showPromo) {
        // Aqui poderia abrir modal de promoção se necessário
        window.open(whatsappUrl, '_blank')
      } else {
        window.open(whatsappUrl, '_blank')
      }
    }
  }

  const formatPhone = (phone) => {
    if (!phone) return ''
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 12) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 8)}-${cleaned.substring(8)}`
    } else if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`
    }
    return phone
  }

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h3 className="footer-logo">BOTU3D</h3>
          <p className="footer-tagline">Tags NFC Personalizadas</p>
        </div>
        
        <div className="footer-contact">
          <button 
            className="footer-btn footer-btn-whatsapp"
            onClick={() => handleWhatsApp('14991647966', false)}
          >
            <span className="footer-btn-icon">📱</span>
            <div className="footer-btn-content">
              <span className="footer-btn-label">WhatsApp</span>
              <span className="footer-btn-phone">{formatPhone('14991647966')}</span>
            </div>
          </button>
          
          <button 
            className="footer-btn footer-btn-whatsapp"
            onClick={() => handleWhatsApp('14991297163', false)}
          >
            <span className="footer-btn-icon">📱</span>
            <div className="footer-btn-content">
              <span className="footer-btn-label">WhatsApp</span>
              <span className="footer-btn-phone">{formatPhone('14991297163')}</span>
            </div>
          </button>
          
          <button 
            className="footer-btn footer-btn-instagram"
            onClick={() => window.open('https://instagram.com/botu.3d', '_blank')}
          >
            <span className="footer-btn-icon">📷</span>
            <div className="footer-btn-content">
              <span className="footer-btn-label">Instagram</span>
              <span className="footer-btn-handle">@botu.3d</span>
            </div>
          </button>
        </div>
      </div>
    </footer>
  )
}
