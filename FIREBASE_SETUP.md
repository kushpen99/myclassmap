# Firebase Setup Guide - Troubleshooting "Failed to load schools"

## Step 1: Verify Firebase Project Setup

### 1.1 Check Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your "my-class-map" project
3. Verify the project is active and not suspended

### 1.2 Enable Firestore Database
1. In Firebase Console, go to **Firestore Database**
2. If you see "Create database", click it
3. Choose **Start in test mode** (for development)
4. Select a location (choose closest to your users)
5. Click **Done**

### 1.3 Enable Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** authentication
3. Click **Save**

## Step 2: Update Firestore Security Rules

### 2.1 Go to Firestore Rules
1. In Firebase Console, go to **Firestore Database**
2. Click the **Rules** tab

### 2.2 Replace Rules with This:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write schools
    match /schools/{schoolId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow anyone to read classes, but only teachers to write
    match /classes/{classId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (resource == null || resource.data.teacherId == request.auth.uid);
    }
  }
}
```

### 2.3 Publish Rules
1. Click **Publish** to save the rules

## Step 3: Test Your Setup

### 3.1 Run the Test Component
1. Start your React app: `npm start`
2. Go to `http://localhost:3000/test`
3. Click "Run Firestore Test"
4. Check the results

### 3.2 Expected Results
If everything is working, you should see:
```
Testing Firestore connection...
✅ Successfully read from schools collection
✅ Successfully wrote to schools collection
✅ Successfully read from classes collection
🎉 All Firestore tests passed!
```

## Step 4: Common Issues and Solutions

### Issue 1: "Permission denied"
**Solution**: Update Firestore security rules (see Step 2)

### Issue 2: "Network error" or "unavailable"
**Solutions**:
- Check your internet connection
- Verify Firebase project is not suspended
- Check if you're behind a firewall

### Issue 3: "Collection not found"
**Solution**: This is normal for new projects - collections are created automatically when you first add data

### Issue 4: "Invalid API key"
**Solution**: Verify your Firebase config in `src/firebase.js` matches your project

## Step 5: Verify Your Configuration

### 5.1 Check Firebase Config
Your `src/firebase.js` should look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCApjjpk7xcP7T-8uMREDHP61XGR4uWBQI",
  authDomain: "my-class-map.firebaseapp.com",
  projectId: "my-class-map",
  storageBucket: "my-class-map.firebasestorage.app",
  messagingSenderId: "1090228322362",
  appId: "1:1090228322362:web:f080205d4dacb434453503",
  measurementId: "G-V8VYYMGHN6"
};
```

### 5.2 Get Your Config from Firebase Console
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click the web app
4. Copy the config object

## Step 6: Test the Full Application

### 6.1 Register as a Teacher
1. Go to `http://localhost:3000`
2. Click "הירשם" (Signup)
3. Create a teacher account

### 6.2 Test School Creation
1. After login, you should see the dashboard
2. Click "הוסף בית ספר חדש" (Add New School)
3. Try creating a school

## Step 7: Debug Console

### 7.1 Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for any error messages
4. Check for Firebase-related errors

### 7.2 Common Console Messages
- `Firebase: Error (auth/user-not-found)`: User not authenticated
- `Firebase: Error (permission-denied)`: Security rules issue
- `Firebase: Error (unavailable)`: Network/connection issue

## Step 8: Production Considerations

### 8.1 Update Security Rules for Production
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /schools/{schoolId} {
      allow read, write: if request.auth != null && 
        (resource == null || 
         resource.data.teacherId == request.auth.uid || 
         request.auth.uid in resource.data.teachers);
    }
    match /classes/{classId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (resource == null || resource.data.teacherId == request.auth.uid);
    }
  }
}
```

### 8.2 Environment Variables
For production, use environment variables:
```javascript
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  // ... etc
};
```

## Still Having Issues?

If you're still seeing "Failed to load schools" after following these steps:

1. **Check the test page**: Go to `/test` and run the Firestore test
2. **Check browser console**: Look for specific error messages
3. **Verify authentication**: Make sure you're logged in as a teacher
4. **Check network**: Ensure you can access Firebase services
5. **Contact support**: Share the specific error message from the test page

The test component will help identify exactly what's causing the issue! 