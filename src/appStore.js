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

  addPerson: () => {
    const { floorCount } = get()
    
    // Generate random origin floor (0 to floorCount-1)
    const origin = Math.floor(Math.random() * floorCount)
    
    // Generate random destination floor (different from origin)
    let destination
    do {
      destination = Math.floor(Math.random() * floorCount)
    } while (destination === origin)
    
    // Call simulatorStore addPerson with origin and destination
    useSimulatorStore.getState().addPerson(origin, destination)
  }
}))

export default useAppStore