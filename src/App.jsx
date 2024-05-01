import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import LandingPage from './components/LandingPage';
import NotFound from './components/NotFound';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './App.css';

const App = () => {
  const [userAuthenticated, setUserAuthenticated] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserAuthenticated(true);
      } else {
        setUserAuthenticated(false);
      }
    });
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={userAuthenticated ? <Home /> : <LandingPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
