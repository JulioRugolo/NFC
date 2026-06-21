import './ProgressModal.css'

export default function ProgressModal({ isOpen, progress, message, onClose }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⏳ Gerando Modelo 3D</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {progress}% - {message}
            </div>
          </div>
          
          <div className="progress-steps">
            <div className={`step ${progress >= 25 ? 'completed' : progress >= 15 ? 'active' : ''}`}>
              <span className="step-icon">1</span>
              <span className="step-label">Preparando modelo...</span>
            </div>
            <div className={`step ${progress >= 60 ? 'completed' : progress >= 50 ? 'active' : ''}`}>
              <span className="step-icon">2</span>
              <span className="step-label">Gerando base...</span>
            </div>
            <div className={`step ${progress >= 85 ? 'completed' : progress >= 75 ? 'active' : ''}`}>
              <span className="step-icon">3</span>
              <span className="step-label">Gerando texto...</span>
            </div>
            <div className={`step ${progress >= 100 ? 'completed' : progress >= 92 ? 'active' : ''}`}>
              <span className="step-icon">4</span>
              <span className="step-label">Finalizando...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
