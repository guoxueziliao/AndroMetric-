import React from 'react';
import AppContent from './app/AppContent';
import AppProviders from './app/AppProviders';

const App: React.FC = () => (
  <AppProviders>
    {(data) => <AppContent data={data} />}
  </AppProviders>
);

export default App;
