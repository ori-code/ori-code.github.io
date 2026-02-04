import React from 'react';
import Header from './components/Layout/Header';
import Hero from './components/Home/Hero';
import Workflow from './components/Home/Workflow';
import SongLibrary from './components/SongLibrary/SongLibrary';

import ScannerLab from './components/Home/ScannerLab';

function App() {
  return (
    <>
      <Header />
      <main className="container" style={{ paddingBottom: '100px' }}>
        <Hero />
        <ScannerLab />
        <SongLibrary />
        <Workflow />
      </main>
    </>
  );
}

export default App;
