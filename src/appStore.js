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
    // First add some people using the new addPerson function
    simulators.forEach(simulator => {
      get().addPerson()
    })
    // Then start the automatic movement
    simulators.forEach(simulator => {
        useSimulatorStore.getState().checkAndStartAutomaticMovement(simulator.id)
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