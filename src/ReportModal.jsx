import './ReportModal.css'

function ReportModal({ isOpen, onClose, reportData }) {
  if (!isOpen) return null

  const basicData = reportData?.basic || { avgWaitingTime: 0, avgTravelTime: 0, totalPeople: 0 }
  const advancedData = reportData?.advanced || { avgWaitingTime: 0, avgTravelTime: 0, totalPeople: 0 }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Reporte de Rendimiento de Simulacion</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <table className="report-table">
            <thead>
              <tr>
                <th></th>
                <th>Simulador Basico</th>
                <th>Simulador Avanzado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="metric-label">Tiempo de Espera Promedio</td>
                <td className="metric-value">{basicData.avgWaitingTime}ms</td>
                <td className="metric-value">{advancedData.avgWaitingTime}ms</td>
              </tr>
              <tr>
                <td className="metric-label">Tiempo de Viaje Promedio</td>
                <td className="metric-value">{basicData.avgTravelTime}ms</td>
                <td className="metric-value">{advancedData.avgTravelTime}ms</td>
              </tr>
              <tr>
                <td className="metric-label">Total de Personas Atendidas</td>
                <td className="metric-value">{basicData.totalPeople}</td>
                <td className="metric-value">{advancedData.totalPeople}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="modal-footer">
          <button className="close-modal-button" onClick={onClose}>
            Cerrar Reporte
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReportModal