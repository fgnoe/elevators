import { create } from 'zustand'
import useSimulatorStore from './simulatorStore'

const schedule = [{
    time: 0,
    originFloor: 1,
    destinationFloor: 2
}, {
    time: 1000,
    originFloor: 2,
    destinationFloor: 1
}, {
    time: 4000,
    originFloor: 3,
    destinationFloor: 1
}]

const useAppStore = create((set, get) => ({
  simulators: [{ id: 1 }, { id: 2 }, { id: 3 }],
  floorCount: 4,
  elevatorCount: 1,
  isSimulationRunning: false,
  
  setFloorCount: (count) => {
    const { simulators } = get()
    set({ floorCount: count })
    
    simulators.forEach(simulator => {
      useSimulatorStore.getState().resetSimulator(simulator.id, count)
    })
  },

  setElevatorCount: (count) => {
    const { simulators } = get()
    set({ elevatorCount: count })
    
    simulators.forEach(simulator => {
      useSimulatorStore.getState().setElevatorCount(simulator.id, count)
    })
  },

  addPerson: (originFloor, destinationFloor) => {
    // Call simulatorStore addPerson with provided origin and destination
    useSimulatorStore.getState().addPerson(originFloor, destinationFloor)
  },

  startSimulation: () => {
    set({ isSimulationRunning: true })
    
    schedule.forEach(({ time, originFloor, destinationFloor }) => {
      setTimeout(() => {
        // Convert 1-based floor numbers to 0-based for internal use
        get().addPerson(originFloor - 1, destinationFloor - 1)
      }, time)
    })
    
    // Reset simulation state after 30 seconds
    setTimeout(() => {
      set({ isSimulationRunning: false })
    }, 30000)
  }
}))

export default useAppStore