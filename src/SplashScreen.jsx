import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        console.log('SplashScreen mounted');

        // Set a timer to fade out and then call onComplete
        const timer = setTimeout(() => {
            console.log('Starting fade out');
            setVisible(false);

            // After fade animation completes, call onComplete
            setTimeout(() => {
                console.log('Fade completed, calling onComplete');
                if (onComplete) {
                    onComplete();
                }
            }, 600); // Duration of fade-out animation
        }, 5000); // Show for 5 seconds

        return () => {
            console.log('SplashScreen unmounting');
            clearTimeout(timer);
        };
    }, [onComplete]);

    return (
        <div className={`splash-screen ${visible ? '' : 'fade-out'}`}>
            <div className="splash-content">
                <div className="spinner-container">
                    <div className="spinner"></div>
                </div>
                <h1>EduSync</h1>
                <p>Your Learning Platform</p>
            </div>
        </div>
    );
};

export default SplashScreen; 