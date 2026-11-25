import { Fragment, StrictMode, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/ui-fixes.css'
import { registerEmployeeJourneyDemoSeed } from './data/devSeedEmployeeJourney.js'
import { getWhatsappNumber, loadWhatsappSetting, subscribeWhatsappNumber } from './config/whatsappSetting.js'

registerEmployeeJourneyDemoSeed()

// FR-FE-89: fetch the admin-managed WhatsApp number; re-render CTAs if it differs from the default.
loadWhatsappSetting()
function WhatsappKeyed({ children }) {
  const n = useSyncExternalStore(subscribeWhatsappNumber, getWhatsappNumber)
  return <Fragment key={n}>{children}</Fragment>
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <WhatsappKeyed>
          <App />
        </WhatsappKeyed>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
