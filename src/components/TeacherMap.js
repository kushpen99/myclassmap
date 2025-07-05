import React, { useState, useEffect, useRef } from 'react';
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
  const mapRef = useRef();

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

  const handlePrint = (gridSizeParam = '1x1') => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    const currentBounds = map.getBounds();
    const gridSize = gridSizeParam.split('x').map(Number);
    const pagesX = gridSize[0];
    const pagesY = gridSize[1];
    
    // Calculate the total bounds needed for the grid
    const latDiff = currentBounds.getNorthEast().lat - currentBounds.getSouthWest().lat;
    const lngDiff = currentBounds.getNorthEast().lng - currentBounds.getSouthWest().lng;
    
    // Expand bounds to cover the entire grid
    const expandedSouthWestLat = currentBounds.getSouthWest().lat - latDiff * (pagesY - 1) / 2;
    const expandedSouthWestLng = currentBounds.getSouthWest().lng - lngDiff * (pagesX - 1) / 2;
    const expandedNorthEastLat = currentBounds.getNorthEast().lat + latDiff * (pagesY - 1) / 2;
    const expandedNorthEastLng = currentBounds.getNorthEast().lng + lngDiff * (pagesX - 1) / 2;
    
    // Calculate bounds for each page
    const pageLatDiff = expandedNorthEastLat - expandedSouthWestLat;
    const pageLngDiff = expandedNorthEastLng - expandedSouthWestLng;
    const pageLatStep = pageLatDiff / pagesY;
    const pageLngStep = pageLngDiff / pagesX;
    
    // Create print window
    const printWindow = window.open('', '_blank');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${classInfo.name} - Class Map</title>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              font-family: Arial, sans-serif; 
              overflow: hidden;
              height: 100vh;
            }
            .print-header { 
              text-align: center; 
              margin: 20px 20px 10px 20px; 
              direction: rtl; 
            }
            .print-header h1 { margin: 0; color: #333; }
            .print-header p { margin: 5px 0; color: #666; }
            .map-container {
              border: 2px solid #333;
              margin: 10px 20px;
              background: white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              position: relative;
              width: calc(100vw - 40px);
              height: calc(100vh - 180px);
              overflow: auto;
              box-sizing: border-box;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .map-section {
              box-sizing: border-box;
              padding: 0;
              margin: 0;
              position: relative;
              min-width: 800px;
              min-height: 1131px;
              flex-shrink: 0;
            }

            .map-wrapper {
              box-sizing: border-box;
              padding: 0;
              margin: 0;
              position: relative;
              width: 100%;
              height: 100%;
            }

            .custom-zoom-controls {
              position: fixed;
              top: 20px;
              right: 20px;
              z-index: 1001;
              display: flex;
              flex-direction: column;
              gap: 5px;
            }
            
            /* Ensure Leaflet map container fits properly */
            .leaflet-container {
              width: 100% !important;
              height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* Prevent Leaflet from overriding our map section size */
            .map-section.leaflet-container {
              width: inherit !important;
              height: inherit !important;
              position: relative !important;
              top: 0 !important;
              left: 0 !important;
              min-width: inherit !important;
              min-height: inherit !important;
              max-width: inherit !important;
              max-height: inherit !important;
            }
            
            /* Force the wrapper to maintain our custom size */
            .map-wrapper .leaflet-container {
              width: 100% !important;
              height: 100% !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
            }
            
            /* Ensure scrollbars are visible and functional */
            .map-container::-webkit-scrollbar {
              width: 12px;
              height: 12px;
            }
            .map-container::-webkit-scrollbar-track {
              background: #f1f1f1;
            }
            .map-container::-webkit-scrollbar-thumb {
              background: #888;
              border-radius: 6px;
            }
            .map-container::-webkit-scrollbar-thumb:hover {
              background: #555;
            }
            
            .zoom-btn {
              width: 40px;
              height: 40px;
              background-color: white;
              border: 2px solid #333;
              border-radius: 5px;
              font-size: 20px;
              font-weight: bold;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #333;
            }
            .zoom-btn:hover {
              background-color: #f0f0f0;
            }
            .zoom-btn:active {
              transform: scale(0.95);
            }
            
            .page-number {
              position: absolute;
              top: 5px;
              right: 5px;
              background: rgba(255,255,255,0.8);
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 12px;
              font-weight: bold;
            }

            .print-controls {
              position: fixed;
              top: 20px;
              left: 20px;
              background: white;
              padding: 15px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              z-index: 1000;
              direction: rtl;
            }
            .print-controls h4 {
              margin: 0 0 10px 0;
              color: #333;
            }
            .print-controls select {
              margin-left: 10px;
              padding: 5px;
              border: 1px solid #ddd;
              border-radius: 4px;
            }
            .print-button {
              margin-top: 10px;
              padding: 8px 16px;
              background-color: #007bff;
              color: white;
              border: none;
              border-radius: 4px;
              font-size: 14px;
              font-weight: bold;
              cursor: pointer;
              width: 100%;
            }
            .print-button:hover {
              background-color: #0056b3;
            }
            .print-button:active {
              transform: translateY(1px);
            }
            
            @media print {
              body { 
                padding: 0; 
                margin: 0;
              }
              .print-header { 
                display: none;
              }
              .map-container { 
                border: none;
                margin: 0;
                box-shadow: none;
              }
              .print-controls { display: none; }
              .leaflet-control-zoom { display: none; }
              @page {
                size: auto;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-controls">
            <h4>אפשרויות הדפסה:</h4>
            <div>
              <label>גודל דף:</label>
              <select id="gridSizeSelect" onchange="changeGridSize()">
                <option value="1x1">דף אחד (1x1)</option>
                <option value="2x2">4 דפים (2x2)</option>
                <option value="3x3">9 דפים (3x3)</option>
                <option value="4x4">16 דפים (4x4)</option>
              </select>
            </div>
            <button class="print-button" onclick="window.print()">הדפס מפה</button>
          </div>
          <div class="print-header">
            <h1>${classInfo.name} - המפה שלנו</h1>
            <p>בית ספר: ${classInfo.schoolName}</p>
            <p>מורה: ${classInfo.teacherName}</p>
            <p>מספר תלמידים: ${students.length}</p>
            <p>תאריך הדפסה: ${new Date().toLocaleDateString('he-IL')}</p>
          </div>
          
          <div class="map-container" id="mapContainer">
            <div class="map-section" id="mapSection">
              <div class="map-wrapper" id="mapWrapper"></div>
            </div>
            <div class="custom-zoom-controls">
              <button onclick="zoomIn()" class="zoom-btn zoom-in">+</button>
              <button onclick="zoomOut()" class="zoom-btn zoom-out">-</button>
            </div>
          </div>
          
          <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
          <script>
            let currentGridSize = '${gridSizeParam}';
            let currentMap = null;
            
            function zoomIn() {
              if (currentMap) {
                currentMap.zoomIn();
              }
            }
            
            function zoomOut() {
              if (currentMap) {
                currentMap.zoomOut();
              }
            }
            
            window.changeGridSize = function() {
              const newGridSize = document.getElementById('gridSizeSelect').value;
              if (newGridSize !== currentGridSize) {
                currentGridSize = newGridSize;
                regenerateMap();
              }
            };
            
            window.regenerateMap = function() {
              // Clear existing map
              if (window.currentMap && window.currentMap.remove) {
                window.currentMap.remove();
                window.currentMap = null;
              }
              
              // Clear map container
              const mapSection = document.getElementById('mapSection');
              mapSection.innerHTML = '';
              
              // Regenerate with new grid size
              initializeMap();
            };
            
            function initializeMap() {
              // Clear any existing map
              if (window.currentMap) {
                window.currentMap.remove();
                window.currentMap = null;
              }
              
              // Clear the container and recreate wrapper
              const mapSection = document.getElementById('mapSection');
              mapSection.innerHTML = '<div class="map-wrapper" id="mapWrapper"></div>';
              
              const gridSize = currentGridSize.split('x').map(Number);
              const pagesX = gridSize[0];
              const pagesY = gridSize[1];
              
              // Calculate dimensions based on A4 ratio (210:297 ≈ 1:1.414)
              const baseWidth = 800; // Base width for 1x1
              const baseHeight = Math.round(baseWidth * 1.414); // A4 ratio (1131px)
              const mapWidthPx = baseWidth * pagesX;
              const mapHeightPx = baseHeight * pagesY;
              
              console.log('Grid size:', pagesX + 'x' + pagesY);
              console.log('Map section size:', mapWidthPx + 'x' + mapHeightPx);
              
              // Update map section dimensions
              const mapContainer = document.getElementById('mapContainer');
              const mapWrapper = document.getElementById('mapWrapper');
              
              // Set the map section to the calculated size
              mapSection.style.width = mapWidthPx + 'px';
              mapSection.style.height = mapHeightPx + 'px';
              mapSection.style.minWidth = mapWidthPx + 'px';
              mapSection.style.minHeight = mapHeightPx + 'px';
              mapSection.style.maxWidth = mapWidthPx + 'px';
              mapSection.style.maxHeight = mapHeightPx + 'px';
              
              // Set the wrapper to fill the section
              mapWrapper.style.width = '100%';
              mapWrapper.style.height = '100%';
              mapWrapper.style.position = 'relative';
              
              // Force the container to show scrollbars when content is larger
              mapContainer.style.overflow = 'auto';
              
              console.log('Map section size:', mapWidthPx + 'x' + mapHeightPx);
              console.log('Container size:', mapContainer.offsetWidth + 'x' + mapContainer.offsetHeight);
              console.log('Map section actual size:', mapSection.offsetWidth + 'x' + mapSection.offsetHeight);
              console.log('Should show scrollbars:', mapWidthPx > mapContainer.offsetWidth || mapHeightPx > mapContainer.offsetHeight);
              
              // Calculate the expanded bounds for the entire area
              const currentBounds = {
                southWest: { lat: ${currentBounds.getSouthWest().lat}, lng: ${currentBounds.getSouthWest().lng} },
                northEast: { lat: ${currentBounds.getNorthEast().lat}, lng: ${currentBounds.getNorthEast().lng} }
              };
              
              const latDiff = currentBounds.northEast.lat - currentBounds.southWest.lat;
              const lngDiff = currentBounds.northEast.lng - currentBounds.southWest.lng;
              
              // Expand bounds to cover the entire grid
              const expandedSouthWestLat = currentBounds.southWest.lat - latDiff * (pagesY - 1) / 2;
              const expandedSouthWestLng = currentBounds.southWest.lng - lngDiff * (pagesX - 1) / 2;
              const expandedNorthEastLat = currentBounds.northEast.lat + latDiff * (pagesY - 1) / 2;
              const expandedNorthEastLng = currentBounds.northEast.lng + lngDiff * (pagesX - 1) / 2;
              
              const schoolLat = ${classInfo.schoolLat || defaultPosition[0]};
              const schoolLng = ${classInfo.schoolLon || defaultPosition[1]};
              
              const students = ${JSON.stringify(students)};
              
              // Initialize Leaflet map
              const map = L.map('mapWrapper', {
                zoomControl: false, // We'll add custom zoom controls
                minZoom: 10,
                maxZoom: 18
              });
              
              // Store the map instance globally
              window.currentMap = map;
              
              // Add tile layer
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
              }).addTo(map);
              
              // Add school marker
              const schoolIcon = L.divIcon({
                html: '<div style="background-color: #ff6b6b; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                className: 'custom-div-icon',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              });
              
              L.marker([schoolLat, schoolLng], { icon: schoolIcon })
                .addTo(map)
                .bindPopup('${classInfo.schoolName}');
              
              // Add student markers
              students.forEach((student, idx) => {
                const colors = ['#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce'];
                const color = colors[idx % colors.length];
                
                const studentIcon = L.divIcon({
                  html: '<div style="background-color: ' + color + '; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                  className: 'custom-div-icon',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                });
                
                L.marker([student.lat, student.lon], { icon: studentIcon })
                  .addTo(map)
                  .bindTooltip(student.name, { permanent: true, direction: 'top', offset: [0, -20] })
                  .bindPopup('<b>' + student.name + '</b><br>' + student.address);
              });
              
              // Fit map to show all markers
              const bounds = L.latLngBounds([
                [schoolLat, schoolLng],
                ...students.map(s => [s.lat, s.lon])
              ]);
              map.fitBounds(bounds, { padding: [20, 20] });
              
              console.log('Map initialized successfully');
              console.log('Map section size after map init:', mapSection.offsetWidth + 'x' + mapSection.offsetHeight);
              console.log('Map wrapper size after map init:', mapWrapper.offsetWidth + 'x' + mapWrapper.offsetHeight);
              
              // Add custom zoom functions
              window.zoomIn = function() {
                map.zoomIn();
              };
              
              window.zoomOut = function() {
                map.zoomOut();
              };
              
              // Force the correct size after Leaflet has fully initialized
              setTimeout(() => {
                // Force Leaflet to update its container size
                map.invalidateSize();
                
                // Force the wrapper to maintain the correct size
                mapWrapper.style.width = '100%';
                mapWrapper.style.height = '100%';
                
                console.log('After forcing size - Map section size:', mapSection.offsetWidth + 'x' + mapSection.offsetHeight);
                console.log('After forcing size - Map wrapper size:', mapWrapper.offsetWidth + 'x' + mapWrapper.offsetHeight);
                console.log('After forcing size - Container size:', mapContainer.offsetWidth + 'x' + mapContainer.offsetHeight);
                console.log('Scrollbars visible:', mapContainer.scrollWidth > mapContainer.clientWidth || mapContainer.scrollHeight > mapContainer.clientHeight);
              }, 500);
              
              // Test scrollbars
              setTimeout(() => {
                console.log('Test div size:', mapSection.offsetWidth + 'x' + mapSection.offsetHeight);
                console.log('Test wrapper size:', mapWrapper.offsetWidth + 'x' + mapWrapper.offsetHeight);
                console.log('Container scrollWidth/scrollHeight:', mapContainer.scrollWidth + 'x' + mapContainer.scrollHeight);
                console.log('Container clientWidth/clientHeight:', mapContainer.clientWidth + 'x' + mapContainer.clientHeight);
                console.log('Should show scrollbars:', mapContainer.scrollWidth > mapContainer.clientWidth || mapContainer.scrollHeight > mapContainer.clientHeight);
              }, 100);
            }
            
            // Initialize map after page loads
            window.addEventListener('load', function() {
              // Set the initial grid size in the dropdown
              document.getElementById('gridSizeSelect').value = currentGridSize;
              initializeMap();
              
              // Map is ready
              console.log('Map initialized successfully');
            });
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for maps to load then show the page (no auto-print)
    printWindow.addEventListener('load', () => {
      // Page is ready, no auto-print needed
    });
  };

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
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={() => handlePrint('1x1')}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              הדפס מפה
            </button>
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
        

      </div>
      <div className="map-card">
        <MapContainer 
          ref={mapRef}
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