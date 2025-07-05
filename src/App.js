import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import TeacherDashboard from './components/TeacherDashboard';
import TeacherMap from './components/TeacherMap';
import StudentJoin from './components/StudentJoin';
import StudentMap from './components/StudentMap';
import HomePage from './components/HomePage';
import FirestoreTest from './components/FirestoreTest';

// Protected Route component
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

// Main App component
function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/join" element={<StudentJoin />} />
        <Route path="/test" element={<FirestoreTest />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/class/:classId" 
          element={
            <ProtectedRoute>
              <TeacherMap />
            </ProtectedRoute>
          } 
        />
        <Route path="/student-map/:classId" element={<StudentMap />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
