import React from 'react';
import Header from './components/Layout/Header';
import Hero from './components/Home/Hero';
import Workflow from './components/Home/Workflow';
import SongLibrary from './components/SongLibrary/SongLibrary';

function App() {
  return (
    <>
      <Header />
      <main className="container" style={{ paddingBottom: '100px' }}>
        <Hero />
        <SongLibrary />
        <Workflow />
      </main>
    </>
  );
}

export default App;
