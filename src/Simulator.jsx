import useSimulatorStore from './simulatorStore'
import useAppStore from './appStore'
import './Simulator.css'
import { useEffect } from 'react'

// Constants
const SIMULATOR_HEIGHT = 300
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
      Piso: {floor + 1}
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
  const { speed, floorQueues, exitCounters, elevators, type } = simulator
  
  const elevatorHeight = SIMULATOR_HEIGHT / floorCount
  
  const floors = Array.from({ length: floorCount }, (_, i) => i)
  
  // Get the display title based on simulator type
  const getSimulatorTitle = (type) => {
    if (type === 'advanced') return 'Inteligente'
    return 'Basico'
  }
  
  return (
    <div className="simulator-card">
      <div className="simulator-title">
        {getSimulatorTitle(type)}
      </div>
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
            // FIX TELEPORTATION: Use correct floor for positioning
            // During animation: start from startFloor, animate to targetFloor
            // When not animating: use currentFloor
            const displayFloor = elevator.isAnimating && elevator.startFloor !== undefined
              ? elevator.startFloor
              : elevator.currentFloor

            const topPosition = getFloorPosition(displayFloor, floorCount, elevatorHeight) + (floorCount  < 15 ? 10 : 5)
            const leftPosition = ELEVATOR_LEFT_OFFSET + (index * ELEVATOR_SPACING)

            // Calculate target position for animation
            let animationStyle = {}
            if (elevator.isAnimating && elevator.targetFloor !== undefined && elevator.animationDuration) {
              const targetTopPosition = getFloorPosition(elevator.targetFloor, floorCount, elevatorHeight) + (floorCount < 15 ? 10 : 5)
              animationStyle = {
                transition: `top ${elevator.animationDuration}ms linear`,
                top: `${targetTopPosition}px` // Animate TO the target position
              }
            } else {
              animationStyle = {
                transition: 'none',
                top: `${topPosition}px` // Static position
              }
            }

            return (
              <div
                key={elevator.id}
                className={`simulator-box ${elevator.isAnimating ? 'animating' : ''}`}
                style={{
                  height: `${Math.max(elevatorHeight - 20, 10)}px`,
                  left: `${leftPosition}px`,
                  transform: 'none', // Override the center transform
                  ...animationStyle
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