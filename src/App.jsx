import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import LandingPage from './components/LandingPage';
import Cargando from './components/Cargando';
import NotFound from './components/NotFound';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { ToastContainer } from 'react-toastify';
import ParticlesComponent from './components/Particles';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const App = () => {
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserAuthenticated(true);
      } else {
        setUserAuthenticated(false);
      }
    });

    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  return (
    <Router>
      {isLoading ? (
        <Cargando url="https://raw.githubusercontent.com/Damanger/Portfolio/main/public/Ardilla.webp" />
      ) : (
        <>
        <ToastContainer />
        <ParticlesComponent />
        <Routes>
          <Route path="/" element={userAuthenticated ? <Home /> : <LandingPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </>
      )}
    </Router>
  );
};

export default App;
