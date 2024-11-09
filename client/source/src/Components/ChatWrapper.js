import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { Chat } from '../Pages/Chat';
import NavBar from './NavBar';

export function ChatWrapper({ firebaseApp, auth, db, user, chatNames, setChatNames }) {
  const { chatID } = useParams();
  const navigate = useNavigate();
  const [isValidChat, setIsValidChat] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("ChatWrapper - Firestore instance:", db);
    console.log("ChatWrapper - Is db a Firestore instance?", db && db.type === 'firestore');
  }, [db]);

  useEffect(() => {
    if (db && user && chatID) {
      const checkChatValidity = async () => {
        try {
          console.log("Checking chat validity with db:", db);
          const chatRef = doc(db, `users/${user.uid}/chats`, chatID);
          const chatDoc = await getDoc(chatRef);
          if (chatDoc.exists()) {
            setIsValidChat(true);
          } else {
            setError("Chat does not exist");
            navigate('/');
          }
        } catch (error) {
          console.error("Error checking chat validity:", error);
          setError(`Error: ${error.message}`);
        }
      };

      checkChatValidity();
    }
  }, [db, user, chatID, navigate]);

  if (!user) {
    return(
      <div className="App">
        <NavBar></NavBar>
        <div>Please sign in to access the chat.</div>;
      </div>
      )
  }

  if (error) {
    return(
      <div className="App">
        <NavBar></NavBar>
        <div>Error: {error}</div>
      </div>
      )
  }

  if (!isValidChat) {
    return(
    <div className="App">
      <NavBar></NavBar>
      <div>Validating chat... Please wait.</div>
    </div>
    )
  }

  return (
    <Chat
      firebaseApp={firebaseApp}
      auth={auth}
      db={db}
      user={user}
      chatID={chatID}
      chatNames={chatNames}
      setChatNames={setChatNames}
    />
  );
}