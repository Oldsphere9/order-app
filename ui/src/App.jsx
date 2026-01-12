import { useState } from 'react'
import Header from './components/Header'
import OrderPage from './pages/OrderPage'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('order')

  return (
    <div className="App">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'order' && <OrderPage />}
      {activeTab === 'status' && (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>주문 현황 화면은 준비 중입니다.</h2>
        </div>
      )}
    </div>
  )
}

export default App
