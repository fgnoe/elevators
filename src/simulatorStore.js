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

  checkAndStartAutomaticMovement: (id) => {
    const { simulators } = get()
    const simulator = simulators[id]
    
    if (!simulator || simulator.isAnimating) return
    
    if (simulator.floorPeople[0] > 0) {
      if (simulator.currentFloor !== 0) {
        get().moveToGroundFloor(id)
      } else {
        get().moveElevator(id, simulator.floorCount)
      }
    }
  },

  moveToGroundFloor: (id) => {
    const { simulators } = get()
    const simulator = simulators[id]
    
    if (!simulator || simulator.isAnimating || simulator.currentFloor === 0) return
    
    const { speed, floorPeople, elevatorPeople } = simulator
    let newFloorPeople = [...floorPeople]
    let newElevatorPeople = elevatorPeople
    
    if (simulator.currentFloor === simulator.floorCount - 1 && newElevatorPeople > 0) {
      newFloorPeople[simulator.currentFloor] += newElevatorPeople
      newElevatorPeople = 0
    }
    
    set({
      simulators: {
        ...simulators,
        [id]: {
          ...simulator,
          isAnimating: true,
          currentFloor: 0,
          direction: 'up',
          floorPeople: newFloorPeople,
          elevatorPeople: newElevatorPeople
        }
      }
    })
    
    setTimeout(() => {
      const { simulators: currentSimulators } = get()
      if (currentSimulators[id]) {
        const currentSim = currentSimulators[id]
        let updatedFloorPeople = [...currentSim.floorPeople]
        let updatedElevatorPeople = currentSim.elevatorPeople
        
        if (updatedFloorPeople[0] > 0) {
          const peopleToMove = Math.min(updatedFloorPeople[0], 10 - updatedElevatorPeople)
          updatedFloorPeople[0] -= peopleToMove
          updatedElevatorPeople += peopleToMove
        }
        
        set({
          simulators: {
            ...currentSimulators,
            [id]: {
              ...currentSim,
              isAnimating: false,
              floorPeople: updatedFloorPeople,
              elevatorPeople: updatedElevatorPeople
            }
          }
        })
        
        setTimeout(() => {
          if (updatedElevatorPeople > 0) {
            get().moveToTopFloor(id)
          }
        }, 400)
      }
    }, speed)
  },

  moveToTopFloor: (id) => {
    const { simulators } = get()
    const simulator = simulators[id]
    
    if (!simulator || simulator.isAnimating) return
    
    const { speed, floorCount, floorPeople, elevatorPeople } = simulator
    let newFloorPeople = [...floorPeople]
    let newElevatorPeople = elevatorPeople
    
    set({
      simulators: {
        ...simulators,
        [id]: {
          ...simulator,
          isAnimating: true,
          currentFloor: floorCount - 1,
          direction: 'down',
          floorPeople: newFloorPeople,
          elevatorPeople: newElevatorPeople
        }
      }
    })
    
    setTimeout(() => {
      const { simulators: currentSimulators } = get()
      if (currentSimulators[id]) {
        const currentSim = currentSimulators[id]
        let updatedFloorPeople = [...currentSim.floorPeople]
        
        updatedFloorPeople[floorCount - 1] += currentSim.elevatorPeople
        
        set({
          simulators: {
            ...currentSimulators,
            [id]: {
              ...currentSim,
              isAnimating: false,
              floorPeople: updatedFloorPeople,
              elevatorPeople: 0
            }
          }
        })
        
        setTimeout(() => {
          get().checkAndStartAutomaticMovement(id)
        }, 400)
      }
    }, speed)
  },
  
  moveElevator: (id, floorCount) => {
    const { simulators } = get()
    const simulator = simulators[id]

    if (!simulator || simulator.isAnimating) return

    const { floorPeople, elevatorPeople } = simulator
    let newFloorPeople = [...floorPeople]
    let newElevatorPeople = elevatorPeople

    if (simulator.currentFloor === 0 && newFloorPeople[0] > 0) {
      const peopleToMove = Math.min(newFloorPeople[0], 10 - newElevatorPeople)
      newFloorPeople[0] -= peopleToMove
      newElevatorPeople += peopleToMove

      set({
        simulators: {
          ...simulators,
          [id]: {
            ...simulator,
            floorPeople: newFloorPeople,
            elevatorPeople: newElevatorPeople
          }
        }
      })

      setTimeout(() => {
        get().moveToTopFloor(id)
      }, 400)
    }
  }
}))

export default useSimulatorStore