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

    for (let i = 0; i < floorQueues.length; i++) {
      if (floorQueues[i].length > 0) {
        return i // Return first (lowest) floor found with people - ignores distance!
      }
    }
    
    return -1
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

    // FIX STUCK PASSENGERS: Add periodic safety processing for all elevators
    // This ensures elevators don't get permanently stuck due to race conditions
    const hasStuckElevators = simulator.elevators.some(elev =>
      !elev.isAnimating && elev.elevatorQueue.length > 0
    )
    const hasWaitingPeople = simulator.floorQueues.some(queue => queue.length > 0)

    if (hasStuckElevators || hasWaitingPeople) {
      // Force at least one elevator to process if there are people waiting
      const availableElevators = simulator.elevators.filter(elev => !elev.isAnimating)
      if (availableElevators.length === 0) {
        // All elevators are busy, schedule a retry
        setTimeout(() => {
          get().processElevatorMovement(id)
        }, 500)
        return
      }
    }

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

    // Strategy: Aggressive pickup, smart routing, predictive positioning
    
    simulator.elevators.forEach(elevator => {
      if (elevator.isAnimating) return
      
      // Always pick up people from current floor first (maximize throughput)
      const currentFloorQueue = simulator.floorQueues[elevator.currentFloor]
      const hasCapacity = elevator.elevatorQueue.length < ELEVATOR_CAPACITY
      
      if (hasCapacity && currentFloorQueue && currentFloorQueue.length > 0) {
        const pickupResult = pickUpPassengers(elevator.elevatorQueue, currentFloorQueue)
        const updatedElevatorQueue = pickupResult.updatedElevatorQueue
        const updatedFloorQueue = pickupResult.remainingPeople
        const newWaitingTimes = pickupResult.waitingTimes || []
        
        // Update state
        const updatedFloorQueues = [...simulator.floorQueues]
        updatedFloorQueues[elevator.currentFloor] = updatedFloorQueue
        
        const updatedElevators = simulator.elevators.map((elev) => 
          elev.id === elevator.id 
            ? { ...elev, elevatorQueue: updatedElevatorQueue }
            : elev
        )
        
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
      
      // Priority 1: Deliver passengers (always prioritize current load)
      if (elevator.elevatorQueue && elevator.elevatorQueue.length > 0) {
        const nextDestination = get().findOptimalDropoffFloor(elevator)
        if (nextDestination !== -1) {
          get().moveElevatorToFloor(id, elevator.id, nextDestination)
          return
        }
      }
      
      // Priority 2: Smart pickup based on system efficiency
      const targetFloor = get().findOptimalPickupFloor(id, elevator)
      if (targetFloor !== -1) {
        get().moveElevatorToFloor(id, elevator.id, targetFloor)
      }
    })
  },

  findOptimalDropoffFloor: (elevator) => {
    // Find the most efficient dropoff floor for current passengers
    if (!elevator.elevatorQueue || elevator.elevatorQueue.length === 0) return -1
    
    // Group passengers by destination floor
    const destinationGroups = {}
    elevator.elevatorQueue.forEach(person => {
      if (!destinationGroups[person.destinationFloor]) {
        destinationGroups[person.destinationFloor] = 0
      }
      destinationGroups[person.destinationFloor]++
    })
    
    // Find the closest floor with the most passengers
    let bestFloor = -1
    let bestScore = -1
    
    Object.keys(destinationGroups).forEach(floorStr => {
      const floor = parseInt(floorStr)
      const passengerCount = destinationGroups[floor]
      const distance = Math.abs(elevator.currentFloor - floor)
      
      // Score: prioritize more passengers, penalize distance
      const score = passengerCount * 5 - distance
      
      if (score > bestScore) {
        bestScore = score
        bestFloor = floor
      }
    })
    
    return bestFloor
  },

  findOptimalPickupFloor: (id, elevator) => {
    const { simulators } = get()
    const simulator = simulators[id]
    
    if (!simulator) return -1
    
    let bestFloor = -1
    let bestScore = -1
    
    // Analyze all floors for pickup opportunities
    for (let floor = 0; floor < simulator.floorCount; floor++) {
      if (floor === elevator.currentFloor) continue
      
      const floorQueue = simulator.floorQueues[floor]
      if (!floorQueue || floorQueue.length === 0) continue
      
      // Calculate base score: passenger count vs distance
      const passengerCount = floorQueue.length
      const distance = Math.abs(elevator.currentFloor - floor)
      let score = passengerCount * 10 - distance * 2
      
      // Bonus for floors with many people (high demand)
      if (passengerCount >= 5) score += 15
      if (passengerCount >= 8) score += 25
      
      // Check if other elevators are already targeting this floor
      const otherElevatorsTargeting = simulator.elevators.filter(otherElev => 
        otherElev.id !== elevator.id && 
        otherElev.isAnimating &&
        get().willElevatorVisitFloor(otherElev, floor)
      )
      
      // Coordination bonus/penalty
      if (otherElevatorsTargeting.length === 0) {
        // No competition - bonus
        score += 10
      } else {
        // Calculate if we need multiple elevators
        const totalCapacityNeeded = passengerCount
        const otherElevatorsCapacity = otherElevatorsTargeting.reduce((sum, otherElev) => 
          sum + (ELEVATOR_CAPACITY - otherElev.elevatorQueue.length), 0
        )
        
        if (totalCapacityNeeded > otherElevatorsCapacity) {
          // Still need more capacity - small bonus
          score += 5
        } else {
          // Other elevators can handle it - large penalty
          score -= 20
        }
      }
      
      // Time efficiency: prefer floors that create efficient routes
      if (elevator.elevatorQueue.length > 0) {
        // Check if this floor is "on the way" to passenger destinations
        const avgDestination = elevator.elevatorQueue.reduce((sum, p) => sum + p.destinationFloor, 0) / elevator.elevatorQueue.length
        const isOnTheWay = (elevator.currentFloor < floor && floor < avgDestination) || 
                          (elevator.currentFloor > floor && floor > avgDestination)
        
        if (isOnTheWay) score += 8
      }
      
      if (score > bestScore) {
        bestScore = score
        bestFloor = floor
      }
    }
    
    return bestFloor
  },

  willElevatorVisitFloor: (elevator, targetFloor) => {
    // Check if an elevator will visit a specific floor based on its current state
    if (!elevator.isAnimating) return false
    
    // Simple check: if elevator is moving towards the floor
    const movingUp = elevator.direction === 'up'
    const movingDown = elevator.direction === 'down'
    
    if (movingUp && targetFloor > elevator.currentFloor) return true
    if (movingDown && targetFloor < elevator.currentFloor) return true
    
    return false
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
    
    // FIX TELEPORTATION: Store start floor and target, don't update currentFloor immediately
    const startFloor = elevator.currentFloor
    
    // Start animation - keep currentFloor at start position for proper CSS animation
    const updatedElevators = simulator.elevators.map((elev, idx) => 
      idx === elevatorId 
        ? { 
            ...elev, 
            isAnimating: true, 
            startFloor, // Track where animation started
            targetFloor, // Track where we're going
            direction, 
            animationDuration: movementTime 
          }
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
        
        // Update this elevator's state - NOW set currentFloor to final position
        const updatedElevators = currentSim.elevators.map((elev, idx) => 
          idx === elevatorId 
            ? { 
                ...elev, 
                isAnimating: false, 
                currentFloor: targetFloor, // Set final position after animation
                elevatorQueue: updatedElevatorQueue,
                startFloor: undefined, // Clear animation tracking
                targetFloor: undefined // Clear animation tracking
              }
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
        
        // FIX STUCK PASSENGERS: Add safety check to ensure processing continues
        // If elevator still has passengers after a longer delay, force reprocessing
        setTimeout(() => {
          const { simulators: safetyCheckSimulators } = get()
          const safetyCheckSim = safetyCheckSimulators[id]
          if (safetyCheckSim) {
            const safetyCheckElevator = safetyCheckSim.elevators[elevatorId]
            if (safetyCheckElevator && !safetyCheckElevator.isAnimating && 
                safetyCheckElevator.elevatorQueue.length > 0) {
              console.warn(`[STUCK_PASSENGER_FIX] Elevator ${elevatorId} may be stuck with passengers, forcing reprocess`)
              get().processElevatorMovement(id)
            }
          }
        }, movementTime + capturedWaitTime + 1000) // Extra safety delay
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