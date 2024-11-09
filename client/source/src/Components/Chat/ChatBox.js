import React, { useState, useEffect, useRef } from "react";
import { determineAIResponder, gpt4AI, mistralAI, generateConversationImage } from "../LLM/OpenAI.js";
import { collection, setDoc, doc, getDocs, serverTimestamp, deleteDoc, getDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { FaTrash } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { MdAutoAwesome } from "react-icons/md";
import { BiImageAdd, BiRefresh } from "react-icons/bi";
import { Riple } from "react-loading-indicators"

const placeholderPfp = "https://pbs.twimg.com/media/FeToPmbWYAEZAeG.png";

const generateUniqueKey = () => {
  return Math.random().toString(36).substr(2, 9);
};

export function ChatBox({ 
  chats, 
  setChats, 
  members, 
  currentAIResponder, 
  setCurrentAIResponder, 
  pendingMessage, 
  setPendingMessage, 
  inputButtonDisabled, 
  setInputButtonDisabled, 
  db,
  chatID,
  user,
  allowAIResponse,
  imageStyle,
  setImageStyle,
  usersMember,
  setUsersMember,
  usingGPT
}) {
  const [currentChat, setCurrentChat] = useState('');
  const [directory, setDirectory] = useState("");
  const chatContainerRef = useRef(null);
  const functions = getFunctions();

  useEffect(() => {
    if (user && user.uid) {
      const newDirectory = `users/${user.uid}/chats/${chatID}/messages`;
      console.log("Setting directory:", newDirectory);
      setDirectory(newDirectory);
    }
  }, [user, chatID]);

  useEffect(() => {
    syncChatWithFirestore()
  }, [directory])

  useEffect(() => {
    if (pendingMessage) {
      setInputButtonDisabled(true);
      const uniqueKey = generateUniqueKey();
      setChats(prevChats => [...prevChats, ["text", currentAIResponder, "...", uniqueKey]]);
      console.log(chats,members,currentAIResponder)
      
      if (usingGPT) {
        gpt4AI({
          chats,
          members,
          responder: currentAIResponder,
          setChats,
          setPendingMessage
        }).then(() => {
          setCurrentAIResponder("");
          setInputButtonDisabled(false);
        });
      } else {
        mistralAI({
          chats,
          members,
          responder: currentAIResponder,
          setChats,
          setPendingMessage
        }).then(() => {
          setCurrentAIResponder("");
          setInputButtonDisabled(false);
        });
      }
      
      setCurrentChat('');
    }
  }, [pendingMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  useEffect(() => {
    setInputButtonDisabled(Object.keys(members).length < 2);
  }, [members]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const lastChat = chats[chats.length - 1];
      const scrollHeight = chatContainerRef.current.scrollHeight;
      const clientHeight = chatContainerRef.current.clientHeight;
      
      if (lastChat && lastChat[0] === "image") {
        // For images, scroll to bottom and add a small delay to ensure image is loaded
        setTimeout(() => {
          chatContainerRef.current.scrollTop = scrollHeight - clientHeight;
        }, 100);
      } else {
        // For text messages, scroll immediately
        chatContainerRef.current.scrollTop = scrollHeight - clientHeight;
      }
    }
  };

  async function fireStore() {
    if (!directory) {
      console.error("Directory not set. User might not be initialized.");
      return;
    }
    console.log("Attempting to write to Firestore. Directory:", directory);
    try {
      const latestChat = chats[chats.length - 1];
      const docRef = doc(db, directory, latestChat[3]);
      const chatData = {
        messageType: latestChat[0],
        time: serverTimestamp(),
        key: latestChat[3]
      };

      if (latestChat[0] === "text") {
        chatData.user = latestChat[1];
        chatData.chat = latestChat[2];
      } else if (latestChat[0] === "image") {
        chatData.imageUrl = latestChat[1];
        chatData.description = latestChat[2];
      }

      await setDoc(docRef, chatData);
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  useEffect(() => {
    console.log("storing chat in firebase", chats);
    if (chats.length > 0) {
      fireStore();
    }
  }, [inputButtonDisabled]);

  async function addChat() {
    if (currentChat !== "") {
      setInputButtonDisabled(true);
      const uniqueKey = generateUniqueKey();
      const tempChats = [...chats, ["text", usersMember, currentChat, uniqueKey]];
      setChats(prevChats => [...prevChats, ["text", usersMember, currentChat, uniqueKey]]);
  
      if (currentAIResponder === "") {
        let aiResponder = "";
          try {
            aiResponder = await determineAIResponder({
              chats :tempChats,
              members,
              setCurrentAIResponder,
              allowAIResponse
            });
          } catch (error) {
            console.error("Error determining AI responder:", error);
          }
        setCurrentAIResponder(aiResponder);
      }
      
      setPendingMessage(true);
    }
  }

  async function autoRespond() {
    if (!inputButtonDisabled) {
      if (currentAIResponder === "") {
        let aiResponder = "";
          try {
            aiResponder = await determineAIResponder({
              chats,
              members,
              setCurrentAIResponder,
              allowAIResponse,
              usersMember
            });
          } catch (error) {
            console.error("Error determining AI responder:", error);
          }
        setCurrentAIResponder(aiResponder);
      }
      setInputButtonDisabled(true);
      setPendingMessage(true);
    }
  };

  function chatInputClickedEvent() {
    currentChat === "" ? autoRespond() : addChat();
  }

  async function syncChatWithFirestore() {
    if (!directory || !db) {
      console.error("Cannot update from Firestore: directory or db is not initialized");
      return;
    }
  
    try {
      const chatCollectionRef = collection(db, directory);
      const querySnapshot = await getDocs(chatCollectionRef);
  
      const updatedChats = [];
      querySnapshot.forEach((doc) => {
        const messageData = doc.data();
        if (messageData.messageType === "text") {
          updatedChats.push([
            messageData.messageType,
            messageData.user,
            messageData.chat || "",
            messageData.key,
            messageData.time
          ]);
        } else if (messageData.messageType === "image") {
          updatedChats.push([
            messageData.messageType,
            messageData.imageUrl || "",
            messageData.description || "",
            messageData.key,
            messageData.time
          ]);
        }
      });
  
      updatedChats.sort((a, b) => a[4].seconds - b[4].seconds);
  
      setChats(updatedChats);
      console.log("Chat updated from Firestore successfully");
      console.log(updatedChats)
    } catch (error) {
      console.error("Error updating chat from Firestore:", error);
    }
  }

  const deleteChat = async (key) => {
    if (!directory) {
      console.error("Directory not set. User might not be initialized.");
      return;
    }

    try {
      const docRef = doc(db, directory, key);
      await deleteDoc(docRef);
      
      setChats(prevChats => prevChats.filter(chat => chat[3] !== key));
      
      console.log("Chat deleted successfully", key);
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const renderFormattedText = (text) => {
    const parts = text.split(/(\*.*?\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return <strong className="Action-text"><em key={index}>{part.slice(1, -1)}</em></strong>;
      }
      return part;
    });
  };

  const handleImageGeneration = async () => {
    let currentImageStyle = "";
    try {
      setInputButtonDisabled(true);
      
      if (directory && chatID) {
        const docRef = doc(db, `users/${user.uid}/chats`, chatID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().imageStyle) {
          currentImageStyle = docSnap.data().imageStyle;
        }
      }

      console.log("Style:", currentImageStyle);
      const imageData = await generateConversationImage({ chats, members, style: currentImageStyle });
      console.log("Generated image URL:", imageData.imageUrl);
      console.log("Generated image description:", imageData.description);

      // Save the image to Firebase Storage
      const saveConversationImage = httpsCallable(functions, 'saveConversationImage');
      const result = await saveConversationImage({
        imageUrl: imageData.imageUrl,
        chatID: chatID,
        description: imageData.description
      });

      if (result.data.success) {
        const uniqueKey = generateUniqueKey();
        setChats(prevChats => [...prevChats, ["image", result.data.url, imageData.description, uniqueKey]]);
        scrollToBottom();
      } else {
        throw new Error(result.data.error);
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setInputButtonDisabled(Object.keys(members).length < 2);
    }
  };

  const handleImageRefresh = async (key) => {
    let currentImageStyle = "";
    try {
      setInputButtonDisabled(true);

      if (directory && chatID) {
        const docRef = doc(db, `users/${user.uid}/chats`, chatID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().imageStyle) {
          currentImageStyle = docSnap.data().imageStyle;
        }
      }

      console.log("Style for refresh:", currentImageStyle);
      const imageData = await generateConversationImage({ chats, members, style: currentImageStyle });
      
      // Save the refreshed image to Firebase Storage
      const saveConversationImage = httpsCallable(functions, 'saveConversationImage');
      const result = await saveConversationImage({
        imageUrl: imageData.imageUrl,
        chatID: chatID,
        description: imageData.description
      });

      if (result.data.success) {
        setChats(prevChats => prevChats.map(chat => 
          chat[3] === key ? ["image", result.data.url, imageData.description, key] : chat
        ));
        
        // Update Firestore
        const docRef = doc(db, directory, key);
        await setDoc(docRef, {
          messageType: "image",
          imageUrl: result.data.url,
          description: imageData.description,
          time: serverTimestamp(),
          key: key
        });
      } else {
        throw new Error(result.data.error);
      }
    } catch (error) {
      console.error("Error refreshing image:", error);
    } finally {
      setInputButtonDisabled(false);
    }
  };

  return (
    <div className="ChatBox">
      <div className="Chats" ref={chatContainerRef}>
        {chats.length === 0 ? (
          <>
          <div className="Chat">
            <div className="ChatHeader">
              <h1 className="ChatName">System</h1>
            </div>
            <div className="ChatContent">
              <p>Chat with whoever you can imagine!</p>
            </div>
            <h1> </h1>
            <div className="ChatContent">
              <p>Double click on a member to have them respond automatically</p>
            </div>
            <h1> </h1>
            <div className="ChatContent">
              <p>Generate an image for your conversation by clicking the image icon</p>
            </div>
          </div>
          </>
          
        ) : (
          chats.map((chat, index) => (
            <div className="Chat" key={chat[3]}>
              {chat[0] === "text" ? (
                <>
                  <div className="ChatHeader">
                    <div className="ChatAvatar">
                      <img 
                        src={members && members[chat[1]] ? (members[chat[1]][2] || placeholderPfp) : placeholderPfp} 
                        alt={members && members[chat[1]] ? members[chat[1]][0] : "Loading..."}
                      />
                    </div>
                    <h1 className="ChatName">
                      {members && members[chat[1]] ? members[chat[1]][0] : "Loading..."}
                    </h1>
                  </div>
                  <div className="ChatContent">
                    <p>{renderFormattedText(chat[2])}</p>
                    {!inputButtonDisabled && (
                      <>
                        <button className="DeleteButton" onClick={() => deleteChat(chat[3])}>
                          <FaTrash/>
                        </button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="ImageContent">
                  <img src={chat[1]} alt={chat[2]} title={chat[2]} />
                  {!inputButtonDisabled && (
                    <>
                      <button className="DeleteButton" onClick={() => deleteChat(chat[3])}>
                        <FaTrash/>
                      </button>
                      {index === chats.length - 1 && (
                        <button className="RefreshButton" onClick={() => handleImageRefresh(chat[3])}>
                          <BiRefresh/>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <div className="InputArea">
        <textarea
          className="ChatInput"
          placeholder={
            Object.keys(members).length < 2
              ? "Add two members to start a conversation!"
              : currentAIResponder === "" 
                ? "The AI will determine who responds" 
                : (members && members[currentAIResponder] 
                    ? `${members[currentAIResponder][0]} will respond`
                    : "Loading...")
          }
          value={currentChat}
          onChange={(e) => setCurrentChat(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !inputButtonDisabled) {
              e.preventDefault();
              chatInputClickedEvent();
            }
          }}
        />
        <button
          className={inputButtonDisabled ? "ChatInputButtonDisabled" : "ChatInputButton"}
          onClick={handleImageGeneration}
          disabled={inputButtonDisabled}
        >
          <BiImageAdd className="SendIcon" />
        </button>
        <button
          className={inputButtonDisabled ? "ChatInputButtonDisabled" : "ChatInputButton"}
          onClick={chatInputClickedEvent}
          disabled={inputButtonDisabled}
        >
          <MdAutoAwesome className="SendIcon"/>
        </button>
      </div>
    </div>
  );
}

export default ChatBox;