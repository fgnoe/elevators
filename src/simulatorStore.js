import { create } from 'zustand'

// Constants
const ELEVATOR_CAPACITY = 10
const MOVEMENT_DELAY_MS = 400

// Person object structure
const createPerson = (destinationFloor) => ({
  id: Math.random().toString(36).substr(2, 9),
  destinationFloor,
  timestamp: Date.now()
})

// Helper function to drop off passengers at their destination floor
const dropOffPassengers = (elevatorQueue, targetFloor, exitCounters) => {
  let exitCount = 0
  const updatedQueue = elevatorQueue.filter(person => {
    if (person.destinationFloor === targetFloor) {
      exitCount++
      return false // Remove from elevator (drop off)
    }
    return true
  })
  
  const updatedExitCounters = [...exitCounters]
  updatedExitCounters[targetFloor] += exitCount
  
  return { updatedQueue, updatedExitCounters }
}

// Helper function to pick up passengers from current floor
const pickUpPassengers = (elevatorQueue, floorQueue, maxCapacity = ELEVATOR_CAPACITY) => {
  const availableCapacity = maxCapacity - elevatorQueue.length
  const peopleToPickup = floorQueue.slice(0, availableCapacity)
  const updatedElevatorQueue = [...elevatorQueue, ...peopleToPickup]
  const remainingPeople = floorQueue.slice(availableCapacity)
  
  return { updatedElevatorQueue, remainingPeople }
}

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
            floorCount,
            speed: 1000,
            floorQueues: Array(floorCount).fill(null).map(() => []), // Queue of people for each floor
            exitCounters: Array(floorCount).fill(0), // Counter of people who exited at each floor
            elevators: [{
              id: 0,
              currentFloor: 0,
              isAnimating: false,
              direction: 'up',
              elevatorQueue: [] // Queue of people in elevator
            }]
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
            floorCount,
            floorQueues: Array(floorCount).fill(null).map(() => []),
            exitCounters: Array(floorCount).fill(0),
            elevators: simulators[id].elevators.map(elevator => ({
              ...elevator,
              currentFloor: 0,
              isAnimating: false,
              direction: 'up',
              elevatorQueue: []
            }))
          }
        }
      })
    }
  },

  addElevator: (id) => {
    const { simulators } = get()
    const simulator = simulators[id]
    if (simulator && simulator.elevators.length < 3) {
      const newElevatorId = simulator.elevators.length
      const newElevator = {
        id: newElevatorId,
        currentFloor: 0,
        isAnimating: false,
        direction: 'up',
        elevatorQueue: []
      }
      
      set({
        simulators: {
          ...simulators,
          [id]: {
            ...simulator,
            elevators: [...simulator.elevators, newElevator]
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
    
    // Trigger elevator movement check for all simulators after adding person
    Object.keys(updatedSimulators).forEach(id => {
      get().processElevatorMovement(id)
    })
  },

  findNearestFloorWithPeople: (id, elevator) => {
    const { simulators } = get()
    const simulator = simulators[id]
    
    if (!simulator) return -1
    
    const { floorQueues } = simulator
    let nearestFloor = -1
    let shortestDistance = Infinity
    
    // Check all floors for people waiting
    for (let i = 0; i < floorQueues.length; i++) {
      if (floorQueues[i].length > 0) {
        const distance = Math.abs(elevator.currentFloor - i)
        if (distance < shortestDistance) {
          shortestDistance = distance
          nearestFloor = i
        }
      }
    }
    
    return nearestFloor
  },

  processElevatorMovement: (id) => {
    const { simulators } = get()
    const simulator = simulators[id]
    
    if (!simulator) return
    
    // Check each elevator for movement opportunities
    simulator.elevators.forEach(elevator => {
      if (elevator.isAnimating) return
      
      // Check if elevator is not full and there are people waiting on current floor
      const currentFloorQueue = simulator.floorQueues[elevator.currentFloor]
      const hasCapacity = elevator.elevatorQueue.length < ELEVATOR_CAPACITY
      const hasPeopleOnCurrentFloor = currentFloorQueue && currentFloorQueue.length > 0
      
      if (hasCapacity && hasPeopleOnCurrentFloor) {
        // Pick up people from current floor before moving
        const availableCapacity = ELEVATOR_CAPACITY - elevator.elevatorQueue.length
        const peopleToPickup = currentFloorQueue.slice(0, availableCapacity)
        
        // Update elevator queue and floor queue
        const updatedElevatorQueue = [...elevator.elevatorQueue, ...peopleToPickup]
        const updatedFloorQueue = currentFloorQueue.slice(availableCapacity)
        
        // Update the state
        const updatedFloorQueues = [...simulator.floorQueues]
        updatedFloorQueues[elevator.currentFloor] = updatedFloorQueue
        
        const updatedElevators = simulator.elevators.map((elev, idx) => 
          elev.id === elevator.id 
            ? { ...elev, elevatorQueue: updatedElevatorQueue }
            : elev
        )
        
        set({
          simulators: {
            ...simulators,
            [id]: {
              ...simulator,
              elevators: updatedElevators,
              floorQueues: updatedFloorQueues
            }
          }
        })
      }
      
      // First priority: deliver people already in elevator to their destinations
      if (elevator.elevatorQueue && elevator.elevatorQueue.length > 0) {
        // Find the nearest destination floor from people in elevator
        let nearestDestination = -1
        let shortestDistance = Infinity
        
        elevator.elevatorQueue.forEach(person => {
          const distance = Math.abs(elevator.currentFloor - person.destinationFloor)
          if (distance < shortestDistance) {
            shortestDistance = distance
            nearestDestination = person.destinationFloor
          }
        })
        
        if (nearestDestination !== -1) {
          get().moveElevatorToFloor(id, elevator.id, nearestDestination)
          return
        }
      }
      
      // Second priority: pick up people waiting on floors
      const nearestFloor = get().findNearestFloorWithPeople(id, elevator)
      
      if (nearestFloor !== -1) {
        get().moveElevatorToFloor(id, elevator.id, nearestFloor)
      }
    })
  },

  moveElevatorToFloor: (id, elevatorId, targetFloor) => {
    const { simulators } = get()
    const simulator = simulators[id]
    
    if (!simulator) return
    
    const elevator = simulator.elevators[elevatorId]
    if (!elevator || elevator.isAnimating) return
    
    const { speed, floorQueues } = simulator
    const direction = targetFloor > elevator.currentFloor ? 'up' : 'down'
    
    // Start animation
    const updatedElevators = simulator.elevators.map((elev, idx) => 
      idx === elevatorId 
        ? { ...elev, isAnimating: true, currentFloor: targetFloor, direction }
        : elev
    )
    
    set({
      simulators: {
        ...simulators,
        [id]: {
          ...simulator,
          elevators: updatedElevators
        }
      }
    })
    
    // After movement completes
    setTimeout(() => {
      const { simulators: currentSimulators } = get()
      if (currentSimulators[id]) {
        const currentSim = currentSimulators[id]
        const currentElevator = currentSim.elevators[elevatorId]
        let updatedFloorQueues = [...currentSim.floorQueues]
        let updatedElevatorQueue = [...currentElevator.elevatorQueue]
        let updatedExitCounters = [...currentSim.exitCounters]
        
        // Drop off passengers at their destination floor
        const dropOffResult = dropOffPassengers(updatedElevatorQueue, targetFloor, updatedExitCounters)
        updatedElevatorQueue = dropOffResult.updatedQueue
        updatedExitCounters = dropOffResult.updatedExitCounters
        
        // Pick up passengers from current floor
        const pickUpResult = pickUpPassengers(updatedElevatorQueue, updatedFloorQueues[targetFloor])
        updatedElevatorQueue = pickUpResult.updatedElevatorQueue
        updatedFloorQueues[targetFloor] = pickUpResult.remainingPeople
        
        // Update this elevator's state
        const updatedElevators = currentSim.elevators.map((elev, idx) => 
          idx === elevatorId 
            ? { ...elev, isAnimating: false, elevatorQueue: updatedElevatorQueue }
            : elev
        )
        
        set({
          simulators: {
            ...currentSimulators,
            [id]: {
              ...currentSim,
              elevators: updatedElevators,
              floorQueues: updatedFloorQueues,
              exitCounters: updatedExitCounters
            }
          }
        })
        
        // Continue checking for more people to serve
        setTimeout(() => {
          get().processElevatorMovement(id)
        }, MOVEMENT_DELAY_MS)
      }
    }, speed)
  },

}))

export default useSimulatorStore