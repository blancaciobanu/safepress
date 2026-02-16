import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { CrisisProvider } from './contexts/CrisisContext'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <CrisisProvider>
        <App />
      </CrisisProvider>
    </AuthProvider>
  </BrowserRouter>,
)
