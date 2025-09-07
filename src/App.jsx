import './App.css'
import Simulator from './Simulator'
import Timeline from './Timeline'
import ReportModal from './ReportModal'
import useAppStore from './appStore'
import useSimulatorStore from './simulatorStore'
import {useEffect, useState} from "react";


function App() {
  const { simulators, floorCount, setFloorCount, elevatorCount, setElevatorCount, elevatorSpeed, setElevatorSpeed, startSimulation } = useAppStore()
  const { areAllSimulatorsEmpty, getPerformanceReport } = useSimulatorStore()
  
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [hasShownReport, setHasShownReport] = useState(false)

    useEffect(() => {
        setElevatorCount(3)
    }, []);

    // Check if all simulators are empty and show report
    useEffect(() => {
      const checkInterval = setInterval(() => {
        if (!hasShownReport && areAllSimulatorsEmpty()) {
          const report = getPerformanceReport()
          // Only show report if there's actual data (people were processed)
          const hasData = Object.values(report).some(data => data.totalPeople > 0)
          if (hasData) {
            setReportData(report)
            setShowReportModal(true)
            setHasShownReport(true)
          }
        }
      }, 1000) // Check every second

      return () => clearInterval(checkInterval)
    }, [areAllSimulatorsEmpty, getPerformanceReport, hasShownReport])

    // Reset report flag when simulation starts
    useEffect(() => {
      setHasShownReport(false)
      setShowReportModal(false)
    }, [startSimulation])
  return (
    <div className="App">
      <Timeline />
      <div className="controls">
        <div>
          <label>Floors: {floorCount}</label>
          <input 
            type="range" 
            min="4"
            max="20"
            value={floorCount} 
            onChange={(e) => setFloorCount(parseInt(e.target.value))}
          />
        </div>
        <div>
          <label>Elevators: {elevatorCount}</label>
          <input 
            type="range" 
            min="1"
            max="3" 
            value={elevatorCount} 
            onChange={(e) => setElevatorCount(parseInt(e.target.value))}
          />
        </div>
        <div>
          <label>Speed: {elevatorSpeed}ms</label>
          <input 
            type="range" 
            min="1"
            max="400"
            value={401 - elevatorSpeed}
            onChange={(e) => setElevatorSpeed(401 - parseInt(e.target.value))}
          />
        </div>
        <button onClick={startSimulation}>Start Simulation</button>
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
    </div>
  )
}

export default App