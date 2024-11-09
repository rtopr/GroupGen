import React, { useRef, useEffect } from 'react';
import "../App.css"
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const CardComponent = ({ chatID, type, title, memberCount, avatars, setChatNames, db, user }) => {
  const navigate = useNavigate();
  const addComponentRef = useRef(null);

  useEffect(() => {
    const addComponent = addComponentRef.current;
    if (type === 'add' && addComponent) {
      const updateCursorPosition = (e) => {
        const rect = addComponent.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        addComponent.style.setProperty('--x', `${x}px`);
        addComponent.style.setProperty('--y', `${y}px`);
      };

      addComponent.addEventListener('mousemove', updateCursorPosition);
      return () => {
        addComponent.removeEventListener('mousemove', updateCursorPosition);
      };
    }
  }, [type]);

  const createNewChat = async () => {
    const newChatID = uuidv4();
    const newChatName = "New Chat";
    console.log("New chat clicked");
    try {
      const userInfoRef = doc(db, `users/${user.uid}/userInfo`, 'info');
      const userInfoSnap = await getDoc(userInfoRef);
      let defaultMemberId = null;
      if (userInfoSnap.exists()) {
        const userInfo = userInfoSnap.data();
        defaultMemberId = userInfo.defaultMemberId;
      }

      const chatRef = doc(db, `users/${user.uid}/chats`, newChatID);
      await setDoc(chatRef, {
        chatName: newChatName,
        createdAt: new Date(),
        user: defaultMemberId,
        lastOpened: new Date()
      });

      if (defaultMemberId) {
        const membersRef = doc(db, `users/${user.uid}/chats/${newChatID}/members`, defaultMemberId);
        await setDoc(membersRef, {});
      }

      setChatNames(prevChatNames => ({
        ...prevChatNames,
        [newChatID]: newChatName
      }));

      navigate(`/chat/${newChatID}`);
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  async function chatClicked(chatID) {
    try {
      const chatRef = doc(db, `users/${user.uid}/chats`, chatID);
      await updateDoc(chatRef, {
        lastOpened: new Date()
      });
      navigate(`/chat/${chatID}`);
    } catch (error) {
      console.error("Error updating lastOpened:", error);
      navigate(`/chat/${chatID}`);
    }
  }

  if (type === 'add') {
    return (
      <div className={`component ${type}`} onClick={createNewChat} ref={addComponentRef}>
        <div className="add-icon">+</div>
      </div>
    )
  } else {
    return (
      <div className={`component ${type}`} onClick={() => chatClicked(chatID)}>
        <div className="title">{title}</div>
        <div className="footer">
          <div className="avatars">
            {avatars.slice(0, 3).map((avatar, index) => (
              <div
                key={index}
                className="avatar"
                style={{backgroundImage: `url(${avatar})`}}
              />
            ))}
          </div>
          {typeof memberCount === 'number' && (
            <div className="members">
              <span className="member-count">{memberCount}</span>
              <span>{memberCount < 2 ? 'Member' : 'Members'}</span>
            </div>
          )}
        </div>
      </div>
    )
  }
};

export default CardComponent;