import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { doc, getDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useParams } from 'react-router-dom';

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

export default function StudentMap() {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [classInfo, setClassInfo] = useState(null);
  const suggestionsRef = useRef();
  const [selectedIconIdx, setSelectedIconIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      }
    } catch (error) {
      setError('Failed to load class information');
    }
  }

  function subscribeToStudents() {
    return onSnapshot(doc(db, 'classes', classId), (doc) => {
      if (doc.exists()) {
        setStudents(doc.data().students || []);
      }
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Geocode address using Nominatim
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newStudent = {
          name,
          address,
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          iconIdx: selectedIconIdx,
          addedAt: new Date()
        };

        // Add student to Firestore
        await updateDoc(doc(db, 'classes', classId), {
          students: arrayUnion(newStudent)
        });

        setName('');
        setAddress('');
        setSelectedIconIdx(0);
      } else {
        setError('כתובת לא נמצאה');
      }
    } catch (err) {
      setError('שגיאה בחיפוש הכתובת');
    }
    setLoading(false);
  };

  // Autocomplete address suggestions using Geoapify
  const GEOAPIFY_API_KEY = "0c503457a87f4056b325908b2f963526";
  const handleAddressChange = async (e) => {
    const value = e.target.value;
    setAddress(value);
    setShowSuggestions(true);
    if (value.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(value)}&lang=he&limit=5&apiKey=${GEOAPIFY_API_KEY}`);
      const data = await res.json();
      setAddressSuggestions(
        (data.features || []).map(item => item.properties.formatted)
      );
    } catch {
      setAddressSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setAddress(suggestion);
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  // Hide suggestions when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!classInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <div dir="ltr" style={{width: '100%'}}>
        <h2>{classInfo.name} - המפה שלנו</h2>
        <p>בית ספר: {classInfo.schoolName}</p>
        <p>מורה: {classInfo.teacherName}</p>
      </div>
      <div className="map-card">
        <MapContainer 
          center={[classInfo.schoolLat || defaultPosition[0], classInfo.schoolLon || defaultPosition[1]]} 
          zoom={15} 
          scrollWheelZoom={true} 
          style={{ height: '60vh', width: '100%' }}
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
      <div className="form-card">
        <form onSubmit={handleSubmit} style={{ marginTop: 0, direction: 'rtl' }}>
          <div style={{ marginBottom: 8 }}>
            <label>שם: </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: 8, position: 'relative' }}>
            <label>כתובת: </label>
            <input
              type="text"
              value={address}
              onChange={handleAddressChange}
              required
              style={{ width: '100%' }}
              autoComplete="off"
              onFocus={() => address.length > 2 && setShowSuggestions(true)}
            />
            {showSuggestions && addressSuggestions.length > 0 && (
              <ul ref={suggestionsRef} className="address-suggestions">
                {addressSuggestions.map((suggestion, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    style={{
                      background: suggestion === address ? '#f0f0f0' : '#fff'
                    }}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={{ marginBottom: 8 }}>
            <span className="icon-picker-label">בחר סמל: </span>
            <div className="icon-picker-grid">
              {markerColors.map((color, idx) => (
                <label key={idx}>
                  <input
                    type="radio"
                    name="icon"
                    value={idx}
                    checked={selectedIconIdx === idx}
                    onChange={() => setSelectedIconIdx(idx)}
                  />
                  <img
                    src={`https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`}
                    alt={color}
                  />
                </label>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'מוסיף...' : 'הוסף כתובת'}
          </button>
          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        </form>
      </div>
    </div>
  );
} 