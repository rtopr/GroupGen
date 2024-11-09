import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { IoMdSettings, IoMdArrowBack } from "react-icons/io";
import { LuSettings2 } from "react-icons/lu";
import { FaTrash } from "react-icons/fa";
import {
  BiSolidMessageSquareDetail,
  BiSolidMessageSquareAdd,
  BiSolidMessageSquareDots,
} from "react-icons/bi";
import { MdAutoAwesome } from "react-icons/md";
import { determineAIResponder, generateChatName, generateProfilePicture } from "../LLM/OpenAI";
import { RiAiGenerate } from "react-icons/ri";
import { BiLoader } from "react-icons/bi";
import { TbPencilStar } from "react-icons/tb";
import { Riple } from "react-loading-indicators"

const placeholderPfp = "https://pbs.twimg.com/media/FeToPmbWYAEZAeG.png";

const MemberCard = ({ name, avatarUrl, onClick }) => {
  return (
    <div className="Member" onClick={onClick}>
      <div className="MemberAvatar">
        <img src={avatarUrl || placeholderPfp} alt={`${name}'s profile`} />
      </div>
      <h1>{name}</h1>
    </div>
  );
};

const AddMemberCard = ({ onClick }) => {
  return (
    <div className="CreateMember" onClick={onClick}>
      <h1>+ Create New Member</h1>
    </div>
  );
};

const MemberSelectionView = ({ allMembers, onSelect, onAddNew, onBack, loadingAllMembers }) => {
  return (
    <div className="Members">
      <div className="Title">
        <IoMdArrowBack className="Icon" onClick={onBack} />
        
      </div>
      <AddMemberCard onClick={onAddNew} />
      {loadingAllMembers ? (
        <div className="MembersLoading">
          <Riple color="white" size="small" text="" textColor="#ffffff" />
        </div>
      ) : (
        Object.entries(allMembers).map(([id, [name, , avatarUrl]]) => (
          <MemberCard
            key={id}
            name={name}
            avatarUrl={avatarUrl}
            onClick={() => onSelect(id)}
          />
        ))
      )}
    </div>
  );
};



