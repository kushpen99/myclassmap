import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import SchoolManager from './SchoolManager';

export default function TeacherDashboard() {
  const [classes, setClasses] = useState([]);
  const [newClassName, setNewClassName] = useState('');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    try {
      const q = query(
        collection(db, 'classes'), 
        where('teacherId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const classesData = [];
      querySnapshot.forEach((doc) => {
        classesData.push({ id: doc.id, ...doc.data() });
      });
      setClasses(classesData);
    } catch (error) {
      setError('Failed to load classes');
    }
  }

  async function createClass(e) {
    e.preventDefault();
    if (!newClassName.trim()) return;
    if (!selectedSchool) {
      setError('יש לבחור בית ספר');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      // Generate a unique class code
      const classCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
              const classData = {
          name: newClassName,
          code: classCode,
          teacherId: currentUser.uid,
          teacherName: currentUser.displayName,
          schoolId: selectedSchool.id,
          schoolName: selectedSchool.displayName || selectedSchool.name,
          schoolAddress: selectedSchool.address,
          schoolLat: selectedSchool.lat,
          schoolLon: selectedSchool.lon,
          createdAt: new Date(),
          students: []
        };

      await addDoc(collection(db, 'classes'), classData);
      setNewClassName('');
      loadClasses();
    } catch (error) {
      setError('Failed to create class');
    }
    setLoading(false);
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      setError('Failed to log out');
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>ברוך הבא, {currentUser.displayName}!</h1>
        <button onClick={handleLogout} className="logout-button">
          התנתק
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="create-class-section">
        <h2>צור כיתה חדשה</h2>
        
        <SchoolManager 
          onSchoolSelect={setSelectedSchool}
          selectedSchoolId={selectedSchool?.id}
        />
        
        {selectedSchool && (
          <div className="selected-school-info">
            <h4>בית ספר נבחר: {selectedSchool.name}</h4>
            <p>{selectedSchool.address}</p>
          </div>
        )}
        
        <form onSubmit={createClass} style={{ direction: 'rtl' }}>
          <div className="form-group">
            <label>שם הכיתה:</label>
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              required
              placeholder="לדוגמה: כיתה י'1"
            />
          </div>
          <button disabled={loading || !selectedSchool} type="submit" className="create-button">
            {loading ? 'יוצר...' : 'צור כיתה'}
          </button>
        </form>
      </div>

      <div className="classes-section">
        <h2>הכיתות שלך</h2>
        {classes.length === 0 ? (
          <p>אין לך כיתות עדיין. צור כיתה חדשה כדי להתחיל!</p>
        ) : (
          <div className="classes-grid">
            {classes.map((cls) => (
              <div key={cls.id} className="class-card">
                <h3>{cls.name}</h3>
                <p>בית ספר: <strong>{cls.schoolName}</strong></p>
                <p>קוד כיתה: <strong>{cls.code}</strong></p>
                <p>מספר תלמידים: {cls.students?.length || 0}</p>
                <div className="class-actions">
                  <button 
                    onClick={() => copyToClipboard(cls.code)}
                    className="copy-button"
                  >
                    העתק קוד
                  </button>
                  <button 
                    onClick={() => navigate(`/class/${cls.id}`)}
                    className="view-button"
                  >
                    צפה במפה
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 