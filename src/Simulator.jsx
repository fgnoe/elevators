import useSimulatorStore from './simulatorStore'
import useAppStore from './appStore'
import './Simulator.css'
import { useEffect } from 'react'

// Constants
const SIMULATOR_HEIGHT = 300
const MAX_ELEVATORS = 3
const ELEVATOR_SPACING = 35
const ELEVATOR_LEFT_OFFSET = 70

// Helper function to calculate floor position
const getFloorPosition = (floor, floorCount, elevatorHeight) => {
  return (floorCount - 1 - floor) * elevatorHeight
}

// Helper function to render floor labels
const renderFloorLabels = (floors, floorCount, elevatorHeight) => {
  return floors.map((floor) => (
    <div 
      key={floor}
      className="floor-label"
      style={{
        top: `${getFloorPosition(floor, floorCount, elevatorHeight) + elevatorHeight / 2 - 10}px`
      }}
    >
      Floor: {floor + 1}
    </div>
  ))
}

// Helper function to render exit counters
const renderExitCounters = (floors, floorCount, elevatorHeight, exitCounters) => {
  return floors.map((floor) => (
    <div 
      key={`exit-${floor}`}
      className="floor-exit-counter"
      style={{
        top: `${getFloorPosition(floor, floorCount, elevatorHeight) + elevatorHeight / 2 - 10}px`,
        marginRight: '30px'
      }}
    >
      {exitCounters[floor] || 0}
    </div>
  ))
}

function Simulator({ simulatorId }) {
  const { floorCount } = useAppStore()
  const { simulators, initializeSimulator } = useSimulatorStore()
  
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
  
  const elevatorHeight = SIMULATOR_HEIGHT / floorCount
  
  const floors = Array.from({ length: floorCount }, (_, i) => i)
  
  return (
    <div className="simulator-card">
      <div className="building-container">
        {renderFloorLabels(floors, floorCount, elevatorHeight)}
        {renderExitCounters(floors, floorCount, elevatorHeight, exitCounters)}
        <div className="building">
          {floors.map((floor) => (
            <div key={floor}>
              <div 
                className="floor-line"
                style={{
                  top: `${getFloorPosition(floor, floorCount, elevatorHeight)}px`
                }}
              />
              <div 
                className="floor-people"
                style={{
                  top: `${getFloorPosition(floor, floorCount, elevatorHeight) + elevatorHeight / 2 - 10}px`
                }}
              >
                {floorQueues[floor]?.length || 0}
              </div>
            </div>
          ))}
          {elevators.map((elevator, index) => {
            const topPosition = getFloorPosition(elevator.currentFloor, floorCount, elevatorHeight) + (floorCount  < 15 ? 10 : 5)
            const leftPosition = ELEVATOR_LEFT_OFFSET + (index * ELEVATOR_SPACING)
            
            // Always use animationDuration if available, otherwise don't set transition (no animation)
            const transitionStyle = elevator.animationDuration ? `top ${elevator.animationDuration}ms linear` : 'none'
            
            return (
              <div 
                key={elevator.id}
                className={`simulator-box ${elevator.isAnimating ? 'animating' : ''}`}
                style={{
                  height: `${Math.max(elevatorHeight - 20, 10)}px`,
                  top: `${topPosition}px`,
                  left: `${leftPosition}px`,
                  transition: transitionStyle,
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