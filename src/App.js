import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Unique icon for the school
const schoolIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41]
});

// Unique icon for students (blue)
const studentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41]
});

const defaultPosition = [32.4740, 34.9818];

function App() {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        setStudents([...students, { name, address, lat: parseFloat(lat), lon: parseFloat(lon) }]);
        setName('');
        setAddress('');
      } else {
        setError('כתובת לא נמצאה');
      }
    } catch (err) {
      setError('שגיאה בחיפוש הכתובת');
    }
    setLoading(false);
  };

  return (
    <div className="App" style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <h2 style={{ textAlign: 'center' }}>מפת כתובות תלמידים</h2>
      <MapContainer center={defaultPosition} zoom={15} scrollWheelZoom={true} style={{ height: '60vh', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={defaultPosition} icon={schoolIcon}>
          <Popup>
            תיכון חקלאי פרדס חנה
          </Popup>
        </Marker>
        {students.map((student, idx) => (
          <Marker key={idx} position={[student.lat, student.lon]} icon={studentIcon}>
            <Tooltip direction="top" offset={[0, -20]}>{student.name}</Tooltip>
            <Popup>
              <b>{student.name}</b><br />
              {student.address}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <form onSubmit={handleSubmit} style={{ marginTop: 24, direction: 'rtl' }}>
        <div style={{ marginBottom: 8 }}>
          <label>שם: </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={{ width: '60%' }}
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>כתובת: </label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            required
            style={{ width: '60%' }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '6px 16px' }}>
          {loading ? 'מוסיף...' : 'הוסף כתובת'}
        </button>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </form>
    </div>
  );
}

export default App;
