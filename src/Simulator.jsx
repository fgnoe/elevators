import useSimulatorStore from './simulatorStore'
import useAppStore from './appStore'
import './Simulator.css'
import { useEffect } from 'react'

function Simulator({ simulatorId }) {
  const { floorCount } = useAppStore()
  const { simulators, initializeSimulator, setSpeed, addElevator } = useSimulatorStore()
  
  useEffect(() => {
    initializeSimulator(simulatorId, floorCount)
  }, [simulatorId, floorCount, initializeSimulator])
  
  const simulator = simulators[simulatorId] || { 
    speed: 1000, 
    floorQueues: Array(floorCount).fill(null).map(() => []), 
    exitCounters: Array(floorCount).fill(0),
    elevators: [{ id: 0, currentFloor: 0, isAnimating: false, direction: 'up', elevatorQueue: [] }] 
  }
  const { speed, floorQueues, exitCounters, elevators } = simulator
  
  const simulatorHeight = 300
  const elevatorHeight = simulatorHeight / floorCount
  
  const floors = Array.from({ length: floorCount }, (_, i) => i)
  
  const handleAddElevator = () => {
    addElevator(simulatorId)
  }
  
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
      <div className="elevator-controls">
        <button 
          onClick={handleAddElevator}
          disabled={elevators.length >= 3}
          className="add-elevator-btn"
        >
          + Add Elevator ({elevators.length}/3)
        </button>
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
        {floors.map((floor) => (
          <div 
            key={`exit-${floor}`}
            className="floor-exit-counter"
            style={{
              top: `${(floorCount - 1 - floor) * elevatorHeight + elevatorHeight / 2 - 10}px`,
              marginRight: '30px'
            }}
          >
            {exitCounters[floor] || 0}
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
          {elevators.map((elevator, index) => {
            const topPosition = (floorCount - 1 - elevator.currentFloor) * elevatorHeight + 10
            const leftPosition = 70 + (index * 35) // Space elevators horizontally
            
            return (
              <div 
                key={elevator.id}
                className={`simulator-box ${elevator.isAnimating ? 'animating' : ''}`}
                style={{
                  height: `${elevatorHeight - 20}px`,
                  top: `${topPosition}px`,
                  left: `${leftPosition}px`,
                  transition: `top ${speed}ms ease-in-out`,
                  transform: 'none' // Override the center transform
                }}
              >
                <div className="elevator-people">
                  {elevator.elevatorQueue?.length || 0}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Simulator