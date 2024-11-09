import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, collection, getDocs, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import NavBar from "./NavBar";
import CardComponent from "./CardComponent";

export function HomeGrid({ chatNames, setChatNames, db, user, setChatID, chatMembers, setChatMembers }) {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user && db) {
            updateChatNamesFromFirebase();
            updateChatMembersFromFirebase();
            setIsLoading(false);
        }
    }, [user, db]);

    const updateChatNamesFromFirebase = async () => {
        if (!user || !db) {
            console.error("User or database not initialized");
            return;
        }

        try {
            const chatsRef = collection(db, `users/${user.uid}/chats`);
            const querySnapshot = await getDocs(chatsRef);
            
            const chatData = [];
            querySnapshot.forEach((doc) => {
                chatData.push({
                    id: doc.id,
                    chatName: doc.data().chatName || "Unnamed Chat",
                    lastOpened: doc.data().lastOpened
                });
            });

            // Sort chats by lastOpened in descending order
            chatData.sort((a, b) => b.lastOpened - a.lastOpened);

            const updatedChatNames = {};
            chatData.forEach((chat) => {
                updatedChatNames[chat.id] = chat.chatName;
            });

            setChatNames(updatedChatNames);
            console.log("Chat names updated and sorted from Firebase");
        } catch (error) {
            console.error("Error fetching and sorting chat names from Firebase:", error);
        }
    };

    const updateChatMembersFromFirebase = async () => {
        if (!user || !db) {
            console.error("User or database not initialized");
            return;
        }

        try {
            const chatsRef = collection(db, `users/${user.uid}/chats`);
            const chatsSnapshot = await getDocs(chatsRef);

            const updatedChatMembers = {};

            for (const chatDoc of chatsSnapshot.docs) {
                const chatID = chatDoc.id;
                const membersRef = collection(db, `users/${user.uid}/chats/${chatID}/members`);
                const membersSnapshot = await getDocs(membersRef);

                const memberPromises = membersSnapshot.docs
                    .filter(doc => doc.id !== "0") // Exclude user with ID "0"
                    .map(async (memberDoc) => {
                        const memberID = memberDoc.id;
                        const globalMemberRef = doc(db, 'members', memberID);
                        const globalMemberSnap = await getDoc(globalMemberRef);
                        
                        if (globalMemberSnap.exists()) {
                            return globalMemberSnap.data().avatarUrl;
                        }
                        return null;
                    });

                const memberAvatars = await Promise.all(memberPromises);
                const validAvatars = memberAvatars.filter(avatar => avatar !== null);

                updatedChatMembers[chatID] = [
                    validAvatars.length, // Count of members excluding user "0"
                    ...validAvatars.slice(0, 3)
                ];
            }

            setChatMembers(updatedChatMembers);
            console.log("Chat members updated from Firebase");
        } catch (error) {
            console.error("Error fetching chat members from Firebase:", error);
        }
    };

    if (isLoading) {
        return <div>Loading...</div>; // Or a more sophisticated loading component
    }

    console.log(chatNames);
    console.log(chatMembers);

    return (
        <div className="home-page">
            <NavBar />
            <div className="home-content">
                <div className="home-grid">
                    <CardComponent
                        type="add"
                        db={db}
                        user={user}
                        setChatID={setChatID}
                        setChatNames={setChatNames}
                    />
                    {Object.entries(chatNames).map(([chatID, chatName]) => (
                        <CardComponent
                            key={chatID}
                            chatID={chatID}
                            type="purple"
                            title={chatName}
                            avatars={chatMembers[chatID] ? chatMembers[chatID].slice(1) : []}
                            memberCount={chatMembers[chatID] ? chatMembers[chatID][0] : 0}
                            setChatID={setChatID}
                            user={user}
                            db={db} // Make sure to pass db here as well
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default HomeGrid;