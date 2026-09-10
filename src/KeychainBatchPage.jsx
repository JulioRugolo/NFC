import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import './ConfigPage.css'
import './KeychainPage.css'
import './KeychainBatchPage.css'
import ProgressModal from './ProgressModal'
import Footer from './Footer'

const API_URL = import.meta.env.VITE_API_URL || ''

function KeychainBatchPage() {
  const [preview, setPreview] = useState(null)
  const [jobId, setJobId] = useState(null)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const pollRef = useRef(null)

  useEffect(() => {
    fetch(`${API_URL}/api/batch/keychains/preview`)
      .then((r) => r.json())
      .then(setPreview)
      .catch((e) => setError(e.message))

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  useEffect(() => {
    if (!jobId) return undefined

    const poll = async () => {
      try {
        const r = await fetch(`${API_URL}/api/batch/keychains/${jobId}`)
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Falha ao consultar job')
        setStatus(data)
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(pollRef.current)
          pollRef.current = null
          setShowProgress(false)
          setStarting(false)
        }
      } catch (e) {
        setError(e.message)
      }
    }

    poll()
    pollRef.current = setInterval(poll, 1500)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [jobId])

  const startBatch = async () => {
    setError('')
    setStarting(true)
    setShowProgress(true)
    setStatus(null)
    try {
      const r = await fetch(`${API_URL}/api/batch/keychains/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Falha ao iniciar lote')
      setJobId(data.jobId)
    } catch (e) {
      setError(e.message)
      setStarting(false)
      setShowProgress(false)
    }
  }

  const downloadZip = (zipFilename) => {
    window.location.href = `${API_URL}/api/batch/keychains/${jobId}/zip/${encodeURIComponent(zipFilename)}`
  }

  const downloadAll = () => {
    window.location.href = `${API_URL}/api/batch/keychains/${jobId}/download-all`
  }

  const lots = status?.lots || preview?.lots || []
  const summary = status?.summary || preview?.summary
  const progress = status?.progress
  const progressPercent = progress?.percent ?? 0
  const progressMessage = progress
    ? `${progress.supervisorName || '…'} — ${progress.promoterName || ''} (${progress.promoterIndex || 0}/${progress.promoterTotal || 0})`
    : 'Preparando lotes…'

  return (
    <div className="keychain-page">
      <ProgressModal
        isOpen={showProgress}
        progress={progressPercent}
        message={progressMessage}
        onClose={() => {
          if (status?.status === 'completed' || status?.status === 'failed') {
            setShowProgress(false)
          }
        }}
      />

      <div className="keychain-container">
        <header className="keychain-header">
          <h1>Lotes de chaveiros por supervisor</h1>
          <p>
            Usa o mesmo gerador OpenSCAD do chaveiro individual. Cada supervisor gera um ZIP
            com um arquivo 3D por promotor. No lote, o <strong>primeiro nome</strong> vai na
            linha 1 e o <strong>sobrenome</strong> na linha 2.
          </p>
          <div className="batch-mode-nav">
            <Link to="/keychain" className="batch-nav-link">Gerar chaveiro individual</Link>
            <span className="batch-nav-current">Gerar chaveiros por lote</span>
          </div>
        </header>

        {error && <div className="batch-error">{error}</div>}

        {summary && (
          <div className="batch-summary">
            <div><strong>Supervisores (lotes finais):</strong> {summary.finalLots}</div>
            <div><strong>Promotores / chaveiros:</strong> {summary.totalPromoters}</div>
            {status && (
              <>
                <div><strong>Gerados:</strong> {summary.generated ?? 0}</div>
                <div><strong>Falhas:</strong> {summary.failed ?? 0}</div>
              </>
            )}
          </div>
        )}

        <div className="batch-actions">
          <button
            type="button"
            className="btn-generate"
            onClick={startBatch}
            disabled={starting || status?.status === 'running' || status?.status === 'queued'}
          >
            {status?.status === 'running' ? 'Gerando lotes…' : 'Gerar todos os lotes'}
          </button>
          {status?.status === 'completed' && (
            <button type="button" className="btn-download" onClick={downloadAll}>
              Baixar todos os supervisores (.ZIP)
            </button>
          )}
        </div>

        <div className="batch-table-wrap">
          <table className="batch-table">
            <thead>
              <tr>
                <th>Supervisor</th>
                <th>Qtd</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {lots.map((lot) => (
                <tr key={lot.zipFilename}>
                  <td>
                    <div className="batch-supervisor-name">{lot.supervisor}</div>
                    <div className="batch-zip-name">{lot.zipFilename}</div>
                  </td>
                  <td>{lot.promoterCount}</td>
                  <td>
                    {lot.status === 'ready' && 'Pronto'}
                    {lot.status === 'partial' && `Parcial (${lot.success} ok / ${lot.failed} falha)`}
                    {lot.status === 'generating' && 'Gerando…'}
                    {lot.status === 'failed' && 'Falhou'}
                    {(!lot.status || lot.status === 'pending') && (status ? 'Na fila' : 'Aguardando')}
                    {lot.failures?.length > 0 && (
                      <ul className="batch-failures">
                        {lot.failures.map((f) => (
                          <li key={f.promoter}>
                            <strong>{f.promoter}</strong>: {f.reason}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>
                    {lot.downloadReady && (
                      <button
                        type="button"
                        className="btn-download-sm"
                        onClick={() => downloadZip(lot.zipFilename)}
                      >
                        Baixar ZIP
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {status?.status === 'completed' && (
          <div className="batch-done">
            Lotes gerados — baixe os ZIPs acima. Formato: o mesmo do gerador individual (3MF, ou STL se 3MF falhar).
          </div>
        )}

        <Footer />
      </div>
    </div>
  )
}

export default KeychainBatchPage
