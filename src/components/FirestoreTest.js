import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function FirestoreTest() {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  async function testFirestoreConnection() {
    setLoading(true);
    setTestResult('Testing Firestore connection...');
    
    try {
      // Test 1: Try to read from schools collection
      const schoolsQuery = await getDocs(collection(db, 'schools'));
      setTestResult(prev => prev + '\n✅ Successfully read from schools collection');
      
      // Test 2: Try to write to schools collection
      const testSchool = {
        name: 'test school',
        displayName: 'Test School',
        address: 'Test Address',
        lat: 32.4740,
        lon: 34.9818,
        teacherId: currentUser?.uid || 'test',
        teachers: [currentUser?.uid || 'test'],
        createdAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'schools'), testSchool);
      setTestResult(prev => prev + '\n✅ Successfully wrote to schools collection');
      
      // Test 3: Try to read from classes collection
      const classesQuery = await getDocs(collection(db, 'classes'));
      setTestResult(prev => prev + '\n✅ Successfully read from classes collection');
      
      setTestResult(prev => prev + '\n🎉 All Firestore tests passed!');
      
    } catch (error) {
      console.error('Firestore test error:', error);
      setTestResult(prev => prev + `\n❌ Error: ${error.message}`);
      
      if (error.code === 'permission-denied') {
        setTestResult(prev => prev + '\n🔒 This appears to be a permissions issue. Check your Firestore security rules.');
      } else if (error.code === 'unavailable') {
        setTestResult(prev => prev + '\n🌐 This appears to be a network/connection issue.');
      }
    }
    
    setLoading(false);
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Firestore Connection Test</h2>
      <p>This will test your Firebase/Firestore setup to identify any issues.</p>
      
      <button 
        onClick={testFirestoreConnection}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Testing...' : 'Run Firestore Test'}
      </button>
      
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '4px',
        border: '1px solid #dee2e6',
        whiteSpace: 'pre-line',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        {testResult || 'Click the button above to run the test...'}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Troubleshooting Steps:</h3>
        <ol>
          <li><strong>Check Firebase Console:</strong> Make sure Firestore Database is enabled</li>
          <li><strong>Security Rules:</strong> Ensure your rules allow read/write operations</li>
          <li><strong>Authentication:</strong> Make sure you're logged in as a teacher</li>
          <li><strong>Network:</strong> Check your internet connection</li>
        </ol>
      </div>
    </div>
  );
} 