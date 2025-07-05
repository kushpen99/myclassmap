# MyClassMap - Multi-Class Interactive Map Application

A React-based web application that allows teachers to create interactive class maps where students can add their locations. Built with Firebase authentication and Firestore database.

## Features

### Teacher Mode
- **Authentication**: Secure email/password registration and login
- **Global School Management**: Create new schools or connect to existing schools globally
- **Smart School Search**: Autocomplete suggestions from all schools in the system
- **Class Management**: Create new classes with unique class codes, associated with schools
- **Dashboard**: View all created classes with school information and student counts
- **Map Viewing**: Real-time view of student locations centered around school location
- **Student List**: View all students in each class

### Student Mode
- **Easy Join**: Join classes using class codes
- **Location Sharing**: Add personal location with address autocomplete
- **Custom Markers**: Choose from different colored markers
- **Real-time Updates**: See other students' locations in real-time

### Future Features Enabled
- **Cross-Class Collaboration**: Teachers can see classes from the same school
- **School-Wide Analytics**: Aggregate data across all classes in a school
- **Shared Resources**: Common school information and settings
- **Teacher Networking**: Connect with other teachers at the same school

## Technology Stack

- **Frontend**: React 19, React Router DOM
- **Maps**: Leaflet with React-Leaflet
- **Authentication**: Firebase Authentication
- **Database**: Firestore (Firebase)
- **Geocoding**: Nominatim (OpenStreetMap) + Geoapify
- **Styling**: CSS with modern design

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password authentication
4. Enable Firestore Database:
   - Go to Firestore Database
   - Create database in test mode (for development)
5. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click the web icon (</>) to add a web app
   - Copy the firebaseConfig object

### 2. Update Firebase Configuration

Open `src/firebase.js` and replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm start
```

The application will open at `http://localhost:3000`

## Usage Guide

### For Teachers

1. **Registration/Login**:
   - Visit the homepage and click "התחבר" (Login) or "הירשם" (Signup)
   - Create an account with email and password
   - Add your full name during registration

2. **Managing Schools**:
   - After login, you'll see the teacher dashboard
   - Click "הוסף בית ספר חדש" (Add New School) to create or connect to a school
   - Start typing a school name to see suggestions from existing schools globally
   - Select an existing school to connect to it, or create a new one
   - Enter school address (with autocomplete) for new schools
   - Schools are automatically geocoded for map centering

3. **Creating Classes**:
   - Select a school from your schools list (or create a new one)
   - Enter a class name and click "צור כיתה" (Create Class)
   - A unique 6-character class code will be generated
   - The class will be associated with the selected school

4. **Sharing with Students**:
   - Copy the class code using the "העתק קוד" (Copy Code) button
   - Share the code with your students
   - Students can join using the code at `/join`

5. **Viewing Class Maps**:
   - Click "צפה במפה" (View Map) to see the class map
   - Map is centered around the school location
   - View real-time student locations
   - See a list of all students below the map

### For Students

1. **Joining a Class**:
   - Visit the homepage and click "הצטרף לכיתה" (Join Class)
   - Enter the class code provided by your teacher
   - Click "הצטרף לכיתה" (Join Class)

2. **Adding Your Location**:
   - Enter your name
   - Type your address (autocomplete suggestions will appear)
   - Choose a colored marker
   - Click "הוסף כתובת" (Add Address)

3. **Viewing the Map**:
   - See your location and other students' locations
   - Real-time updates when new students join

## Database Structure

### Collections

#### `schools`
```javascript
{
  id: "auto-generated",
  name: "school name", // lowercase for search
  displayName: "School Name", // original case for display
  address: "School Address",
  lat: 32.4740,
  lon: 34.9818,
  teacherId: "creator_uid", // original creator
  teachers: ["uid1", "uid2"], // all teachers using this school
  createdAt: timestamp
}
```

#### `classes`
```javascript
{
  id: "auto-generated",
  name: "Class Name",
  code: "ABC123",
  teacherId: "user_uid",
  teacherName: "Teacher Name",
  schoolId: "school_id",
  schoolName: "School Name",
  schoolAddress: "School Address",
  schoolLat: 32.4740,
  schoolLon: 34.9818,
  createdAt: timestamp,
  students: [
    {
      name: "Student Name",
      address: "Student Address",
      lat: 32.4740,
      lon: 34.9818,
      iconIdx: 0,
      addedAt: timestamp
    }
  ]
}
```

## Security Rules

For production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /schools/{schoolId} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.teacherId == request.auth.uid);
    }
    match /classes/{classId} {
      allow read: if true; // Anyone can read class data
      allow write: if request.auth != null && 
        (resource == null || resource.data.teacherId == request.auth.uid);
    }
  }
}
```

## Deployment

### Deploy to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project:
```bash
firebase init hosting
```

4. Build the project:
```bash
npm run build
```

5. Deploy:
```bash
firebase deploy
```

## Environment Variables

For production, consider using environment variables for API keys:

Create a `.env` file:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_GEOAPIFY_API_KEY=your_geoapify_key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team. 