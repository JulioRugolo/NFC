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

  const startBatch = async (mode) => {
    setError('')
    setStarting(true)
    setShowProgress(true)
    setStatus(null)
    try {
      const r = await fetch(`${API_URL}/api/batch/keychains/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
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

  const promoterLots = status?.mode === 'promoters' ? (status.lots || []) : (preview?.lots || [])
  const promoterSummary = status?.mode === 'promoters' ? status.summary : preview?.summary
  const supervisorList = status?.mode === 'supervisors'
    ? (status.supervisors || [])
    : (preview?.supervisorKeychains?.supervisors || [])
  const supervisorSummary = status?.mode === 'supervisors'
    ? status.summary
    : preview?.supervisorKeychains?.summary

  const progress = status?.progress
  const progressPercent = progress?.percent ?? 0
  const progressMessage = progress
    ? (status?.mode === 'supervisors'
      ? `Supervisor: ${progress.supervisorName || '…'} (${progress.supervisorIndex || 0}/${progress.supervisorTotal || 0})`
      : `${progress.supervisorName || '…'} — ${progress.promoterName || ''} (${progress.promoterIndex || 0}/${progress.promoterTotal || 0})`)
    : 'Preparando lotes…'

  const busy = starting || status?.status === 'running' || status?.status === 'queued'
  const supervisorsDone = status?.mode === 'supervisors' && status?.status === 'completed' && status?.downloadReady

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
            com um arquivo 3D por promotor. No lote: <strong>primeiro nome</strong> na linha 1,
            <strong>sobrenome</strong> na linha 2, <strong>3MF em 2 peças</strong> (base preta +
            letra branca) para o fatiador.
          </p>
          <div className="batch-mode-nav">
            <Link to="/keychain" className="batch-nav-link">Gerar chaveiro individual</Link>
            <span className="batch-nav-current">Gerar chaveiros por lote</span>
          </div>
        </header>

        {error && <div className="batch-error">{error}</div>}

        <section className="batch-section">
          <h2 className="batch-section-title">Chaveiros em lote (lista)</h2>
          <p className="batch-section-desc">
            Gera um ZIP com os nomes da lista atual: <strong>nome</strong> na linha 1 e
            <strong> sobrenome</strong> na linha 2. O 3MF sai como <strong>uma peça</strong> com
            duas cores (base + letra).
          </p>

          {supervisorSummary && (
            <div className="batch-summary">
              <div>
                <strong>Nomes no lote:</strong>{' '}
                {supervisorSummary.totalSupervisors}
              </div>
              {status?.mode === 'supervisors' && (
                <>
                  <div><strong>Gerados:</strong> {supervisorSummary.generated ?? 0}</div>
                  <div><strong>Falhas:</strong> {supervisorSummary.failed ?? 0}</div>
                </>
              )}
            </div>
          )}

          <div className="batch-actions">
            <button
              type="button"
              className="btn-generate btn-generate-secondary"
              onClick={() => startBatch('supervisors')}
              disabled={busy}
            >
              {status?.mode === 'supervisors' && status?.status === 'running'
                ? 'Gerando lote…'
                : 'Gerar chaveiros do lote'}
            </button>
            {supervisorsDone && (
              <button
                type="button"
                className="btn-download"
                onClick={() => downloadZip(status.zipFilename || 'chaveiros_lote.zip')}
              >
                Baixar ZIP do lote
              </button>
            )}
          </div>

          <div className="batch-table-wrap">
            <table className="batch-table">
              <thead>
                <tr>
                  <th>Nome no chaveiro</th>
                  <th>Arquivo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {supervisorList.map((s) => (
                  <tr key={s.filenameBase || s.name}>
                    <td>
                      <div className="batch-supervisor-name">{s.name}</div>
                      {(s.line1 || s.line2) && (
                        <div className="batch-zip-name">
                          Linha 1: {s.line1 || '—'} · Linha 2: {s.line2 || '—'}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="batch-zip-name">
                        {s.filename || `${s.filenameBase}.3mf`}
                      </div>
                    </td>
                    <td>
                      {s.status === 'ready' && 'Pronto'}
                      {s.status === 'generating' && 'Gerando…'}
                      {s.status === 'failed' && `Falhou${s.failure ? `: ${s.failure}` : ''}`}
                      {(!s.status || s.status === 'pending') && (
                        status?.mode === 'supervisors' ? 'Na fila' : 'Aguardando'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="batch-section">
          <h2 className="batch-section-title">Chaveiros dos promotores (por lote)</h2>
          <p className="batch-section-desc">
            Um ZIP por supervisor, com um chaveiro para cada promotor da equipe.
          </p>

          {promoterSummary && (
            <div className="batch-summary">
              <div><strong>Supervisores (lotes finais):</strong> {promoterSummary.finalLots}</div>
              <div><strong>Promotores / chaveiros:</strong> {promoterSummary.totalPromoters}</div>
              {status?.mode === 'promoters' && (
                <>
                  <div><strong>Gerados:</strong> {promoterSummary.generated ?? 0}</div>
                  <div><strong>Falhas:</strong> {promoterSummary.failed ?? 0}</div>
                </>
              )}
            </div>
          )}

          <div className="batch-actions">
            <button
              type="button"
              className="btn-generate"
              onClick={() => startBatch('promoters')}
              disabled={busy}
            >
              {status?.mode === 'promoters' && status?.status === 'running'
                ? 'Gerando lotes…'
                : 'Gerar todos os lotes de promotores'}
            </button>
            {status?.mode === 'promoters' && status?.status === 'completed' && (
              <button type="button" className="btn-download" onClick={downloadAll}>
                Baixar todos os lotes (.ZIP)
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
                {promoterLots.map((lot) => (
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
                      {(!lot.status || lot.status === 'pending') && (
                        status?.mode === 'promoters' ? 'Na fila' : 'Aguardando'
                      )}
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
                      {lot.downloadReady && status?.mode === 'promoters' && (
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
        </section>

        {status?.status === 'completed' && status?.mode === 'promoters' && (
          <div className="batch-done">
            Lotes gerados — baixe os ZIPs acima. Formato: o mesmo do gerador individual (3MF, ou STL se 3MF falhar).
          </div>
        )}

        {supervisorsDone && (
          <div className="batch-done">
            Lote de chaveiros pronto — baixe o ZIP acima.
          </div>
        )}

        <Footer />
      </div>
    </div>
  )
}

export default KeychainBatchPage
