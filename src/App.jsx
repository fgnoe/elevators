import './App.css'
import Simulator from './Simulator'
import Timeline from './Timeline'
import ReportModal from './ReportModal'
import useAppStore from './appStore'
import useSimulatorStore from './simulatorStore'
import {useEffect, useState} from "react";


function App() {
  const { simulators, floorCount, setFloorCount, elevatorCount, setElevatorCount, elevatorSpeed, setElevatorSpeed, startSimulation, isSimulationRunning } = useAppStore()
  const { getPerformanceReport } = useSimulatorStore()
  
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportData, setReportData] = useState(null)

    useEffect(() => {
        setElevatorCount(3)
    }, []);

    // Handle timed report - show report 36 seconds after simulation starts
    useEffect(() => {
      if (isSimulationRunning) {
        const reportTimer = setTimeout(() => {
          const report = getPerformanceReport()
          setReportData(report)
          setShowReportModal(true)
        }, 36000) // 36 seconds
      }
    }, [isSimulationRunning])

    // Reset report when new simulation starts
    useEffect(() => {
      if (isSimulationRunning) {
        setShowReportModal(false)
      }
    }, [isSimulationRunning])
  return (
    <div className="App">
      <Timeline />
      <div className="controls">
        <div>
          <label>Pisos: {floorCount}</label>
          <input 
            type="range" 
            min="4"
            max="20"
            value={floorCount} 
            onChange={(e) => setFloorCount(parseInt(e.target.value))}
          />
        </div>
        <div>
          <label>Elevadores: {elevatorCount}</label>
          <input 
            type="range" 
            min="1"
            max="3" 
            value={elevatorCount} 
            onChange={(e) => setElevatorCount(parseInt(e.target.value))}
          />
        </div>
        <div>
          <label>Velocidad: {elevatorSpeed}ms</label>
          <input 
            type="range" 
            min="1"
            max="400"
            value={401 - elevatorSpeed}
            onChange={(e) => setElevatorSpeed(401 - parseInt(e.target.value))}
          />
        </div>
        <button onClick={startSimulation} disabled={isSimulationRunning}>
          {isSimulationRunning ? 'Simulación en Curso...' : 'Iniciar Simulación'}
        </button>
      </div>
      <div className="simulators-container">
        {simulators.map(simulator => (
          <Simulator key={simulator.id} simulatorId={simulator.id} />
        ))}
      </div>
      
      <ReportModal 
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportData={reportData}
      />
      
      <footer className="bottom-banner">
        <span>Hecho por Noe Flores</span>
        <div className="footer-links">
          <a href="https://github.com/fgnoe/elevators" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href="https://www.linkedin.com/in/nnflores/" target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App