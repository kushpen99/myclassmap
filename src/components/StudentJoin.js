import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function StudentJoin() {
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!classCode.trim()) return;

    try {
      setError('');
      setLoading(true);
      
      // Find class by code
      const q = query(
        collection(db, 'classes'), 
        where('code', '==', classCode.toUpperCase())
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('קוד כיתה לא נמצא');
        return;
      }

      const classDoc = querySnapshot.docs[0];
      const classData = classDoc.data();
      
      // Store class info in localStorage for student session
      localStorage.setItem('currentClass', JSON.stringify({
        id: classDoc.id,
        name: classData.name,
        teacherName: classData.teacherName
      }));

      navigate(`/student-map/${classDoc.id}`);
    } catch (error) {
      setError('שגיאה בחיבור לכיתה');
    }
    setLoading(false);
  }

  return (
    <div className="join-container">
      <div className="join-card">
        <h2>הצטרף לכיתה</h2>
        <p>הזן את קוד הכיתה שקיבלת מהמורה</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ direction: 'rtl' }}>
          <div className="form-group">
            <label>קוד כיתה:</label>
            <input
              type="text"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              required
              placeholder="לדוגמה: ABC123"
              maxLength={6}
              style={{ textTransform: 'uppercase' }}
            />
          </div>
          <button disabled={loading} type="submit" className="join-button">
            {loading ? 'מתחבר...' : 'הצטרף לכיתה'}
          </button>
        </form>
        
        <div className="join-info">
          <p>אין לך קוד? בקש מהמורה שלך</p>
        </div>
      </div>
    </div>
  );
} 