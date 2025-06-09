import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import SplashScreen from "./SplashScreen";

// Create a wrapper component
const AppWithSplash = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Check sessionStorage
    const hasVisitedBefore = sessionStorage.getItem('hasVisitedEduSync');

    if (!hasVisitedBefore) {
      // First visit - show splash and set flag
      sessionStorage.setItem('hasVisitedEduSync', 'true');
      setShowSplash(true);
      console.log("First visit - showing splash screen");
    } else {
      // Return visit - skip splash
      setShowSplash(false);
      console.log("Return visit - skipping splash screen");
    }
  }, []);

  const handleSplashComplete = () => {
    console.log("Splash screen completed");
    setShowSplash(false);
  };

  return showSplash ? <SplashScreen onComplete={handleSplashComplete} /> : <App />;
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppWithSplash />
  </React.StrictMode>
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
