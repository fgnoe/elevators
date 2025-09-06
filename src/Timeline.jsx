import './Timeline.css'
import useAppStore from './appStore'
import { useState } from 'react'

const TOTAL_SIMULATION_TIME = 30000 // 30 seconds in milliseconds

function Timeline() {
  const { isSimulationRunning, bursts, addBurst, updateBurst, randomizeBursts } = useAppStore()
  const [showModal, setShowModal] = useState(false)
  const [editingBurst, setEditingBurst] = useState(null)
  const [modalData, setModalData] = useState({
    amount: 1,
    originFloor: 1,
    destinationFloor: 2,
    timeRange: 1000,
    time: 0
  })

  const handleTimelineClick = (event) => {
    if (event.target.classList.contains('timeline-dot')) return // Don't create new burst when clicking existing dot
    
    const rect = event.currentTarget.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const timelineWidth = rect.width
    const clickedTime = (clickX / timelineWidth) * TOTAL_SIMULATION_TIME
    
    setEditingBurst(null)
    setModalData({
      amount: 1,
      originFloor: 1,
      destinationFloor: 2,
      timeRange: 1000,
      time: Math.round(clickedTime)
    })
    setShowModal(true)
  }

  const handleDotClick = (burst, event) => {
    event.stopPropagation()
    setEditingBurst(burst)
    setModalData({
      amount: burst.amount,
      originFloor: burst.originFloor,
      destinationFloor: burst.destinationFloor,
      timeRange: burst.timeRange,
      time: burst.time
    })
    setShowModal(true)
  }

  const handleModalSubmit = () => {
    if (editingBurst) {
      updateBurst(editingBurst.id, modalData)
    } else {
      addBurst(modalData)
    }
    setShowModal(false)
  }
  
  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h3 className="timeline-title">Simulation Schedule</h3>
        <button 
          className="randomize-button" 
          onClick={randomizeBursts}
          disabled={isSimulationRunning}
        >
          Randomize Bursts
        </button>
      </div>
      <div className="timeline-labels">
        <span className="timeline-label-left">0s</span>
        <span className="timeline-label-right">30s</span>
      </div>
      <div className="timeline" onClick={handleTimelineClick}>
        <div className="timeline-line"></div>
        {bursts.map((burst) => {
          const leftPosition = (burst.time / TOTAL_SIMULATION_TIME) * 100
          return (
            <div
              key={burst.id}
              className="timeline-dot"
              style={{ left: `${leftPosition}%` }}
              title={`${burst.time / 1000}s: ${burst.amount} people, Floor ${burst.originFloor} → Floor ${burst.destinationFloor} (±${burst.timeRange}ms)`}
              onClick={(e) => handleDotClick(burst, e)}
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
      
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingBurst ? 'Edit Burst' : 'Create Burst'}</h3>
            <div className="modal-field">
              <label>Amount of people:</label>
              <input
                type="number"
                min="1"
                max="20"
                value={modalData.amount}
                onChange={(e) => setModalData({...modalData, amount: parseInt(e.target.value)})}
              />
            </div>
            <div className="modal-field">
              <label>Origin floor:</label>
              <input
                type="number"
                min="1"
                max="20"
                value={modalData.originFloor}
                onChange={(e) => setModalData({...modalData, originFloor: parseInt(e.target.value)})}
              />
            </div>
            <div className="modal-field">
              <label>Destination floor:</label>
              <input
                type="number"
                min="1"
                max="20"
                value={modalData.destinationFloor}
                onChange={(e) => setModalData({...modalData, destinationFloor: parseInt(e.target.value)})}
              />
            </div>
            <div className="modal-field">
              <label>Time range (0ms to 10000ms):</label>
              <input
                type="number"
                min="0"
                max="10000"
                value={modalData.timeRange}
                onChange={(e) => setModalData({...modalData, timeRange: parseInt(e.target.value)})}
              />
            </div>
            <div className="modal-field">
              <label>Time ({modalData.time / 1000}s):</label>
              <input
                type="number"
                min="0"
                max="30000"
                step="100"
                value={modalData.time}
                onChange={(e) => setModalData({...modalData, time: parseInt(e.target.value)})}
              />
            </div>
            <div className="modal-buttons">
              <button onClick={handleModalSubmit}>
                {editingBurst ? 'Update' : 'Create'}
              </button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Timeline