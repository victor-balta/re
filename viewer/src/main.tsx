import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import SleeperEdgeCasePage from './pages/SleeperEdgeCasePage.tsx'
import DetailsPage from './pages/DetailsPage.tsx'
import PaymentPage from './pages/PaymentPage.tsx'
import './index.css'

function Router() {
    const [route, setRoute] = useState(window.location.hash)

    useEffect(() => {
        const handleHashChange = () => setRoute(window.location.hash)
        window.addEventListener('hashchange', handleHashChange)
        return () => window.removeEventListener('hashchange', handleHashChange)
    }, [])

    // Simple hash-based routing
    if (route === '#/sleeper') {
        return <SleeperEdgeCasePage />
    }
    if (route === '#/details') {
        return <DetailsPage />
    }
    if (route === '#/payment') {
        return <PaymentPage />
    }

    return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Router />
    </React.StrictMode>,
)
