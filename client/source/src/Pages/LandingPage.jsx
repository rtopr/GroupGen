import React from 'react';
import '../App.css';
import NavBar from '../Components/NavBar';
import previewImage from '../imgs/Preview.png'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, getFirestore } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';


export const LandingPage = ({auth, firebaseApp}) => {
    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            console.log("User signed in:", result.user);
            
            const db = getFirestore(firebaseApp);
            
            // Check if the user has any members
            const userMembersRef = collection(db, `users/${result.user.uid}/members`);
            const userMembersSnapshot = await getDocs(userMembersRef);
            
            if (userMembersSnapshot.empty) {
                // If no members exist, create a new member with the user's name
                const newMemberId = uuidv4();
                const newMember = {
                    name: result.user.displayName || "New User",
                    personality: "",
                    avatarUrl: result.user.photoURL || "https://pbs.twimg.com/media/FeToPmbWYAEZAeG.png"
                };

                // Add to global members collection
                const globalMemberRef = doc(db, 'members', newMemberId);
                await setDoc(globalMemberRef, newMember);

                // Add to user's members collection
                const userMemberRef = doc(db, `users/${result.user.uid}/members`, newMemberId);
                await setDoc(userMemberRef, {});

                // Set as user's default member
                const userInfoRef = doc(db, `users/${result.user.uid}/userInfo`, 'info');
                await setDoc(userInfoRef, { defaultMemberId: newMemberId }, { merge: true });

                console.log("Created new member for user:", newMember);
            }
        } catch (error) {
            console.error("Error during sign-in:", error);
        }
    };
    return (
        <>
        <NavBar />
        <div className="lp-container">
          <div className="lp-content">
            {/* Left Module */}
            <div className="lp-left-module">
              <div>
                <h1 className="lp-title">Talk to anyone you can imagine with Groupgen</h1>
                <ul className="lp-feature-list">
                  <li>
                    <span className="lp-arrow-icon">➔</span>
                    Create unique members and generate their picture
                  </li>
                  <li>
                    <span className="lp-arrow-icon">➔</span>
                    Have in-depth, creative, funny, and intelligent conversations
                  </li>
                  <li>
                    <span className="lp-arrow-icon">➔</span>
                    Generate images depicting your conversations with one click
                  </li>
                  <li>
                    <span className="lp-arrow-icon">➔</span>
                    Choose who you want to respond, or let the AI choose for you
                  </li>
                  <li>
                    <span className="lp-arrow-icon">➔</span>
                    Completely free!
                  </li>
                </ul>
                <button className="lp-sign-up-button" onClick={signInWithGoogle}>
                Sign In with Google
              </button>
              </div>
            </div>
            
            {/* Right Module */}
            <div className="lp-right-module">
              <div className="lp-image-placeholder">
                {/* Placeholder for the image */}
                <img 
                  src={previewImage}
                  alt="Conversation preview" 
                />
              </div>
              
            </div>
          </div>
        </div>
        </>
    );
};