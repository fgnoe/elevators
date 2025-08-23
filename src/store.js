import { create } from 'zustand'

const useSimulatorStore = create((set, get) => ({
  currentFloor: 0,
  floorCount: 2,
  isAnimating: false,
  direction: 'up',
  speed: 1000,
  
  setFloorCount: (count) => {
    const { isAnimating } = get()
    if (isAnimating) return
    set({ floorCount: count, currentFloor: 0, direction: 'up' })
  },
  
  setSpeed: (speed) => {
    set({ speed })
  },
  
  addPerson: () => {
    const { isAnimating, currentFloor, floorCount, direction, speed } = get()
    
    if (isAnimating) return
    
    let newFloor = currentFloor
    let newDirection = direction
    
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
    
    set({ isAnimating: true, currentFloor: newFloor, direction: newDirection })
    
    setTimeout(() => {
      set({ isAnimating: false })
    }, speed)
  }
}))

export default useSimulatorStore