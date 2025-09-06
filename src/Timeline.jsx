import './Timeline.css'
import useAppStore from './appStore'

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

const TOTAL_SIMULATION_TIME = 30000 // 30 seconds in milliseconds

function Timeline() {
  const { isSimulationRunning } = useAppStore()
  
  return (
    <div className="timeline-container">
        <h3 className="timeline-title">Simulation Schedule</h3>
      <div className="timeline-labels">
        <span className="timeline-label-left">0s</span>
        <span className="timeline-label-right">30s</span>
      </div>
      <div className="timeline">
        <div className="timeline-line"></div>
        {schedule.map((event, index) => {
          const leftPosition = (event.time / TOTAL_SIMULATION_TIME) * 100
          return (
            <div
              key={index}
              className="timeline-dot"
              style={{ left: `${leftPosition}%` }}
              title={`${event.time / 1000}s: Floor ${event.originFloor} → Floor ${event.destinationFloor}`}
            />
          )
        })}
        {isSimulationRunning && (
          <div
            className={`timeline-progress-dot ${isSimulationRunning ? 'animating' : ''}`}
            title="Current simulation progress"
          />
        )}
      </div>
    </div>
  )
}

export default Timeline