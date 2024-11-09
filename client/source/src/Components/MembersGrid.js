import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { RiAiGenerate } from "react-icons/ri";
import { BiLoader } from "react-icons/bi";
import { FaTrash } from "react-icons/fa";
import { v4 as uuidv4 } from 'uuid';
import { generateProfilePicture } from './LLM/OpenAI';
const placeholderPfp = "https://pbs.twimg.com/media/FeToPmbWYAEZAeG.png";


const MemberCard = ({ member, onEdit }) => {
  return (
    <div className="member-card" onClick={() => onEdit(member.id)}>
      {console.log(member.avatarUrl)}
      <img
        src={member.avatarUrl ? member.avatarUrl: placeholderPfp}
        alt={`${member.name}'s profile`}
        className="member-card-image"
        key={member.avatarUrl}
      />
      <span className="member-card-name">{member.name}</span>
    </div>
  );
};

const AddMemberCard = ({ onAdd }) => {
  return (
    <div className="member-card" onClick={onAdd}>
      <div className="member-card-image add-member-button">
        <span className="plus-icon">+</span>
      </div>
      <span className="member-card-name">Add Member</span>
    </div>
  );
};

const MemberEditForm = ({ member, onSave, onCancel, onDelete, generateMemberProfilePicture, db, user }) => {
  const [name, setName] = useState(member.name);
  const [personality, setPersonality] = useState(member.personality);
  const [avatarUrl, setAvatarUrl] = useState(member.avatarUrl);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [usersDefaultMember, setUsersDefaultMember] = useState(false);
  const [chatCount, setChatCount] = useState(-1);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user || !user.uid || !db) {
        console.log("User, user ID, or database not initialized.");
        return;
      }

      try {
        const userInfoRef = doc(db, `users/${user.uid}/userInfo`, 'info');
        const userInfoSnap = await getDoc(userInfoRef);
        if (userInfoSnap.exists()) {
          const userInfo = userInfoSnap.data();
          setUsersDefaultMember(userInfo.defaultMemberId === member.id);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();

    const fetchChatCount = async () => {
      if (!user || !user.uid || !db) {
        console.log("User, user ID, or database not initialized. Skipping chat count fetch.");
        return;
      }
  
      try {
        const userChatsRef = collection(db, `users/${user.uid}/chats`);
        const querySnapshot = await getDocs(userChatsRef);
        let count = 0;
        
        for (const chatDoc of querySnapshot.docs) {
          const membersRef = collection(chatDoc.ref, 'members');
          const memberDoc = await getDoc(doc(membersRef, member.id));
          if (memberDoc.exists()) {
            count++;
          }
        }
        setChatCount(count);
      } catch (error) {
        console.error("Error fetching chat count:", error);
      }
    };
  
    fetchChatCount();
  }, [db, user, member]);

  const handleUsersDefaultMemberChange = async (isDefault) => {
    if (!user || !user.uid || !db) {
      console.log("User, user ID, or database not initialized.");
      return;
    }

    try {
      const userInfoRef = doc(db, `users/${user.uid}/userInfo`, 'info');
      await setDoc(userInfoRef, {
        defaultMemberId: isDefault ? member.id : null
      }, { merge: true });
      setUsersDefaultMember(isDefault);
    } catch (error) {
      console.error("Error updating user's default member:", error);
    }
  };

  const handleGenerateProfilePicture = async () => {
    setImageGenerating(true);
    try {
      await generateMemberProfilePicture(member.id);
      const updatedMember = await getDoc(doc(db, 'members', member.id));
      if (updatedMember.exists()) {
        setAvatarUrl(updatedMember.data().avatarUrl);
      }
    } catch (error) {
      console.error("Error generating profile picture:", error);
    }
    setImageGenerating(false);
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handlePersonalityChange = (e) => {
    setPersonality(e.target.value);
  };

  const handleFinishEditing = () => {
    onSave({
      ...member,
      name,
      personality,
      avatarUrl
    });
  };

  return (
    <div className="MemberBeingEdited" key={member.id}>
      <div className="MemberHeader">
        <div className="MemberAvatarEdited">
        <img 
            src={avatarUrl || placeholderPfp} 
            alt="Member being edited" 
            key={avatarUrl}
          />
        </div>
        {member.id === "0" ? "" : 
          imageGenerating ? 
            <BiLoader className="Icon"/> :
            <RiAiGenerate className="Icon" onClick={handleGenerateProfilePicture}/>
        }
      </div>
      <div className="AIToggle">
        <input
          type="checkbox"
          checked={usersDefaultMember}
          onChange={(e) => handleUsersDefaultMemberChange(e.target.checked)}
        />
        <h3>{usersDefaultMember ? "Set as user when creating new chat" : "Set as user when creating new chat"}</h3>
      </div>
      <h3>Name</h3>
      <textarea
        placeholder="Enter name here"
        className="NameInput"
        onChange={handleNameChange}
        value={name}
      />
      <h3>Personality</h3>
      <textarea
        placeholder="Enter personality here"
        className="PersonalityInput"
        onChange={handlePersonalityChange}
        value={personality}
      />
      
      

      {member.id !== "0" && chatCount === 0 && !usersDefaultMember && (
        <button
          className="DeleteButtonMembers"
          onClick={() => onDelete(member.id)}
        >
          <FaTrash />
        </button>
      )}
      <button className="DoneButton" onClick={handleFinishEditing}>Done</button>
    </div>
  );
};

