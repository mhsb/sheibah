import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Application crashed:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; color: red; text-align: center; direction: ltr;">
      <h1>Application Error</h1>
      <p>Failed to start the application.</p>
      <pre>${error instanceof Error ? error.message : String(error)}</pre>
    </div>
  `;
}
