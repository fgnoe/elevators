import './App.css'
import Simulator from './Simulator'
import AddSimulatorCard from './AddSimulatorCard'
import useAppStore from './appStore'

function App() {
  const { simulators, floorCount, setFloorCount, addPerson } = useAppStore()

  return (
    <div className="App">
      <div className="controls">
        <div>
          <label>Floors: {floorCount}</label>
          <input 
            type="range" 
            min="4"
            max="10" 
            value={floorCount} 
            onChange={(e) => setFloorCount(parseInt(e.target.value))}
          />
        </div>
        <button onClick={addPerson}>Add Person</button>
      </div>
      <div className="simulators-container">
        {simulators.map(simulator => (
          <Simulator key={simulator.id} simulatorId={simulator.id} />
        ))}
        {simulators.length < 3 && <AddSimulatorCard />}
      </div>
    </div>
  )
}

export default App