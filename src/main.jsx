import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BlogProvider } from './context/BlogContext';
import { InventoryProvider } from './context/InventoryContext';
import { RecipeProvider } from './context/RecipeContext';
import './index.css'
import App from './App.jsx'

import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BlogProvider>
        <InventoryProvider>
          <RecipeProvider>
            <App />
          </RecipeProvider>
        </InventoryProvider>
      </BlogProvider>
    </ErrorBoundary>
  </StrictMode>,
)
