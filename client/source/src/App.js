import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';
import { Home } from "./Pages/home";
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { useAuthState } from 'react-firebase-hooks/auth';
import { ChatWrapper } from './Components/ChatWrapper';
import { RiH1 } from 'react-icons/ri';
import { MembersPage } from './Pages/membersPage';
import { SettingsPage } from './Pages/SettingsPage';
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

function App() {
  const [chatID, setChatID] = useState("0");
  const [user, loading, error] = useAuthState(auth);
  const [chatNames, setChatNames] = useState({});
  const [chatMembers, setChatMembers] = useState({});

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home db={db} 
              user={user} 
              setChatID={setChatID} 
              chatID={chatID} 
              firebaseApp={firebaseApp} 
              auth={auth} 
              chatNames={chatNames} 
              setChatNames={setChatNames}
              chatMembers={chatMembers}
              setChatMembers={setChatMembers}/>} />
        <Route
          path="/chat/:chatID"
          element={
            <ChatWrapper
              firebaseApp={firebaseApp}
              auth={auth}
              db={db}
              user={user}
              chatNames={chatNames}
              setChatNames={setChatNames}
            />
          }
        />
        <Route
          path="/members"
         element={ <MembersPage db = {db} user = {user}/>}
        />
        <Route path="/settings" element={<SettingsPage/>}/>
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </Router>
  );
}

export default App;