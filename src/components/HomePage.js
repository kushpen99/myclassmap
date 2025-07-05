import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // If user is already logged in, redirect to dashboard
  React.useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>ברוכים הבאים ל-MyClassMap</h1>
        <p>אפליקציה ליצירת מפות כיתה אינטראקטיביות</p>
        
        <div className="mode-selection">
          <div className="mode-card teacher-mode">
            <h2>מצב מורה</h2>
            <p>צור כיתות חדשות, הזמן תלמידים וצפה במפות הכיתה</p>
            <div className="mode-actions">
              <button 
                onClick={() => navigate('/login')}
                className="mode-button primary"
              >
                התחבר
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="mode-button secondary"
              >
                הירשם
              </button>
            </div>
          </div>
          
          <div className="mode-card student-mode">
            <h2>מצב תלמיד</h2>
            <p>הצטרף לכיתה והוסף את המיקום שלך למפה</p>
            <div className="mode-actions">
              <button 
                onClick={() => navigate('/join')}
                className="mode-button primary"
              >
                הצטרף לכיתה
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 