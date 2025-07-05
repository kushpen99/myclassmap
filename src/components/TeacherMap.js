import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate, useParams } from 'react-router-dom';

// List of valid marker icon colors
const markerColors = [
  'red', 'blue', 'green', 'orange', 'yellow', 'violet', 'grey', 'black', 'gold'
];

function createStudentIcon(color) {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41]
  });
}

// Default position (will be overridden by school location)
const defaultPosition = [32.4740, 34.9818];

export default function TeacherMap() {
  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { classId } = useParams();

  useEffect(() => {
    loadClassInfo();
    const unsubscribe = subscribeToStudents();
    return () => unsubscribe();
  }, [classId]);

  async function loadClassInfo() {
    try {
      const classDoc = await getDoc(doc(db, 'classes', classId));
      if (classDoc.exists()) {
        setClassInfo(classDoc.data());
      } else {
        setError('Class not found');
      }
    } catch (error) {
      setError('Failed to load class information');
    } finally {
      setLoading(false);
    }
  }

  function subscribeToStudents() {
    return onSnapshot(doc(db, 'classes', classId), (doc) => {
      if (doc.exists()) {
        setStudents(doc.data().students || []);
      }
    });
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="App">
      <div dir="ltr" style={{width: '100%'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>{classInfo.name} - המפה שלנו</h2>
            <p>בית ספר: {classInfo.schoolName}</p>
            <p>מספר תלמידים: {students.length}</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            חזור לדשבורד
          </button>
        </div>
      </div>
      <div className="map-card">
        <MapContainer 
          center={[classInfo.schoolLat || defaultPosition[0], classInfo.schoolLon || defaultPosition[1]]} 
          zoom={15} 
          scrollWheelZoom={true} 
          style={{ height: '70vh', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker 
            position={[classInfo.schoolLat || defaultPosition[0], classInfo.schoolLon || defaultPosition[1]]} 
            icon={createStudentIcon(markerColors[0])}
          >
            <Popup>
              {classInfo.schoolName}
            </Popup>
          </Marker>
          {students.map((student, idx) => (
            <Marker
              key={idx}
              position={[student.lat, student.lon]}
              icon={createStudentIcon(markerColors[student.iconIdx])}
            >
              <Tooltip direction="top" offset={[0, -20]} permanent>{student.name}</Tooltip>
              <Popup>
                <b>{student.name}</b><br />
                {student.address}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      {students.length > 0 && (
        <div className="students-list" style={{ marginTop: '20px', direction: 'rtl' }}>
          <h3>רשימת תלמידים:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {students.map((student, idx) => (
              <div key={idx} style={{ 
                padding: '10px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                backgroundColor: '#f9f9f9'
              }}>
                <strong>{student.name}</strong><br />
                {student.address}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 