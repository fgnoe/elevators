import { create } from 'zustand'
import useSimulatorStore from './simulatorStore'

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
    const { simulators } = get()
    if (simulators.length >= 3) return
    
    const newId = Math.max(...simulators.map(s => s.id)) + 1
    set({ simulators: [...simulators, { id: newId }] })
  },
  
  startSimulations: () => {
    const { simulators } = get()
    simulators.forEach(simulator => {
      const simulatorState = useSimulatorStore.getState().simulators[simulator.id]
      if (simulatorState && simulatorState.floorPeople[0] === 0) {
        useSimulatorStore.getState().addPerson(simulator.id)
      } else {
        useSimulatorStore.getState().checkAndStartAutomaticMovement(simulator.id)
      }
    })
  },

  addPerson: () => {
    const { simulators } = get()
    simulators.forEach(simulator => {
      useSimulatorStore.getState().addPerson(simulator.id)
    })
  }
}))

export default useAppStore