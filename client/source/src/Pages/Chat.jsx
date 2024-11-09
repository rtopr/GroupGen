import React, { useEffect, useState } from 'react';
import Members from '../Components/Chat/Members';
import ChatBox from '../Components/Chat/ChatBox';
import NavBar from '../Components/NavBar';
import { useMediaQuery } from 'react-responsive';

const placeholderPfp = "https://pbs.twimg.com/media/FeToPmbWYAEZAeG.png";

export function Chat({ firebaseApp, auth, db, user, chatID, chatNames, setChatNames }) {
  const [chats, setChats] = useState([]);
  const [members, setMembers] = useState({});
  const [currentAIResponder, setCurrentAIResponder] = useState("");
  const [pendingMessage, setPendingMessage] = useState(false);
  const [inputButtonDisabled, setInputButtonDisabled] = useState(false);
  const [allowAIResponse, setAllowAIResponse] = useState(false);
  const [usingLlama, setUsingLlama] = useState(false);
  const [imageStyle, setImageStyle] = useState("");
  const [usersMember, setUsersMember] = useState(null);
  const [usingGPT, setUsingGPT] = useState(false);
  const [showMembers, setShowMembers] = useState(true);

  const isMobile = useMediaQuery({ maxWidth: 768 });

  useEffect(() => {
    console.log("Chat - Firestore instance:", db);
    console.log("Chat - Is db a Firestore instance?", db && db.type === 'firestore');
  }, [db]);

  if (!user) {
    return <div>Please sign in to access the chat.</div>;
  }

  const renderContent = () => {
    if (isMobile) {
      return showMembers ? (
        <Members
          db={db}
          chatID={chatID}
          user={user}
          chatNames={chatNames}
          setChatNames={setChatNames}
          members={members}
          setMembers={setMembers}
          currentAIResponder={currentAIResponder}
          setCurrentAIResponder={setCurrentAIResponder}
          inputButtonDisabled={inputButtonDisabled}
          setInputButtonDisabled={setInputButtonDisabled}
          setPendingMessage={setPendingMessage}
          chats={chats}
          allowAIResponse={allowAIResponse}
          setAllowAIResponse={setAllowAIResponse}
          usingLlama={usingLlama}
          setUsingLlama={setUsingLlama}
          imageStyle={imageStyle}
          setImageStyle={setImageStyle}
          usersMember={usersMember}
          setUsersMember={setUsersMember}
          usingGPT={usingGPT}
          setUsingGPT={setUsingGPT}
        />
      ) : (
        <ChatBox
          chats={chats}
          setChats={setChats}
          members={members}
          currentAIResponder={currentAIResponder}
          setCurrentAIResponder={setCurrentAIResponder}
          pendingMessage={pendingMessage}
          setPendingMessage={setPendingMessage}
          inputButtonDisabled={inputButtonDisabled}
          setInputButtonDisabled={setInputButtonDisabled}
          db={db}
          chatID={chatID}
          user={user}
          allowAIResponse={allowAIResponse}
          setAllowAIResponse={setAllowAIResponse}
          usingLlama={usingLlama}
          imageStyle={imageStyle}
          setImageStyle={setImageStyle}
          usersMember={usersMember}
          setUsersMember={setUsersMember}
          usingGPT={usingGPT}
        />
      );
    } else {
      return (
        <div className="FlexBox">
          <Members
            db={db}
            chatID={chatID}
            user={user}
            chatNames={chatNames}
            setChatNames={setChatNames}
            members={members}
            setMembers={setMembers}
            currentAIResponder={currentAIResponder}
            setCurrentAIResponder={setCurrentAIResponder}
            inputButtonDisabled={inputButtonDisabled}
            setInputButtonDisabled={setInputButtonDisabled}
            setPendingMessage={setPendingMessage}
            chats={chats}
            allowAIResponse={allowAIResponse}
            setAllowAIResponse={setAllowAIResponse}
            usingLlama={usingLlama}
            setUsingLlama={setUsingLlama}
            imageStyle={imageStyle}
            setImageStyle={setImageStyle}
            usersMember={usersMember}
            setUsersMember={setUsersMember}
            usingGPT={usingGPT}
            setUsingGPT={setUsingGPT}
          />
          <ChatBox
            chats={chats}
            setChats={setChats}
            members={members}
            currentAIResponder={currentAIResponder}
            setCurrentAIResponder={setCurrentAIResponder}
            pendingMessage={pendingMessage}
            setPendingMessage={setPendingMessage}
            inputButtonDisabled={inputButtonDisabled}
            setInputButtonDisabled={setInputButtonDisabled}
            db={db}
            chatID={chatID}
            user={user}
            allowAIResponse={allowAIResponse}
            setAllowAIResponse={setAllowAIResponse}
            usingLlama={usingLlama}
            imageStyle={imageStyle}
            setImageStyle={setImageStyle}
            usersMember={usersMember}
            setUsersMember={setUsersMember}
            usingGPT={usingGPT}
          />
        </div>
      );
    }
  };

  return (
    <div className="App">
      <NavBar showMembers={showMembers} setShowMembers={setShowMembers} />
      {renderContent()}
    </div>
  );
}