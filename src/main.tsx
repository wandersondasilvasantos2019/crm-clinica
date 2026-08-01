import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { InstanceProvider } from './context/InstanceContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <InstanceProvider>
          <App />
        </InstanceProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
