import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { UserProvider } from './contexts/UserContext'
import './index.css'

// ── 키보드 높이 보정: visualViewport → --vvh CSS 변수 ──
;(function setupVisualViewport() {
  const vv = window.visualViewport
  if (!vv) return
  function update() {
    document.documentElement.style.setProperty('--vvh', vv.height + 'px')
  }
  vv.addEventListener('resize', update)
  vv.addEventListener('scroll', update)
  update()
})()

ReactDOM.createRoot(document.getElementById('root')).render(
  <UserProvider>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </UserProvider>
)
