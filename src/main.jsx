import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async';
import { BlogProvider } from './context/BlogContext';
import { InventoryProvider } from './context/InventoryContext';
import { RecipeProvider } from './context/RecipeContext';
import './index.css'
import App from './App.jsx'

import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <BlogProvider>
          <InventoryProvider>
            <RecipeProvider>
              <App />
            </RecipeProvider>
          </InventoryProvider>
        </BlogProvider>
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
)
