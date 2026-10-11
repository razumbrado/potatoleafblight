import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import '@fontsource-variable/plus-jakarta-sans';
import './styles/index.css';
import App from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { DetectionProvider } from './contexts/DetectionContext';
import { ModelProvider } from './contexts/ModelContext';
import { ScansProvider } from './contexts/ScansContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={theme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: { fontFamily: 'inherit', borderRadius: '14px' },
      }}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <ModelProvider>
              <ScansProvider>
                <DetectionProvider>
                  <App />
                  <ThemedToaster />
                </DetectionProvider>
              </ScansProvider>
            </ModelProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
