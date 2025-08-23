import useAppStore from './appStore'
import './AddSimulatorCard.css'

function AddSimulatorCard() {
  const { addSimulator } = useAppStore()
  
  return (
    <div className="add-simulator-card" onClick={addSimulator}>
      <div className="plus-button">+</div>
    </div>
  )
}

export default AddSimulatorCard