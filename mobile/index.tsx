import React from 'react';
import ReactDOM from 'react-dom/client';
import AppMobile from './AppMobile';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppMobile />
  </React.StrictMode>
);