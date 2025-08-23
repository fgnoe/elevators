import { create } from 'zustand'

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
            floorPeople: Array(floorCount).fill(0),
            elevatorPeople: 0
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
            floorPeople: Array(floorCount).fill(0),
            elevatorPeople: 0
          }
        }
      })
    }
  },

  addPerson: (id) => {
    const { simulators } = get()
    const simulator = simulators[id]
    
    if (!simulator) return
    
    const newFloorPeople = [...simulator.floorPeople]
    newFloorPeople[0] += 1
    
    set({
      simulators: {
        ...simulators,
        [id]: {
          ...simulator,
          floorPeople: newFloorPeople
        }
      }
    })
  },
  
  moveElevator: (id, floorCount) => {
    const { simulators } = get()
    const simulator = simulators[id]
    
    if (!simulator || simulator.isAnimating) return
    
    const { currentFloor, direction, speed, floorPeople, elevatorPeople } = simulator
    let newFloor = currentFloor
    let newDirection = direction
    let newFloorPeople = [...floorPeople]
    let newElevatorPeople = elevatorPeople
    
    if (currentFloor === 0 && newFloorPeople[0] > 0) {
      const peopleToMove = Math.min(newFloorPeople[0], 10 - newElevatorPeople)
      newFloorPeople[0] -= peopleToMove
      newElevatorPeople += peopleToMove
    }
    
    if (direction === 'up') {
      if (currentFloor < floorCount - 1) {
        newFloor = currentFloor + 1
      } else {
        newDirection = 'down'
        newFloor = currentFloor - 1
      }
    } else {
      if (currentFloor > 0) {
        newFloor = currentFloor - 1
      } else {
        newDirection = 'up'
        newFloor = currentFloor + 1
      }
    }
    
    if (newFloor === floorCount - 1 && newElevatorPeople > 0) {
      newFloorPeople[newFloor] += newElevatorPeople
      newElevatorPeople = 0
    }
    
    set({
      simulators: {
        ...simulators,
        [id]: {
          ...simulator,
          isAnimating: true,
          currentFloor: newFloor,
          direction: newDirection,
          floorPeople: newFloorPeople,
          elevatorPeople: newElevatorPeople
        }
      }
    })
    
    setTimeout(() => {
      const { simulators: currentSimulators } = get()
      if (currentSimulators[id]) {
        set({
          simulators: {
            ...currentSimulators,
            [id]: {
              ...currentSimulators[id],
              isAnimating: false
            }
          }
        })
      }
    }, speed)
  }
}))

export default useSimulatorStore