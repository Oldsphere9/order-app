import { useState } from 'react'
import Header from './components/Header'
import OrderPage from './pages/OrderPage'
import StatusPage from './pages/StatusPage'
import MenuManagementPage from './pages/MenuManagementPage'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('order')

  return (
    <div className="App">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'order' && <OrderPage />}
      {activeTab === 'status' && <StatusPage />}
      {activeTab === 'management' && <MenuManagementPage />}
    </div>
  )
}

export default App