export function MemberGrid({ db, user }) {
  const [members, setMembers] = useState({});
  const [editingMemberId, setEditingMemberId] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, [db, user]);

  const fetchMembers = async () => {
    if (!user || !user.uid) return;

    try {
      const userMembersRef = collection(db, `users/${user.uid}/members`);
      const userMembersSnapshot = await getDocs(userMembersRef);
      const memberIds = userMembersSnapshot.docs.map(doc => doc.id);

      const memberPromises = memberIds.map(async (memberId) => {
        const memberRef = doc(db, 'members', memberId);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
          return { id: memberId, ...memberSnap.data() };
        } else {
          console.log(`Member with ID ${memberId} not found in global members collection`);
          return null;
        }
      });

      const membersData = await Promise.all(memberPromises);

      const newMembers = {};
      membersData.forEach((member) => {
        if (member) {
          newMembers[member.id] = {
            ...member,
            avatarUrl: member.avatarUrl === placeholderPfp
              ? placeholderPfp
              : `${member.avatarUrl}?t=${member.lastUpdated || Date.now()}`
          };
        }
      });

      setMembers(newMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const handleEditMember = (memberId) => {
    setEditingMemberId(memberId);
  };

  const handleSaveMember = async (updatedMember) => {
    console.log("saving member", updatedMember);
    try {
      const now = Date.now();
      const memberRef = doc(db, 'members', updatedMember.id);
      await updateDoc(memberRef, {
        name: updatedMember.name,
        personality: updatedMember.personality,
        avatarUrl: updatedMember.avatarUrl,
        lastUpdated: now
      });

      setMembers(prevMembers => ({
        ...prevMembers,
        [updatedMember.id]: {
          ...updatedMember,
          avatarUrl: updatedMember.avatarUrl === placeholderPfp
            ? placeholderPfp
            : `${updatedMember.avatarUrl.split('?')[0]}?t=${now}`
        }
      }));
    } catch (error) {
      console.error("Error updating member:", error);
    }
  };

  const handleDeleteMember = async (memberId) => {
    try {
      await deleteDoc(doc(db, 'members', memberId));
      await deleteDoc(doc(db, `users/${user.uid}/members`, memberId));

      setMembers(prevMembers => {
        const newMembers = { ...prevMembers };
        delete newMembers[memberId];
        return newMembers;
      });

      setEditingMemberId(null);
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  const generateMemberProfilePicture = async (memberId) => {
    try {
      const tempImageUrl = await generateProfilePicture({
        name: members[memberId].name,
        personality: members[memberId].personality
      });

      const functions = getFunctions();
      const saveProfilePicture = httpsCallable(functions, 'saveProfilePicture');
      const result = await saveProfilePicture({ 
        memberID: memberId, 
        imageUrl: tempImageUrl 
      });

      if (result.data.success) {
        const updatedMember = {
          ...members[memberId],
          avatarUrl: result.data.url
        };
        //known glitch where profile picture is not saved properly if done isnt clicked
        handleSaveMember(updatedMember);
      } else {
        throw new Error(result.data.error || "Failed to save profile picture");
      }
    } catch (error) {
      console.error("Error generating or saving profile picture:", error);
    }
  };
  const handleAddMember = async () => {
    const newMemberId = uuidv4();
    const newMember = {
      id: newMemberId,
      name: "",
      personality: "",
      avatarUrl: placeholderPfp
    };

    try {
      // Add to global members collection
      const globalMemberRef = doc(db, 'members', newMemberId);
      await setDoc(globalMemberRef, newMember);

      // Add to user's members collection
      const userMemberRef = doc(db, `users/${user.uid}/members`, newMemberId);
      await setDoc(userMemberRef, {});

      setMembers(prevMembers => ({
        ...prevMembers,
        [newMemberId]: newMember
      }));

      console.log(`Added new member with ID ${newMemberId}`);
      setEditingMemberId(newMemberId);
    } catch (error) {
      console.error("Error adding new member:", error);
    }
  };

  if (editingMemberId) {
    const editingMember = members[editingMemberId];
    return (
      <div className="home-page">
      <div className="home-content">
      
      <MemberEditForm
        member={editingMember}
        onSave={(updatedMember) => {
          handleSaveMember(updatedMember);
          setEditingMemberId(null);
        }}
        onCancel={() => setEditingMemberId(null)}
        onDelete={handleDeleteMember}
        generateMemberProfilePicture={generateMemberProfilePicture}
        user={user}
        db={db}
      />
      </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-content">
        <div className="home-grid">
          {Object.values(members).map((member) => (
            
            <MemberCard
              key={member.id}
              member={member}
              onEdit={handleEditMember}
            />
          ))}
          <AddMemberCard onAdd={handleAddMember} />
        </div>
      </div>
    </div>
  );
}
