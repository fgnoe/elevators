import './App.css'
import Simulator from './Simulator'
import Timeline from './Timeline'
import useAppStore from './appStore'


function App() {
  const { simulators, floorCount, setFloorCount, elevatorCount, setElevatorCount, startSimulation } = useAppStore()

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
        <button onClick={startSimulation}>Start Simulation</button>
      </div>
      <div className="simulators-container">
        {simulators.map(simulator => (
          <Simulator key={simulator.id} simulatorId={simulator.id} />
        ))}
      </div>
    </div>
  )
}

export default App