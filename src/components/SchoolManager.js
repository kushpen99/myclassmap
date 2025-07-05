import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  orderBy,
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';

export default function SchoolManager({ onSchoolSelect, selectedSchoolId }) {
  const [schools, setSchools] = useState([]);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolAddress, setNewSchoolAddress] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [schoolSuggestions, setSchoolSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedExistingSchool, setSelectedExistingSchool] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      loadSchools();
    }
  }, [currentUser]);

  // Debug: Monitor schoolSuggestions changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('schoolSuggestions state changed:', schoolSuggestions.length, 'items');
      console.log('showSchoolSuggestions:', showSchoolSuggestions);
    }
  }, [schoolSuggestions, showSchoolSuggestions]);

  async function loadSchools() {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Loading schools for teacher:', currentUser?.uid);
      }
      
      // Load schools created by this teacher
      const q = query(
        collection(db, 'schools'), 
        where('teacherId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const schoolsData = [];
      querySnapshot.forEach((doc) => {
        schoolsData.push({ id: doc.id, ...doc.data() });
      });
      if (process.env.NODE_ENV === 'development') {
        console.log('Loaded schools:', schoolsData);
      }
      setSchools(schoolsData);
    } catch (error) {
      console.error('Error loading schools:', error);
      if (error.code === 'permission-denied') {
        setError('Permission denied. Please check your Firestore security rules.');
      } else if (error.code === 'unavailable') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(`Failed to load schools: ${error.message}`);
      }
    }
  }

  async function searchExistingSchools(searchTerm) {
    if (searchTerm.length < 3) {
      setSchoolSuggestions([]);
      return;
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Searching for schools with term:', searchTerm);
      }
      
      // Get all schools and filter client-side for better search
      const q = query(
        collection(db, 'schools'),
        limit(50) // Limit to prevent too many reads
      );
      const querySnapshot = await getDocs(q);
      const suggestions = [];
      const searchLower = searchTerm.toLowerCase();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Total schools in database:', querySnapshot.size);
      }
      
      querySnapshot.forEach((doc) => {
        const schoolData = { id: doc.id, ...doc.data() };
        if (process.env.NODE_ENV === 'development') {
          console.log('Checking school:', {
            displayName: schoolData.displayName,
            name: schoolData.name,
            fullData: schoolData
          });
        }
        
        // Check if school name contains search term (case-insensitive)
        const displayName = schoolData.displayName || schoolData.name;
        const name = schoolData.name || '';
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Checking against:', { displayName, name, searchLower });
        }
        
        const displayNameLower = displayName.toLowerCase();
        const includesSearch = displayNameLower.includes(searchLower);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('String comparison:', {
            displayNameLower,
            searchLower,
            includesSearch,
            displayNameLowerLength: displayNameLower.length,
            searchLowerLength: searchLower.length
          });
        }
        
        if (displayName && 
            includesSearch &&
            !schools.find(s => s.id === schoolData.id)) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Found matching school:', displayName);
          }
          suggestions.push(schoolData);
        }
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Found suggestions:', suggestions.length);
      }
      
      // Sort by relevance (exact matches first)
      suggestions.sort((a, b) => {
        const aStartsWith = a.displayName.toLowerCase().startsWith(searchLower);
        const bStartsWith = b.displayName.toLowerCase().startsWith(searchLower);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.displayName.localeCompare(b.displayName);
      });
      
      const finalSuggestions = suggestions.slice(0, 10); // Limit to 10 suggestions
      if (process.env.NODE_ENV === 'development') {
        console.log('Final suggestions to display:', finalSuggestions.map(s => s.displayName));
      }
      setSchoolSuggestions(finalSuggestions);
      if (process.env.NODE_ENV === 'development') {
        console.log('setSchoolSuggestions called with:', finalSuggestions.length, 'items');
      }
    } catch (error) {
      console.error('Error searching schools:', error);
    }
  }

  async function createSchool(e) {
    e.preventDefault();
    if (!newSchoolName.trim() || !newSchoolAddress.trim()) return;

    try {
      setError('');
      setLoading(true);
      
      let schoolData;
      
      if (selectedExistingSchool) {
        // Using existing school - no need to geocode or create new document
        schoolData = selectedExistingSchool;
      } else {
        // Creating new school - geocode address
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newSchoolAddress)}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          
          schoolData = {
            name: newSchoolName.toLowerCase(), // Store lowercase for search
            displayName: newSchoolName, // Store original case for display
            address: newSchoolAddress,
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            teacherId: currentUser.uid,
            createdAt: new Date(),
            teachers: [currentUser.uid] // Track all teachers using this school
          };

          const docRef = await addDoc(collection(db, 'schools'), schoolData);
          schoolData = { id: docRef.id, ...schoolData };
        } else {
          setError('כתובת בית הספר לא נמצאה');
          setLoading(false);
          return;
        }
      }
      
      // Add to teacher's schools list if not already there
      if (!schools.find(s => s.id === schoolData.id)) {
        setSchools([...schools, schoolData]);
      }
      
      // Reset form
      setNewSchoolName('');
      setNewSchoolAddress('');
      setShowAddForm(false);
      setSchoolSuggestions([]);
      setSelectedExistingSchool(null);
      
      // Select the school
      if (onSchoolSelect) {
        onSchoolSelect(schoolData);
      }
    } catch (error) {
      setError('Failed to create school');
    }
    setLoading(false);
  }

  async function selectExistingSchool(school) {
    try {
      // Set the selected existing school and populate the form
      setSelectedExistingSchool(school);
      setNewSchoolName(school.displayName || school.name);
      setNewSchoolAddress(school.address);
      setSchoolSuggestions([]);
      setShowSchoolSuggestions(false);
      
      // Add current teacher to the school's teachers list if not already there
      if (!school.teachers || !school.teachers.includes(currentUser.uid)) {
        await updateDoc(doc(db, 'schools', school.id), {
          teachers: [...(school.teachers || []), currentUser.uid]
        });
        school.teachers = [...(school.teachers || []), currentUser.uid];
      }
      
      // Add to teacher's schools list
      setSchools([...schools, school]);
      
      if (onSchoolSelect) {
        onSchoolSelect(school);
      }
    } catch (error) {
      setError('Failed to select school');
    }
  }

  // Autocomplete address suggestions
  const GEOAPIFY_API_KEY = "0c503457a87f4056b325908b2f963526";
  const handleAddressChange = async (e) => {
    const value = e.target.value;
    setNewSchoolAddress(value);
    setShowAddressSuggestions(true);
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

  const handleAddressSuggestionClick = (suggestion) => {
    setNewSchoolAddress(suggestion);
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
  };

  const handleSchoolNameChange = async (e) => {
    const value = e.target.value;
    if (process.env.NODE_ENV === 'development') {
      console.log('School name changed to:', value);
    }
    setNewSchoolName(value);
    setShowSchoolSuggestions(true);
    await searchExistingSchools(value);
  };

  const handleSchoolSuggestionClick = (school) => {
    selectExistingSchool(school);
  };

  const clearSelectedSchool = () => {
    setSelectedExistingSchool(null);
    setNewSchoolName('');
    setNewSchoolAddress('');
    setSchoolSuggestions([]);
    setShowSchoolSuggestions(false);
  };

  return (
    <div className="school-manager">
      <div className="schools-section">
        <div className="section-header">
          <h3>בחר בית ספר</h3>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="add-school-button"
          >
            {showAddForm ? 'ביטול' : 'הוסף בית ספר חדש'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {showAddForm && (
          <div className="add-school-form">
            {selectedExistingSchool && (
              <div className="selected-school-info" style={{ 
                background: '#e8f5e8', 
                padding: '10px', 
                borderRadius: '5px', 
                marginBottom: '15px',
                direction: 'rtl'
              }}>
                <p><strong>בית ספר נבחר:</strong> {selectedExistingSchool.displayName || selectedExistingSchool.name}</p>
                <p><strong>כתובת:</strong> {selectedExistingSchool.address}</p>
                <button 
                  type="button" 
                  onClick={clearSelectedSchool}
                  style={{ 
                    background: '#ff6b6b', 
                    color: 'white', 
                    border: 'none', 
                    padding: '5px 10px', 
                    borderRadius: '3px', 
                    cursor: 'pointer' 
                  }}
                >
                  שנה בחירה
                </button>
              </div>
            )}
            
            <form onSubmit={createSchool} style={{ direction: 'rtl' }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>שם בית הספר:</label>
                <input
                  type="text"
                  value={newSchoolName}
                  onChange={handleSchoolNameChange}
                  required
                  placeholder="הזן שם בית הספר או בחר מבית ספר קיים"
                  autoComplete="off"
                  onFocus={() => newSchoolName.length > 2 && setShowSchoolSuggestions(true)}
                  disabled={selectedExistingSchool !== null}
                />
                {showSchoolSuggestions && schoolSuggestions.length > 0 && (
                  <ul className="school-suggestions">
                    {schoolSuggestions.map((school, idx) => (
                      <li
                        key={idx}
                        onClick={() => handleSchoolSuggestionClick(school)}
                        className="school-suggestion-item"
                      >
                        <div className="school-suggestion-name">{school.displayName}</div>
                        <div className="school-suggestion-address">{school.address}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>כתובת בית הספר:</label>
                <input
                  type="text"
                  value={newSchoolAddress}
                  onChange={handleAddressChange}
                  required
                  placeholder="הזן כתובת מלאה"
                  autoComplete="off"
                  onFocus={() => newSchoolAddress.length > 2 && setShowAddressSuggestions(true)}
                  disabled={selectedExistingSchool !== null}
                />
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <ul className="address-suggestions">
                    {addressSuggestions.map((suggestion, idx) => (
                      <li
                        key={idx}
                        onClick={() => handleAddressSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button disabled={loading} type="submit" className="create-button">
                {loading ? 'יוצר...' : selectedExistingSchool ? 'הוסף בית ספר קיים' : 'צור בית ספר חדש'}
              </button>
            </form>
          </div>
        )}

        <div className="schools-list">
          {schools.length === 0 ? (
            <p>אין לך בתי ספר עדיין. הוסף בית ספר חדש כדי להתחיל!</p>
          ) : (
            <div className="schools-grid">
              {schools.map((school) => (
                              <div 
                key={school.id} 
                className={`school-card ${selectedSchoolId === school.id ? 'selected' : ''}`}
                onClick={() => onSchoolSelect && onSchoolSelect(school)}
              >
                <h4>{school.displayName || school.name}</h4>
                <p>{school.address}</p>
                {school.teachers && school.teachers.length > 1 && (
                  <span className="shared-school-indicator">משותף</span>
                )}
                {selectedSchoolId === school.id && (
                  <span className="selected-indicator">✓ נבחר</span>
                )}
              </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 