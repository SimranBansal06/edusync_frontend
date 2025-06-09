import React, { useEffect } from 'react';
import '../styles/LoadingAnimation.css';

const LoadingAnimation = ({ onComplete }) => {
    useEffect(() => {
        console.log('Ultra simple loading animation started');

        // Set a timeout to finish the animation
        const timer = setTimeout(() => {
            console.log('Animation timeout finished, calling onComplete');
            if (onComplete) {
                onComplete();
            }
        }, 3000);

        return () => {
            console.log('Cleaning up loading animation');
            clearTimeout(timer);
        };
    }, [onComplete]);

    return (
        <div className="simple-loading-container">
            <div className="simple-spinner"></div>
            <div className="simple-logo">EduSync</div>
            <div className="simple-text">Loading your learning experience...</div>
        </div>
    );
};

export default LoadingAnimation; 