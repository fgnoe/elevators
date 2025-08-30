import { create } from 'zustand'

// Person object structure
const createPerson = (destinationFloor) => ({
  id: Math.random().toString(36).substr(2, 9),
  destinationFloor,
  timestamp: Date.now()
})

const useSimulatorStore = create((set, get) => ({
  simulators: {},
  
  initializeSimulator: (id, floorCount) => {
    const { simulators } = get()
    if (!simulators[id]) {
      set({
        simulators: {
          ...simulators,
          [id]: {
            id,
            currentFloor: 0,
            isAnimating: false,
            direction: 'up',
            speed: 1000,
            floorCount,
            floorQueues: Array(floorCount).fill(null).map(() => []), // Queue of people for each floor
            elevatorQueue: [] // Queue of people in elevator
          }
        }
      })
    }
  },
  
  setSpeed: (id, speed) => {
    const { simulators } = get()
    if (simulators[id]) {
      set({
        simulators: {
          ...simulators,
          [id]: { ...simulators[id], speed }
        }
      })
    }
  },

  resetSimulator: (id, floorCount) => {
    const { simulators } = get()
    if (simulators[id]) {
      set({
        simulators: {
          ...simulators,
          [id]: {
            ...simulators[id],
            currentFloor: 0,
            isAnimating: false,
            direction: 'up',
            floorCount,
            floorQueues: Array(floorCount).fill(null).map(() => []),
            elevatorQueue: []
          }
        }
      })
    }
  },

  addPerson: (origin, destination) => {
    const { simulators } = get()
    
    // Create person with specified destination
    const newPerson = createPerson(destination)
    
    // Add person to origin floor of ALL simulations
    const updatedSimulators = {}
    Object.keys(simulators).forEach(id => {
      const simulator = simulators[id]
      if (simulator && origin >= 0 && origin < simulator.floorCount) {
        const newFloorQueues = [...simulator.floorQueues]
        newFloorQueues[origin] = [...newFloorQueues[origin], newPerson]
        
        updatedSimulators[id] = {
          ...simulator,
          floorQueues: newFloorQueues
        }
      } else {
        updatedSimulators[id] = simulator
      }
    })
    
    set({
      simulators: updatedSimulators
    })
  },

  findNearestFloorWithPeople: (id) => {
    const { simulators } = get()
    const simulator = simulators[id]
    
    if (!simulator) return -1
    
    const { currentFloor, floorQueues } = simulator
    let nearestFloor = -1
    let shortestDistance = Infinity
    
    // Check all floors for people waiting
    for (let i = 0; i < floorQueues.length; i++) {
      if (floorQueues[i].length > 0) {
        const distance = Math.abs(currentFloor - i)
        if (distance < shortestDistance) {
          shortestDistance = distance
          nearestFloor = i
        }
      }
    }
    
    return nearestFloor
  },

  checkAndStartAutomaticMovement: (id) => {
    const { simulators } = get()
    const simulator = simulators[id]
    
    if (!simulator || simulator.isAnimating) return
    
    // First priority: deliver people already in elevator to their destinations
    if (simulator.elevatorQueue && simulator.elevatorQueue.length > 0) {
      // Find the nearest destination floor from people in elevator
      let nearestDestination = -1
      let shortestDistance = Infinity
      
      simulator.elevatorQueue.forEach(person => {
        const distance = Math.abs(simulator.currentFloor - person.destinationFloor)
        if (distance < shortestDistance) {
          shortestDistance = distance
          nearestDestination = person.destinationFloor
        }
      })
      
      if (nearestDestination !== -1) {
        get().moveElevatorToFloor(id, nearestDestination)
        return
      }
    }
    
    // Second priority: pick up people waiting on floors
    const nearestFloor = get().findNearestFloorWithPeople(id)
    
    if (nearestFloor !== -1) {
      get().moveElevatorToFloor(id, nearestFloor)
    }
  },

  moveElevatorToFloor: (id, targetFloor) => {
    const { simulators } = get()
    const simulator = simulators[id]
    
    if (!simulator || simulator.isAnimating) return
    
    const { speed, currentFloor, floorQueues, elevatorQueue } = simulator
    const direction = targetFloor > currentFloor ? 'up' : 'down'
    
    // Start animation
    set({
      simulators: {
        ...simulators,
        [id]: {
          ...simulator,
          isAnimating: true,
          currentFloor: targetFloor,
          direction
        }
      }
    })
    
    // After movement completes
    setTimeout(() => {
      const { simulators: currentSimulators } = get()
      if (currentSimulators[id]) {
        const currentSim = currentSimulators[id]
        let updatedFloorQueues = [...currentSim.floorQueues]
        let updatedElevatorQueue = [...currentSim.elevatorQueue]
        
        // Drop off people at their destination floor
        updatedElevatorQueue = updatedElevatorQueue.filter(person => {
          if (person.destinationFloor === targetFloor) {
            return false // Remove from elevator (drop off)
          }
          return true
        })
        
        // Pick up people from current floor (max 10 capacity)
        const availableCapacity = 10 - updatedElevatorQueue.length
        const peopleToPickup = updatedFloorQueues[targetFloor].slice(0, availableCapacity)
        updatedFloorQueues[targetFloor] = updatedFloorQueues[targetFloor].slice(availableCapacity)
        updatedElevatorQueue = [...updatedElevatorQueue, ...peopleToPickup]
        
        set({
          simulators: {
            ...currentSimulators,
            [id]: {
              ...currentSim,
              isAnimating: false,
              floorQueues: updatedFloorQueues,
              elevatorQueue: updatedElevatorQueue
            }
          }
        })
        
        // Continue checking for more people to serve
        setTimeout(() => {
          get().checkAndStartAutomaticMovement(id)
        }, 400)
      }
    }, speed)
  },

}))

export default useSimulatorStore