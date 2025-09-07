import { create } from 'zustand'
import useAppStore from './appStore'

// Constants
const ELEVATOR_CAPACITY = 10

// Person object structure
const createPerson = (destinationFloor) => ({
  id: Math.random().toString(36).substr(2, 9),
  destinationFloor,
  timestamp: Date.now()
})

// Helper function to drop off passengers at their destination floor
const dropOffPassengers = (elevatorQueue, targetFloor, exitCounters) => {
  let exitCount = 0
  const currentTime = Date.now()
  const travelTimes = []
  
  const updatedQueue = elevatorQueue.filter(person => {
    if (person.destinationFloor === targetFloor) {
      exitCount++
      // Calculate travel time if person has pickup timestamp
      if (person.pickupTimestamp) {
        const travelTime = currentTime - person.pickupTimestamp
        travelTimes.push(travelTime)
      }
      return false // Remove from elevator (drop off)
    }
    return true
  })
  
  const updatedExitCounters = [...exitCounters]
  updatedExitCounters[targetFloor] += exitCount
  
  return { updatedQueue, updatedExitCounters, travelTimes }
}

// Helper function to pick up passengers from current floor
const pickUpPassengers = (elevatorQueue, floorQueue, maxCapacity = ELEVATOR_CAPACITY) => {
  const availableCapacity = maxCapacity - elevatorQueue.length
  const peopleToPickup = floorQueue.slice(0, availableCapacity)
  const currentTime = Date.now()
  
  // Add pickup timestamps and calculate waiting times
  const waitingTimes = []
  const updatedPeopleToPickup = peopleToPickup.map(person => {
    const waitingTime = currentTime - person.timestamp
    waitingTimes.push(waitingTime)
    return {
      ...person,
      pickupTimestamp: currentTime
    }
  })
  
  const updatedElevatorQueue = [...elevatorQueue, ...updatedPeopleToPickup]
  const remainingPeople = floorQueue.slice(availableCapacity)
  
  return { updatedElevatorQueue, remainingPeople, waitingTimes }
}

