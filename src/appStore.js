import { create } from 'zustand'
import useSimulatorStore from './simulatorStore'

// Initial burst configuration
const initialBursts = [{
    id: 'burst-1',
    time: 0,
    amount: 40,
    originFloor: 1,
    destinationFloor: 2,
    timeRange: 7000
}, {
    id: 'burst-2', 
    time: 5000,
    amount: 35,
    originFloor: 2,
    destinationFloor: 1,
    timeRange: 20000
}, {
    id: 'burst-3',
    time: 20000,
    amount: 20,
    originFloor: 3,
    destinationFloor: 1,
    timeRange: 10000
}]

// Normal distribution function
const generateNormalDistribution = (centerTime, timeRange, amount) => {
  if (centerTime - timeRange/2 < 0) {
      centerTime = timeRange/2
  }
  if (centerTime + timeRange/2 > 30000) {
      centerTime = 30000 - timeRange/2
  }
  const times = []
  const halfRange = timeRange / 2
  
  if (timeRange === 0) {
    // If no range, all arrivals at exact time
    for (let i = 0; i < amount; i++) {
      times.push(centerTime)
    }
    return times
  }
  
  for (let i = 0; i < amount; i++) {
    // Box-Muller transform for normal distribution
    let u = 0, v = 0;
    while(u === 0) u = Math.random() // Converting [0,1) to (0,1)
    while(v === 0) v = Math.random()
    
    const normalValue = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    
    // Scale and center the distribution
    const scaledValue = normalValue * (timeRange / 6) // 6 sigma covers ~99.7% of data
    const finalTime = Math.max(0, centerTime + scaledValue)
    
    times.push(Math.round(finalTime))
  }
  
  return times
}

// Generate schedule from bursts
const generateScheduleFromBursts = (bursts) => {
  const schedule = []
  
  bursts.forEach(burst => {
    const times = generateNormalDistribution(burst.time, burst.timeRange, burst.amount)
    times.forEach(time => {
      schedule.push({
        time,
        originFloor: burst.originFloor,
        destinationFloor: burst.destinationFloor,
        burstId: burst.id
      })
    })
  })
  
  return schedule.sort((a, b) => a.time - b.time)
}

const useAppStore = create((set, get) => ({
  simulators: [{ id: 1 }, { id: 2 }, { id: 3 }],
  floorCount: 4,
  elevatorCount: 1,
  isSimulationRunning: false,
  bursts: initialBursts,
  schedule: generateScheduleFromBursts(initialBursts),
  
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

  addBurst: (burst) => {
    const { bursts } = get()
    const newBursts = [...bursts, { ...burst, id: `burst-${Date.now()}` }]
    const newSchedule = generateScheduleFromBursts(newBursts)
    set({ bursts: newBursts, schedule: newSchedule })
  },

  updateBurst: (burstId, updatedBurst) => {
    const { bursts } = get()
    const newBursts = bursts.map(burst => 
      burst.id === burstId ? { ...updatedBurst, id: burstId } : burst
    )
    const newSchedule = generateScheduleFromBursts(newBursts)
    set({ bursts: newBursts, schedule: newSchedule })
  },

  removeBurst: (burstId) => {
    const { bursts } = get()
    const newBursts = bursts.filter(burst => burst.id !== burstId)
    const newSchedule = generateScheduleFromBursts(newBursts)
    set({ bursts: newBursts, schedule: newSchedule })
  },

  startSimulation: () => {
    const { schedule } = get()
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