const Members = ({
  members,
  setMembers,
  setCurrentAIResponder,
  currentAIResponder,
  inputButtonDisabled,
  setInputButtonDisabled,
  setPendingMessage,
  db,
  chatID,
  user,
  chatNames,
  setChatNames,
  chats,
  allowAIResponse,
  setAllowAIResponse,
  imageStyle,
  setImageStyle,
  usersMember,
  setUsersMember,
  usingGPT,
  setUsingGPT
}) => {
  const [memberCurrentlyEdited, setMemberCurrentlyEdited] = useState("");
  const [editingChatSettings, setEditingChatSettings] = useState(false);
  const [directory, setDirectory] = useState("");
  const [imageGenerating, setImageGenerating] = useState(false);
  const [showMemberSelection, setShowMemberSelection] = useState(false);
  const [allMembers, setAllMembers] = useState({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [loadingAllMembers, setLoadingAllMembers] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.uid) {
      const newDirectory = `users/${user.uid}/chats`;
      console.log("Setting directory:", newDirectory);
      setDirectory(newDirectory);
    }
  }, [user, chatID]);

  useEffect(()=>{
    if (showMemberSelection){
      fetchAllMembers();
    }
  },[showMemberSelection]);

  useEffect(() => {
    const updateUsersMemberInFirebase = async () => {
      if (!directory || !chatID || !user || !user.uid) {
        console.error("Directory, chatID, or user not set. User might not be initialized.");
        return;
      }

      try {
        const docRef = doc(db, directory, chatID);
        await updateDoc(docRef, {
          user: usersMember
        });
        console.log("User's member updated in Firebase");
      } catch (error) {
        console.error("Error updating user's member in Firebase:", error);
      }
    };

    if (usersMember) {
      updateUsersMemberInFirebase();
    }
  }, [usersMember]);

  useEffect(() => {
    if (directory && chatID) {
      updateMembersFromFirebase();
      updateChatNameFromFirebase();
      updateImageStyleFromFirebase();
      updateUsersMemberFromFirebase();
    }
  }, [directory, chatID]);

  useEffect(() => {
    if (memberCurrentlyEdited === "") {
      if (usersMember) {
        updateMemberInFirebase(usersMember);
      }
      Object.keys(members).forEach(memberID => {
        if (memberID !== usersMember) {
          updateMemberInFirebase(memberID);
        }
      });
    }
  }, [memberCurrentlyEdited, usersMember, members])

  async function updateUsersMemberFromFirebase() {
    if (!directory || !chatID) {
      console.error("Directory or chatID not set. User might not be initialized.");
      return;
    }

    try {
      const docRef = doc(db, directory, chatID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.user !== undefined) {
          setUsersMember(data.user);
        } else {
          console.log("User's member not found in chat document.");
        }
      } else {
        console.log("No chat document found!");
      }
    } catch (error) {
      console.error("Error fetching user's member from Firebase:", error);
    }
  }

  async function updateImageStyleFromFirebase() {
    if (!directory || !chatID) {
      console.error("Directory or chatID not set. User might not be initialized.");
      return;
    }

    try {
      const docRef = doc(db, directory, chatID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.imageStyle) {
          setImageStyle(data.imageStyle);
        } else {
          console.log("Image style not found.");
        }
      } else {
        console.log("No chat document found!");
      }
    } catch (error) {
      console.error("Error fetching image style from Firebase:", error);
    }
  }

  async function updateChatNameFromFirebase() {
    if (!directory || !chatID) {
      console.error("Directory or chatID not set. User might not be initialized.");
      return;
    }

    try {
      const docRef = doc(db, directory, chatID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.chatName) {
          setChatNames(prevChatNames => ({
            ...prevChatNames,
            [chatID]: data.chatName
          }));
        } else {
          console.log("Chat name not found.");
        }
      } else {
        console.log("No chat document found!");
      }
    } catch (error) {
      console.error("Error fetching chat name from Firebase:", error);
    }
  }

  async function updateMembersFromFirebase() {
    if (!directory || !chatID) {
      console.error("Directory or chatID not set. User might not be initialized.");
      return;
    }

    try {
      const chatMembersRef = collection(db, `${directory}/${chatID}/members`);
      const chatMembersSnapshot = await getDocs(chatMembersRef);
      
      const memberPromises = chatMembersSnapshot.docs.map(async (document) => {
        const memberID = document.id;
        const memberRef = doc(db, 'members', memberID);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
          return { id: memberID, ...memberSnap.data() };
        } else {
          console.log(`Member with ID ${memberID} not found in global members collection`);
          return null;
        }
      });

      const membersData = await Promise.all(memberPromises);

      const newMembers = {};

      // Ensure usersMember is first
      if (usersMember && membersData.find(member => member && member.id === usersMember)) {
        const usersMemberData = membersData.find(member => member && member.id === usersMember);
        newMembers[usersMember] = [usersMemberData.name, usersMemberData.personality, usersMemberData.avatarUrl];
      }

      membersData.forEach((member) => {
        if (member && member.id !== usersMember) {
          newMembers[member.id] = [member.name, member.personality, member.avatarUrl];
        }
      });

      setMembers(newMembers);

      console.log("Members updated from Firebase");
    } catch (error) {
      console.error("Error fetching members from Firebase:", error);
    }
  }

  async function deleteMemberFromFirebaseGlobally(memberID) {
    if (!user || !user.uid) {
      console.error("User not initialized.");
      return;
    }

    try {
      // Remove member from user's members collection
      const userMemberRef = doc(db, `users/${user.uid}/members`, memberID);
      await deleteDoc(userMemberRef);

      // Remove member from chat if it exists
      if (directory && chatID) {
        const chatMemberRef = doc(db, `${directory}/${chatID}/members`, memberID);
        await deleteDoc(chatMemberRef);
      }

      // Delete the profile picture
      const functions = getFunctions();
      const deleteProfilePicture = httpsCallable(functions, 'deleteProfilePicture');
      const result = await deleteProfilePicture({ memberID });

      if (!result.data.success) {
        throw new Error(result.data.error || "Failed to delete profile picture");
      }

      console.log("Member and profile picture successfully deleted with ID: ", memberID);
    } catch (e) {
      console.error("Error deleting member: ", e);
    }
  }

  async function deleteMemberFromFirebase(memberID) {
    if (!user || !user.uid || !directory || !chatID) {
      console.error("User not initialized or chat information missing.");
      return;
    }

    try {
      // Remove member only from the chat's members subcollection
      const chatMemberRef = doc(db, `${directory}/${chatID}/members`, memberID);
      await deleteDoc(chatMemberRef);

      console.log(`Member with ID ${memberID} removed from chat ${chatID}`);
    } catch (e) {
      console.error("Error removing member from chat:", e);
    }
  }

  async function updateMemberInFirebase(memberID) {
    if (!directory || !chatID) {
      console.error("Directory or chatID not set. User might not be initialized.");
      return;
    }
    console.log("Attempting to update member in Firestore. Directory:", directory);
    try {
      // Update in global members collection
      const globalMemberRef = doc(db, 'members', memberID);
      await setDoc(globalMemberRef, {
        name: members[memberID][0],
        personality: members[memberID][1],
        avatarUrl: members[memberID][2]
      });

      // Ensure member is in chat's members subcollection
      const chatMemberRef = doc(db, `${directory}/${chatID}/members`, memberID);
      await setDoc(chatMemberRef, {});

      console.log("Member updated with ID: ", memberID);
    } catch (e) {
      console.error("Error updating member: ", e);
    }
  }
  async function updateChatName(newName) {
    if (!directory || !chatID) {
      console.error("Directory or chatID not set. User might not be initialized.");
      return;
    }
  
    try {
      const docRef = doc(db, directory, chatID);
      await updateDoc(docRef, { 
        chatName: newName,
        imageStyle: imageStyle
      });
      setChatNames(prevChatNames => ({
        ...prevChatNames,
        [chatID]: newName
      }));
      console.log("Chat name and image style updated successfully");
    } catch (error) {
      console.error("Error updating chat name and image style:", error);
    }
  }

  async function generateName() {
    if (!inputButtonDisabled) {
      try {
        setInputButtonDisabled(true);
        const name = await generateChatName({ chats, members });
        await updateChatName(name);
      } catch (error) {
        console.error("Error generating or updating chat name:", error);
      } finally {
        setInputButtonDisabled(false);
      }
    }
  }
  const deleteMemberBeingEdited = () => {
    setMembers((prevMembers) => {
      const newMembers = { ...prevMembers };
      delete newMembers[memberCurrentlyEdited];
      return newMembers;
    });
    deleteMemberFromFirebase(memberCurrentlyEdited);
    setMemberCurrentlyEdited("");
  };

  const cancelMemberCreation = () => {
    setMembers((prevMembers) => {
      const newMembers = { ...prevMembers };
      delete newMembers[memberCurrentlyEdited];
      return newMembers;
    });
    deleteMemberFromFirebaseGlobally(memberCurrentlyEdited);
    setMemberCurrentlyEdited("");
  };

  const finishEditing = () => {
    if (memberCurrentlyEdited && members[memberCurrentlyEdited]) {
      const [name, personality] = members[memberCurrentlyEdited];
      if (name === "" && personality === "" && !isInChat(memberCurrentlyEdited)) {
        cancelMemberCreation();
      } else {
        if (usersMember === null) {
          setUsersMember(memberCurrentlyEdited);
        }
        setMemberCurrentlyEdited("");
        }
      }
    };

  const generateUniqueId = async () => {
    let isUnique = false;
    let newId;

    while (!isUnique) {
      newId = uuidv4();
      const memberRef = doc(db, 'members', newId);
      const memberSnap = await getDoc(memberRef);
      
      if (!memberSnap.exists()) {
        isUnique = true;
      }
    }

    return newId;
  };

  const addMember = async () => {
    setShowMemberSelection(true);
  };

  const handleSelectMember = async (memberID) => {
    if (members[memberID]) {
      console.log(`Member ${memberID} is already in the chat.`);
      setShowMemberSelection(false);
      return;
    }

    try {
      const memberRef = doc(db, 'members', memberID);
      const memberSnap = await getDoc(memberRef);
      
      if (memberSnap.exists()) {
        const memberData = memberSnap.data();
        setMembers(prevMembers => ({
          ...prevMembers,
          [memberID]: [memberData.name, memberData.personality, memberData.avatarUrl]
        }));

        // Add the member to the chat's members subcollection
        const chatMemberRef = doc(db, `${directory}/${chatID}/members`, memberID);
        await setDoc(chatMemberRef, {});

        console.log(`Added member ${memberData.name} to chat ${chatID}`);

        // Set this member as usersMember if it's not already set
        if (!usersMember) {
          setUsersMember(memberID);
        }
      } else {
        console.error(`Member with ID ${memberID} not found in global members collection`);
      }
    } catch (error) {
      console.error("Error adding member to chat:", error);
    }

    setShowMemberSelection(false);
  };

  const fetchAllMembers = async () => {
    if (!user || !user.uid) {
      console.error("User not initialized.");
      return;
    }

    setLoadingAllMembers(true);

    try {
      // Step 1: Get the list of memberIDs from the user's personal directory
      const userMembersRef = collection(db, `users/${user.uid}/members`);
      const userMembersSnapshot = await getDocs(userMembersRef);

      const memberIDs = userMembersSnapshot.docs.map(doc => doc.id);

      // Step 2: Fetch details for each member from the global members directory
      const allMembersData = {};
      for (const memberID of memberIDs) {
        const globalMemberRef = doc(db, 'members', memberID);
        const globalMemberSnap = await getDoc(globalMemberRef);
        
        if (globalMemberSnap.exists()) {
          const memberData = globalMemberSnap.data();
          allMembersData[memberID] = [memberData.name, memberData.personality, memberData.avatarUrl];
        } else {
          console.log(`Member with ID ${memberID} not found in global members collection`);
        }
      }

      // Filter out members that are already in the current chat
      const filteredMembers = Object.keys(allMembersData).reduce((acc, memberId) => {
        if (!members[memberId]) {
          acc[memberId] = allMembersData[memberId];
        }
        return acc;
      }, {});

      setAllMembers(filteredMembers);
    } catch (error) {
      console.error("Error fetching all members:", error);
    } finally {
      setLoadingAllMembers(false);
    }
  };

  const handleAddNewMember = async () => {
    const newMemberID = uuidv4();
    const newMember = {
      name: "",
      personality: "",
      avatarUrl: placeholderPfp
    };

    try {
      // Add to global members collection
      const globalMemberRef = doc(db, 'members', newMemberID);
      await setDoc(globalMemberRef, newMember);

      // Add to user's members collection
      const userMemberRef = doc(db, `users/${user.uid}/members`, newMemberID);
      await setDoc(userMemberRef, {});

      // Add to chat
      const chatMemberRef = doc(db, `${directory}/${chatID}/members`, newMemberID);
      await setDoc(chatMemberRef, {});

      setMembers(prevMembers => ({
        ...prevMembers,
        [newMemberID]: [newMember.name, newMember.personality, newMember.avatarUrl]
      }));

      console.log(`Added new member with ID ${newMemberID}`);
      setMemberCurrentlyEdited(newMemberID);
    } catch (error) {
      console.error("Error adding new member:", error);
    }

    setShowMemberSelection(false);
  };

  async function autoRespond (){
    if (!inputButtonDisabled) {
      if (currentAIResponder === "") {
        let aiResponder = "";
          try {
            aiResponder = await determineAIResponder({
              chats,
              members,
              setCurrentAIResponder
            });
          } catch (error) {
            console.error("Error determining AI responder:", error);
            // !!!! ADD error message prompting to retry
          }
          console.log(aiResponder)
        setCurrentAIResponder(aiResponder);
      }
      setInputButtonDisabled(true);
      setPendingMessage(true);
    }
  };
  
  const truncateName = (name) => {
    return name.length > 14 ? `${name.slice(0, 13)}...` : name;
  };

  
  async function generateMemberProfilePicture(memberID) {
    console.log("generatepfp called");
    console.log(members[memberID][0]);
  
    try {
      setImageGenerating(true);
  
      // Generate the image using OpenAI
      const tempImageUrl = await generateProfilePicture({
        name: members[memberID][0],
        personality: members[memberID][1]
      });
  
      // Call the Cloud Function to save the image
      const functions = getFunctions();
      const saveProfilePicture = httpsCallable(functions, 'saveProfilePicture');
      const result = await saveProfilePicture({ imageUrl: tempImageUrl, memberID });
  
      if (result.data.success) {
        const permanentImageUrl = result.data.url;
  
        setMembers(prevMembers => ({
          ...prevMembers,
          [memberID]: [
            prevMembers[memberID][0],
            prevMembers[memberID][1],
            permanentImageUrl + '?t=' + new Date().getTime() // Add a timestamp to force reload
          ]
        }));
        console.log(permanentImageUrl);
      } else {
        throw new Error(result.data.error);
      }
  
      setImageGenerating(false);
    } catch (error) {
      setImageGenerating(false);
      console.error("Error generating or storing profile picture:", error);
      // Set an error state or show a user-friendly message
    }
  }

  async function deleteChat() {
    if (!directory || !chatID || !user || !user.uid) {
      console.error("Directory, chatID, or user not set. User might not be initialized.");
      return;
    }
  
    try {
      // Delete all members
      const membersCollectionRef = collection(db, `${directory}/${chatID}/members`);
      const membersSnapshot = await getDocs(membersCollectionRef);
      const deleteMemberPromises = membersSnapshot.docs.map(async (docSnapshot) => {
        const memberID = docSnapshot.id;
        await deleteMemberFromFirebase(memberID);
      });
      await Promise.all(deleteMemberPromises);
  
      // Delete all messages (assuming there's a messages subcollection)
      const messagesCollectionRef = collection(db, `${directory}/${chatID}/messages`);
      const messagesSnapshot = await getDocs(messagesCollectionRef);
      const deleteMessagePromises = messagesSnapshot.docs.map(docSnapshot => deleteDoc(docSnapshot.ref));
      await Promise.all(deleteMessagePromises);
  
      // Delete all conversation images
      const functions = getFunctions();
      const deleteConversationImage = httpsCallable(functions, 'deleteConversationImage');
      const deleteImagePromises = messagesSnapshot.docs
        .filter(doc => doc.data().messageType === 'image')
        .map(doc => deleteConversationImage({ chatID, fileName: doc.data().imageUrl.split('/').pop() }));
      await Promise.all(deleteImagePromises);
  
      // Delete the chat document itself
      const chatDocRef = doc(db, directory, chatID);
      await deleteDoc(chatDocRef);
  
      // Delete the entire chat directory in Firestore
      const chatDirectoryRef = doc(db, `users/${user.uid}/chats`, chatID);
      await deleteDoc(chatDirectoryRef);
  
      console.log("Chat and all associated data deleted successfully");
  
      // Update local state
      setChatNames(prevChatNames => {
        const newChatNames = { ...prevChatNames };
        delete newChatNames[chatID];
        return newChatNames;
      });
  
      // Navigate to the home page
      navigate('/');
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  }
  const isInChat = (memberID) => {
    return chats.some(chat => 
      chat[0] === "text" && chat[1] === memberID
    );
  }

  const renderMembers = () => {
    const sortedMemberIDs = Object.keys(members).sort((a, b) => {
      if (a === usersMember) return -1;
      if (b === usersMember) return 1;
      return 0;
    });

    return sortedMemberIDs.map(renderMember);
  };

  const renderMember = (memberID) => {
    const [name, personality, avatarUrl] = members[memberID];
    const isUserMember = memberID === usersMember;

    if (currentAIResponder === memberID) {
      if (memberID === memberCurrentlyEdited) {
        setCurrentAIResponder("");
      }
      if (memberID === usersMember) {
        setCurrentAIResponder("");
      }
      return (
        <div className="SelectedMember" key={memberID}>
          <div className="MemberAvatar" onClick={autoRespond}>
            <img src={avatarUrl} alt={`${name} avatar`} />
          </div>
          <h1 onClick={autoRespond}>{truncateName(name)}</h1>
          <LuSettings2
            onClick={(e) => {
              e.stopPropagation();
              setMemberCurrentlyEdited(memberID);
            }}
            className="Icon"
          />
          {inputButtonDisabled ? (
            <BiSolidMessageSquareDots className="Icon" />
          ) : (
            <BiSolidMessageSquareAdd 
              className="Icon" 
              onClick={(e) => {
                e.stopPropagation();
                autoRespond();
              }} 
              title={`Have ${members[memberID][0]} respond automatically`}
            />
          )}
        </div>
      );
    } else if (memberCurrentlyEdited === memberID) {
      return (
        <div className="MemberBeingEdited" key={memberID}>
           <div className="MemberHeader">
           
            <div className="MemberAvatarEdited">
              <img src={avatarUrl || placeholderPfp} alt="Member being edited" />
            </div>
            { imageGenerating ? 
             <Riple color="white" size="small" text="" textColor="#ffffff" />:<RiAiGenerate className="Icon" onClick={() => generateMemberProfilePicture(memberID)}/>}
            
          </div>
          {memberID === usersMember ? (
  <div className="AIToggle">

        <input
          type="checkbox"
          checked={allowAIResponse}
          onChange={() => setAllowAIResponse(!allowAIResponse)}
        />
        <h3>{allowAIResponse ? "Allowing AI to respond for me" : "Allow AI to respond for me"}</h3>

  </div>
) : (
  <>
  <div className="SetAsUserToggle">
            <button
              className="SetAsUserButton"
              onClick={() => {
                setUsersMember(memberID);
              }}
              disabled={memberID === usersMember}
            >
              {"Set as User"}
            </button>
          
  {!isInChat(memberID) && (
    
    <button
      className="DeleteButtonMembers"
      onClick={deleteMemberBeingEdited}
    >
      <FaTrash />
    </button>
  
  )}
  </div>
  </>
)}
          <h3>Name</h3>
          <textarea
            placeholder="EX: John Doe, your name, etc."
            className="PersonalityInput"
            onChange={(e) =>
              setMembers((prevMembers) => ({
                ...prevMembers,
                [memberID]: [e.target.value, prevMembers[memberID][1], prevMembers[memberID][2]],
              }))
            }
            value={name}
          />
          <h3>Personality</h3>
          <textarea
            placeholder="EX: An eccentric old man, a kindhearted chef, a mischievous cat"
            className="PersonalityInput"
            onChange={(e) =>
              setMembers((prevMembers) => ({
                ...prevMembers,
                [memberID]: [prevMembers[memberID][0], e.target.value, prevMembers[memberID][2]],
              }))
            }
            value={personality}
          />
          
          
          <button className="DoneButton" onClick={finishEditing}>Done</button>
        </div>
      );
    } else {
      return (
        <div 
          className={`Member`} 
          key={memberID} 
          data-is-user={isUserMember}
          onClick={() => setCurrentAIResponder(memberID)}
        >
          <div className="MemberAvatar">
            <img src={avatarUrl || placeholderPfp} alt={`${name} avatar`} key={avatarUrl} />
          </div>
          <h1>{truncateName(name)}</h1>
          <LuSettings2
            onClick={() => setMemberCurrentlyEdited(memberID)}
            className="Icon"
          />
          {!isUserMember && (
            <BiSolidMessageSquareDetail
              
              className="Icon"
              title={`Set ${name} as the responder`}
            />
          )}
        </div>
      );
    }
  };

  const renderChatInfo = ( ) => {
    const currentChatName = chatNames[chatID] || "";
    
    if (!editingChatSettings) {
      return (
        <div className="Title">
          
          <h1>{currentChatName}</h1>
          
          {currentAIResponder === "" ? (
        <MdAutoAwesome className="SpecialIcon" onClick={autoRespond} title="Click to AutoRespond"/>
      ) : (
        <MdAutoAwesome 
          className="Icon" 
          onClick={() => setCurrentAIResponder("")}
          title = "Click to let AI determine the responder"
        />
        
      )}
      
          <IoMdSettings
            className="Icon"
            onClick={() => setEditingChatSettings(true)}
          />
        </div>
      );
    } else {
      return (
        
        <div className="MemberBeingEdited">
          <div className="SetAsUserToggle"> 
          <button 
            className="SetAsUserButton"
            onClick={() => setUsingGPT(!usingGPT)}
            title={"Mistral doesnt reject messages as much as GPT-4, but GPT-4 is more powerful overall. Defaults to Mistral after refresh."}
          >
            {usingGPT ? "Switch model to Mistral" : "Switch model to GPT-4"}
          </button>
         
          {showDeleteConfirmation ? (
            <div className="delete-confirmation">
              <p>Deleting the chat is a permanent action that cannot be undone. Are you sure?</p>
              <button className="cancel-button" onClick={() => setShowDeleteConfirmation(false)}>Cancel</button>
              <button className="confirm-button" onClick={deleteChat}>Continue</button>
            </div>
          ) : (
            <button
              className="DeleteButtonMembers"
              onClick={() => setShowDeleteConfirmation(true)}
            >
              <FaTrash />
            </button>
          )}
          </div>
          <h3>Chat Name</h3>
          

          <textarea
            placeholder="Enter chat name here"
            className="NameInput"
            onChange={(e) => setChatNames(prev => ({ ...prev, [chatID]: e.target.value }))}
            value={currentChatName}
          />
          <button 
            className="SetAsUserButton"
            onClick={generateName}
            title="Generate Title"
          >
            Generate Title
          </button>
          <h3>Image Style</h3>
          <textarea
            placeholder="Try: studio ghibli, comic book, watercolor, vintage cartoon"
            className="PersonalityInput"
            onChange={(e) => setImageStyle(e.target.value)}
            value={imageStyle}
          />
          <button 
          className="DoneButton"
          onClick={() => {
            setEditingChatSettings(false);
            updateChatName(currentChatName);
          }}
        >
          Done
        </button>
        </div>
      );
    }
  };

  if (showMemberSelection) {
    return (
      <MemberSelectionView
        allMembers={allMembers}
        onSelect={handleSelectMember}
        onAddNew={handleAddNewMember}
        onBack={() => setShowMemberSelection(false)}
        loadingAllMembers={loadingAllMembers}
      />
    );
  }

  return (
    <div className="Members">
      {renderChatInfo()}
      
      {renderMembers()}
      <div className="CreateMember" onClick={addMember}>
        <h1>+ Add Member</h1>
      </div>
      
      {Object.keys(members).length < 2 && (
        <h2>
          {window.innerWidth <= 768
            ? "Hint: Tap the button on the top to toggle between chat information and the chat itself!"
            : "Hint: Hover over some icons to see what they do!"}
        </h2>
      )}
    </div>
  );
};
      

export default Members;