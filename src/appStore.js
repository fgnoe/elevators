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
  simulators: [{ id: 1 }, { id: 2 }],
  floorCount: 4,
  
  setFloorCount: (count) => {
    const { simulators } = get()
    set({ floorCount: count })
    
    simulators.forEach(simulator => {
      useSimulatorStore.getState().resetSimulator(simulator.id, count)
    })
  },

  addSimulator: () => {
    const { simulators, floorCount } = get()
    if (simulators.length < 3) {
      const newId = Math.max(...simulators.map(s => s.id)) + 1
      const updatedSimulators = [...simulators, { id: newId }]
      set({ simulators: updatedSimulators })
      useSimulatorStore.getState().initializeSimulator(newId, floorCount)
    }
  },

  addPerson: (originFloor, destinationFloor) => {
    // Call simulatorStore addPerson with provided origin and destination
    useSimulatorStore.getState().addPerson(originFloor, destinationFloor)
  },

  startSimulation: () => {
    schedule.forEach(({ time, originFloor, destinationFloor }) => {
      setTimeout(() => {
        // Convert 1-based floor numbers to 0-based for internal use
        get().addPerson(originFloor - 1, destinationFloor - 1)
      }, time)
    })
  }
}))

export default useAppStore