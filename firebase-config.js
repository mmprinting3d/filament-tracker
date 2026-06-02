/* ========================================
   FIREBASE CONFIGURATION
   ======================================== */

/**
 * Firebase Configuration
 * 
 * Replace the firebaseConfig object below with your Firebase project credentials.
 * Get these values from your Firebase Console:
 * 1. Go to https://console.firebase.google.com/
 * 2. Select your project
 * 3. Click "Project Settings" (gear icon)
 * 4. Under "General" tab, find "Your apps" section
 * 5. Select the web app and copy the config
 * 
 * Setup Instructions:
 * ==================
 * 
 * 1. Create Firebase Project:
 *    - Go to https://console.firebase.google.com/
 *    - Click "Create Project"
 *    - Name it "Filament Tracker"
 *    - Accept the terms and create
 * 
 * 2. Enable Firestore:
 *    - In Firebase Console, go to "Firestore Database"
 *    - Click "Create database"
 *    - Start in "Production mode"
 *    - Choose a region (recommended: us-central1)
 *    - Click "Create"
 * 
 * 3. Update Security Rules:
 *    - Go to "Firestore Database" > "Rules"
 *    - Replace the rules with:
 *
 *    rules_version = '2';
 *    service cloud.firestore {
 *      match /databases/{database}/documents {
 *        match /spools/{document=**} {
 *          allow read, write: if true;
 *        }
 *      }
 *    }
 *
 *    WARNING: These rules allow anyone to read and write. 
 *    For production, add authentication!
 * 
 * 4. Create Web App:
 *    - In Firebase Console, click the Web icon (</>)
 *    - Register the app as "Filament Tracker Web"
 *    - Copy the firebaseConfig object
 *    - Paste it below, replacing the placeholder values
 * 
 * 5. Create Firestore Collection:
 *    - No need to manually create collection
 *    - First document added will auto-create it
 * 
 * Firebase Console: https://console.firebase.google.com/
 */

// Replace this with your Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_AUTH_DOMAIN_HERE",
    projectId: "YOUR_PROJECT_ID_HERE",
    storageBucket: "YOUR_STORAGE_BUCKET_HERE",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
    appId: "YOUR_APP_ID_HERE",
    measurementId: "YOUR_MEASUREMENT_ID_HERE" // Optional
};

/**
 * Initialize Firebase
 */
try {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
    
    // Optional: Enable offline persistence for better UX
    // Uncomment the line below to enable offline support
    // db.enablePersistence().catch((err) => {
    //     if (err.code === 'failed-precondition') {
    //         console.log('Multiple windows open - offline persistence disabled');
    //     } else if (err.code === 'unimplemented') {
    //         console.log('Browser doesn\'t support offline persistence');
    //     }
    // });
    
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    alert('⚠️ Firebase is not configured. Please check the firebase-config.js file and add your Firebase credentials.');
}