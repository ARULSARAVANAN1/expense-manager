import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import './styles/variables.css'
import './index.css'
import './styles/global.css'
import App from './App.tsx'
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
      <Tooltip
        id="app-tooltip"
        className="app-tooltip"
        portalRoot={document.body}
        positionStrategy="fixed"
        delayShow={200}
        opacity={1}
        disableStyleInjection
        closeEvents={{ mouseleave: true, blur: true, click: true }}
        globalCloseEvents={{ escape: true, scroll: true, resize: true, clickOutsideAnchor: true }}
      />
    </ThemeProvider>
  </StrictMode>,
)
