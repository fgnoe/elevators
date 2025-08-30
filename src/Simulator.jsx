import useSimulatorStore from './simulatorStore'
import useAppStore from './appStore'
import './Simulator.css'
import { useEffect } from 'react'

function Simulator({ simulatorId }) {
  const { floorCount } = useAppStore()
  const { simulators, initializeSimulator, setSpeed } = useSimulatorStore()
  
  useEffect(() => {
    initializeSimulator(simulatorId, floorCount)
  }, [simulatorId, floorCount, initializeSimulator])
  
  const simulator = simulators[simulatorId] || { currentFloor: 0, isAnimating: false, speed: 1000, floorQueues: Array(floorCount).fill(null).map(() => []), elevatorQueue: [] }
  const { currentFloor, isAnimating, speed, floorQueues, elevatorQueue } = simulator
  
  const simulatorHeight = 300
  const elevatorHeight = simulatorHeight / floorCount
  const topPosition = (floorCount - 1 - currentFloor) * elevatorHeight + 10
  
  const floors = Array.from({ length: floorCount }, (_, i) => i)
  
  return (
    <div className="simulator-card">
      <div className="speed-control">
        <label>Speed: {speed}ms</label>
        <input 
          type="range" 
          min="1" 
          max="1000" 
          value={1001 - speed} 
          onChange={(e) => setSpeed(simulatorId, 1001 - parseInt(e.target.value))}
        />
      </div>
      <div className="building-container">
        {floors.map((floor) => (
          <div 
            key={floor}
            className="floor-label"
            style={{
              top: `${(floorCount - 1 - floor) * elevatorHeight + elevatorHeight / 2 - 10}px`
            }}
          >
            Floor: {floor + 1}
          </div>
        ))}
        <div className="building">
          {floors.map((floor) => (
            <div key={floor}>
              <div 
                className="floor-line"
                style={{
                  top: `${(floorCount - 1 - floor) * elevatorHeight}px`
                }}
              />
              <div 
                className="floor-people"
                style={{
                  top: `${(floorCount - 1 - floor) * elevatorHeight + elevatorHeight / 2 - 10}px`
                }}
              >
                {floorQueues[floor]?.length || 0}
              </div>
            </div>
          ))}
          <div 
            className={`simulator-box ${isAnimating ? 'animating' : ''}`}
            style={{
              height: `${elevatorHeight - 20}px`,
              top: `${topPosition}px`,
              transition: `top ${speed}ms ease-in-out`
            }}
          >
            <div className="elevator-people">
              {elevatorQueue?.length || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Simulator