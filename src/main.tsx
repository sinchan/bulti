import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { AuthProvider } from './lib/auth'
import { ReactQueryClientProvider } from './components/ReactQueryClientProvider'
import './index.css'

// Add dark mode class based on system preference
function setInitialColorMode() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Run immediately
setInitialColorMode()

// Also listen for changes in system preference
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  if (event.matches) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReactQueryClientProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ReactQueryClientProvider>
  </StrictMode>,
)