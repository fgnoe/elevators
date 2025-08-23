import { create } from 'zustand'
import useSimulatorStore from './simulatorStore'

const useAppStore = create((set, get) => ({
  simulators: [{ id: 1 }],
  floorCount: 2,
  
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
  
  moveElevator: () => {
    const { simulators, floorCount } = get()
    simulators.forEach(simulator => {
      useSimulatorStore.getState().moveElevator(simulator.id, floorCount)
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