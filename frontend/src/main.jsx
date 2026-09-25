import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Design system (reset + variables + utility classes) MUST load before every
// component stylesheet. Component rules and component media queries then win
// the cascade tie against generic utilities such as `.flex { display: flex }`.
import './styles/index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
