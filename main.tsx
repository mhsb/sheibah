import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Add global polyfills
window.global = window
window.Buffer = window.Buffer || require('buffer').Buffer
window.process = window.process || require('process')

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
