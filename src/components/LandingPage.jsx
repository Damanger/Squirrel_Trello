import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import '../css/LandingPage.css';

const firebaseConfig = {
    apiKey: "AIzaSyDMvttW6uWMalJiQLOlyJwaYdv9HNchHas",
    authDomain: "squirrel-trello.firebaseapp.com",
    projectId: "squirrel-trello",
    storageBucket: "squirrel-trello.appspot.com",
    messagingSenderId: "349870855963",
    appId: "1:349870855963:web:95b9eab2f8c0628978e5be",
    measurementId: "G-2NZBWTDLTQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const LandingPage = () => {
    const [userAuthenticated, setUserAuthenticated] = useState(false);

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserAuthenticated(true);
            } else {
                setUserAuthenticated(false);
            }
        });
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error(error);
        }
    };

    if (userAuthenticated) {
        return <Navigate to="/home" />;
    }

    return (
        <div className="landing-container">
            <div className="hero-banner">
                <h1>Squirrel Trello</h1>
                {!userAuthenticated && (
                    <button className="signin" onClick={signInWithGoogle}>
                        Sign in with Google
                    </button>
                )}
            </div>
        </div>
        );
    };

export default LandingPage;