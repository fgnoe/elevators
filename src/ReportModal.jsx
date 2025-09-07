import './ReportModal.css'

function ReportModal({ isOpen, onClose, reportData }) {
  if (!isOpen) return null

  const basicData = reportData?.basic || { avgWaitingTime: 0, avgTravelTime: 0, totalPeople: 0 }
  const advancedData = reportData?.advanced || { avgWaitingTime: 0, avgTravelTime: 0, totalPeople: 0 }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Simulation Performance Report</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <table className="report-table">
            <thead>
              <tr>
                <th></th>
                <th>Basic Simulator</th>
                <th>Advanced Simulator</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="metric-label">Average Waiting Time</td>
                <td className="metric-value">{basicData.avgWaitingTime}ms</td>
                <td className="metric-value">{advancedData.avgWaitingTime}ms</td>
              </tr>
              <tr>
                <td className="metric-label">Average Travel Time</td>
                <td className="metric-value">{basicData.avgTravelTime}ms</td>
                <td className="metric-value">{advancedData.avgTravelTime}ms</td>
              </tr>
              <tr>
                <td className="metric-label">Total People Served</td>
                <td className="metric-value">{basicData.totalPeople}</td>
                <td className="metric-value">{advancedData.totalPeople}</td>
              </tr>
            </tbody>
          </table>
          
          <div className="report-summary">
            <h3>Summary</h3>
            <p>
              The simulation has completed with all people successfully transported to their destinations.
              This report compares the performance between the basic and advanced elevator algorithms.
            </p>
            <ul>
              <li><strong>Waiting Time:</strong> Time from person creation to pickup</li>
              <li><strong>Travel Time:</strong> Time from pickup to dropoff</li>
            </ul>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="close-modal-button" onClick={onClose}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReportModal