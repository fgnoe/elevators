import { create } from 'zustand'
import useSimulatorStore from './simulatorStore'

// Function to generate random bursts
const generateRandomBursts = (count = 15, floorCount = 4) => {
  const bursts = []
  
  for (let i = 0; i < count; i++) {
    // Random time between 0 and 30 seconds
    const time = Math.floor(Math.random() * 30000)
    
    // Random amount between 4 and 30 people
    const amount = Math.floor(Math.random() * 26) + 4
    
    // Random origin floor (1 to floorCount)
    const originFloor = Math.floor(Math.random() * floorCount) + 1
    
    // Random destination floor (different from origin)
    let destinationFloor
    do {
      destinationFloor = Math.floor(Math.random() * floorCount) + 1
    } while (destinationFloor === originFloor)
    
    // Random time range between 500ms and 8000ms
    const timeRange = Math.floor(Math.random() * 7500) + 500
    
    bursts.push({
      id: `burst-${Date.now()}-${i}`,
      time,
      amount,
      originFloor,
      destinationFloor,
      timeRange
    })
  }
  
  // Sort by time for better visualization
  return bursts.sort((a, b) => a.time - b.time)
}

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
  elevatorSpeed: 1000,
  isSimulationRunning: false,
  bursts: generateRandomBursts(15, 4),
  schedule: generateScheduleFromBursts(generateRandomBursts(15, 4)),
  
  setFloorCount: (count) => {
    const { simulators } = get()
    
    // Generate new bursts with the new floor count
    const newBursts = generateRandomBursts(15, count)
    const newSchedule = generateScheduleFromBursts(newBursts)
    
    set({ 
      floorCount: count, 
      bursts: newBursts, 
      schedule: newSchedule 
    })
    
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

  setElevatorSpeed: (speed) => {
    const { simulators } = get()
    set({ elevatorSpeed: speed })
    
    simulators.forEach(simulator => {
      useSimulatorStore.getState().setSpeed(simulator.id, speed)
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

  randomizeBursts: () => {
    const { floorCount } = get()
    const newBursts = generateRandomBursts(15, floorCount)
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