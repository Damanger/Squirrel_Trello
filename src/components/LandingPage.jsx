import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import '../css/LandingPage.css';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
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