const useSimulatorStore = create((set, get) => ({
  simulators: {},
  
  initializeSimulator: (id, floorCount) => {
    const { simulators } = get()
    if (!simulators[id]) {
      const appState = useAppStore.getState()
      const globalSpeed = appState.elevatorSpeed
      const globalWaitTime = appState.waitTime
      const simulatorConfig = appState.simulators.find(sim => sim.id === id)
      const type = simulatorConfig?.type || 'basic'
      
      set({
        simulators: {
          ...simulators,
          [id]: {
            id,
            type,
            floorCount,
            speed: globalSpeed,
            waitTime: globalWaitTime,
            floorQueues: Array(floorCount).fill(null).map(() => []), // Queue of people for each floor
            exitCounters: Array(floorCount).fill(0), // Counter of people who exited at each floor
            waitingTimes: [], // List of milliseconds each person waited to be picked up
            travelTimes: [], // List of milliseconds each person spent in elevator
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

  setWaitTime: (id, waitTime) => {
    const { simulators } = get()
    if (simulators[id]) {
      set({
        simulators: {
          ...simulators,
          [id]: { ...simulators[id], waitTime }
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
            waitingTimes: [], // Clear waiting times log
            travelTimes: [], // Clear travel times log
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

  setElevatorCount: (id, count) => {
    const { simulators } = get()
    const simulator = simulators[id]
    if (!simulator) return

    const currentCount = simulator.elevators.length
    let newElevators = [...simulator.elevators]

    if (count > currentCount) {
      // Add elevators
      for (let i = currentCount; i < count; i++) {
        newElevators.push({
          id: i,
          currentFloor: 0,
          isAnimating: false,
          direction: 'up',
          elevatorQueue: []
        })
      }
    } else if (count < currentCount) {
      // Remove elevators from the end
      newElevators = newElevators.slice(0, count)
    }

    set({
      simulators: {
        ...simulators,
        [id]: {
          ...simulator,
          elevators: newElevators
        }
      }
    })
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
    
    // Route to appropriate logic based on simulator type
    if (simulator.type === 'advanced') {
      return get().processAdvancedElevatorMovement(id)
    } else {
      return get().processBasicElevatorMovement(id)
    }
  },

  processBasicElevatorMovement: (id) => {
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
        // Pick up people from current floor before moving using helper function
        const pickupResult = pickUpPassengers(elevator.elevatorQueue, currentFloorQueue)
        const updatedElevatorQueue = pickupResult.updatedElevatorQueue
        const updatedFloorQueue = pickupResult.remainingPeople
        const newWaitingTimes = pickupResult.waitingTimes || []
        
        // Update the state
        const updatedFloorQueues = [...simulator.floorQueues]
        updatedFloorQueues[elevator.currentFloor] = updatedFloorQueue
        
        const updatedElevators = simulator.elevators.map((elev, idx) => 
          elev.id === elevator.id 
            ? { ...elev, elevatorQueue: updatedElevatorQueue }
            : elev
        )
        
        // Update waiting times log
        const updatedWaitingTimes = [...simulator.waitingTimes, ...newWaitingTimes]
        
        set({
          simulators: {
            ...simulators,
            [id]: {
              ...simulator,
              elevators: updatedElevators,
              floorQueues: updatedFloorQueues,
              waitingTimes: updatedWaitingTimes
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

  processAdvancedElevatorMovement: (id) => {
    const { simulators } = get()
    const simulator = simulators[id]
    
    if (!simulator) return
    
    // Advanced elevator logic - direction-aware and inter-elevator coordinated
    simulator.elevators.forEach(elevator => {
      if (elevator.isAnimating) return
      
      // Helper function to determine elevator's current direction based on passengers
      const getElevatorDirection = (elevatorQueue, currentFloor) => {
        if (!elevatorQueue || elevatorQueue.length === 0) return null
        
        const upCount = elevatorQueue.filter(person => person.destinationFloor > currentFloor).length
        const downCount = elevatorQueue.filter(person => person.destinationFloor < currentFloor).length
        
        if (upCount > downCount) return 'up'
        if (downCount > upCount) return 'down'
        return null // mixed or equal
      }
      
      // Helper function to filter people by direction compatibility
      const getCompatiblePeople = (floorQueue, elevatorDirection, currentFloor) => {
        if (!floorQueue || floorQueue.length === 0) return []
        if (!elevatorDirection) return floorQueue // If no direction preference, pick up all
        
        return floorQueue.filter(person => {
          const personDirection = person.destinationFloor > currentFloor ? 'up' : 'down'
          return personDirection === elevatorDirection
        })
      }
      
      // Check if elevator is not full and there are people waiting on current floor
      const currentFloorQueue = simulator.floorQueues[elevator.currentFloor]
      const hasCapacity = elevator.elevatorQueue.length < ELEVATOR_CAPACITY
      const elevatorDirection = getElevatorDirection(elevator.elevatorQueue, elevator.currentFloor)
      
      if (hasCapacity && currentFloorQueue && currentFloorQueue.length > 0) {
        // Advanced pickup: only pick up people going in the same direction
        const compatiblePeople = getCompatiblePeople(currentFloorQueue, elevatorDirection, elevator.currentFloor)
        
        if (compatiblePeople.length > 0) {
          // Use pickup helper with compatible people to get timing data
          const pickupResult = pickUpPassengers(elevator.elevatorQueue, compatiblePeople)
          const updatedElevatorQueue = pickupResult.updatedElevatorQueue
          const newWaitingTimes = pickupResult.waitingTimes || []
          
          // Calculate remaining people (original floor queue minus picked up people)
          const remainingPeople = currentFloorQueue.filter(person => 
            !pickupResult.updatedElevatorQueue.some(picked => picked.id === person.id) ||
            elevator.elevatorQueue.some(existing => existing.id === person.id)
          )
          
          // Update the state
          const updatedFloorQueues = [...simulator.floorQueues]
          updatedFloorQueues[elevator.currentFloor] = remainingPeople
          
          const updatedElevators = simulator.elevators.map((elev, idx) => 
            elev.id === elevator.id 
              ? { ...elev, elevatorQueue: updatedElevatorQueue }
              : elev
          )
          
          // Update waiting times log
          const updatedWaitingTimes = [...simulator.waitingTimes, ...newWaitingTimes]
          
          set({
            simulators: {
              ...simulators,
              [id]: {
                ...simulator,
                elevators: updatedElevators,
                floorQueues: updatedFloorQueues,
                waitingTimes: updatedWaitingTimes
              }
            }
          })
        }
      }
      
      // First priority: deliver people already in elevator to their destinations
      if (elevator.elevatorQueue && elevator.elevatorQueue.length > 0) {
        // Find the nearest destination floor in the current direction
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
      
      // Second priority: pick up people waiting on floors with advanced coordination
      const targetFloor = get().findAdvancedTargetFloor(id, elevator)
      
      if (targetFloor !== -1) {
        get().moveElevatorToFloor(id, elevator.id, targetFloor)
      }
    })
  },

  findAdvancedTargetFloor: (id, elevator) => {
    const { simulators } = get()
    const simulator = simulators[id]
    
    if (!simulator) return -1
    
    // Helper function to check if other elevators are already heading to a floor
    const isFloorAlreadyTargeted = (targetFloor, excludeElevatorId) => {
      return simulator.elevators.some(otherElevator => {
        if (otherElevator.id === excludeElevatorId || !otherElevator.isAnimating) return false
        
        // Check if the other elevator will pass through or stop at this floor
        const willPassThrough = (
          (otherElevator.currentFloor < targetFloor && otherElevator.direction === 'up') ||
          (otherElevator.currentFloor > targetFloor && otherElevator.direction === 'down')
        )
        
        return otherElevator.currentFloor === targetFloor || willPassThrough
      })
    }
    
    // Helper function to get elevator direction based on passengers
    const getElevatorDirection = (elevatorQueue, currentFloor) => {
      if (!elevatorQueue || elevatorQueue.length === 0) return null
      
      const upCount = elevatorQueue.filter(person => person.destinationFloor > currentFloor).length
      const downCount = elevatorQueue.filter(person => person.destinationFloor < currentFloor).length
      
      if (upCount > downCount) return 'up'
      if (downCount > upCount) return 'down'
      return null
    }
    
    // Helper function to count people going in specific direction
    const countPeopleInDirection = (floorQueue, direction, currentFloor) => {
      if (!floorQueue) return 0
      return floorQueue.filter(person => {
        const personDirection = person.destinationFloor > currentFloor ? 'up' : 'down'
        return personDirection === direction
      }).length
    }
    
    const elevatorDirection = getElevatorDirection(elevator.elevatorQueue, elevator.currentFloor)
    let bestFloor = -1
    let bestScore = -1
    
    // Scan all floors for optimization opportunities
    for (let floor = 0; floor < simulator.floorCount; floor++) {
      if (floor === elevator.currentFloor) continue
      
      const floorQueue = simulator.floorQueues[floor]
      if (!floorQueue || floorQueue.length === 0) continue
      
      // Calculate distance penalty
      const distance = Math.abs(elevator.currentFloor - floor)
      
      // If elevator has a direction preference, prioritize floors in that direction
      let compatiblePeople = 0
      let totalPeople = floorQueue.length
      
      if (elevatorDirection) {
        compatiblePeople = countPeopleInDirection(floorQueue, elevatorDirection, floor)
        
        // Skip floors that don't have compatible people unless no other options
        if (compatiblePeople === 0) continue
      } else {
        compatiblePeople = totalPeople
      }
      
      // Check if other elevators are handling this floor
      const isTargeted = isFloorAlreadyTargeted(floor, elevator.id)
      
      // Advanced coordination logic
      if (isTargeted) {
        // Check if there are enough people for multiple elevators
        const otherElevatorCapacity = simulator.elevators
          .filter(e => e.id !== elevator.id && e.isAnimating)
          .reduce((sum, e) => sum + (ELEVATOR_CAPACITY - e.elevatorQueue.length), 0)
        
        // If there are more compatible people than other elevators can handle, go anyway
        if (compatiblePeople <= otherElevatorCapacity) continue
      }
      
      // Calculate score: prioritize more people, shorter distance, and direction compatibility
      let score = compatiblePeople * 10 - distance
      
      // Bonus for direction alignment
      if (elevatorDirection) {
        const floorDirection = floor > elevator.currentFloor ? 'up' : 'down'
        if (floorDirection === elevatorDirection) {
          score += 5
        }
      }
      
      if (score > bestScore) {
        bestScore = score
        bestFloor = floor
      }
    }
    
    return bestFloor
  },

  moveElevatorToFloor: (id, elevatorId, targetFloor) => {
    const { simulators } = get()
    const simulator = simulators[id]
    
    if (!simulator) return
    
    const elevator = simulator.elevators[elevatorId]
    if (!elevator || elevator.isAnimating) return
    
    const { speed, floorQueues, waitTime } = simulator
    const direction = targetFloor > elevator.currentFloor ? 'up' : 'down'
    
    // Calculate movement time based on distance (number of floors)
    const floorsToMove = Math.abs(targetFloor - elevator.currentFloor)
    const movementTime = speed * floorsToMove
    
    // Capture waitTime at the start to avoid timing inconsistencies
    const capturedWaitTime = waitTime
    
    // Start animation
    const updatedElevators = simulator.elevators.map((elev, idx) => 
      idx === elevatorId 
        ? { ...elev, isAnimating: true, currentFloor: targetFloor, direction, animationDuration: movementTime }
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
        
        // Collect timing data for logging
        const newWaitingTimes = pickUpResult.waitingTimes || []
        const newTravelTimes = dropOffResult.travelTimes || []
        const updatedWaitingTimes = [...currentSim.waitingTimes, ...newWaitingTimes]
        const updatedTravelTimes = [...currentSim.travelTimes, ...newTravelTimes]
        
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
              exitCounters: updatedExitCounters,
              waitingTimes: updatedWaitingTimes,
              travelTimes: updatedTravelTimes
            }
          }
        })
        
        // Continue checking for more people to serve
        setTimeout(() => {
          get().processElevatorMovement(id)
        }, capturedWaitTime)
      }
    }, movementTime)
  },

  // Check if all simulators are completely empty (no people in floors or elevators)
  areAllSimulatorsEmpty: () => {
    const { simulators } = get()
    
    return Object.values(simulators).every(simulator => {
      if (!simulator) return true
      
      // Check if any floor has people waiting
      const hasWaitingPeople = simulator.floorQueues.some(queue => queue.length > 0)
      if (hasWaitingPeople) return false
      
      // Check if any elevator has people
      const hasElevatorPeople = simulator.elevators.some(elevator => elevator.elevatorQueue.length > 0)
      if (hasElevatorPeople) return false
      
      return true
    })
  },

  // Get performance report data for all simulators
  getPerformanceReport: () => {
    const { simulators } = get()
    const report = {}
    
    Object.entries(simulators).forEach(([id, simulator]) => {
      if (!simulator) return
      
      const avgWaitingTime = simulator.waitingTimes.length > 0 
        ? simulator.waitingTimes.reduce((sum, time) => sum + time, 0) / simulator.waitingTimes.length
        : 0
        
      const avgTravelTime = simulator.travelTimes.length > 0
        ? simulator.travelTimes.reduce((sum, time) => sum + time, 0) / simulator.travelTimes.length
        : 0
      
      report[simulator.type] = {
        avgWaitingTime: Math.round(avgWaitingTime),
        avgTravelTime: Math.round(avgTravelTime),
        totalPeople: simulator.waitingTimes.length
      }
    })
    
    return report
  },

}))

export default useSimulatorStore