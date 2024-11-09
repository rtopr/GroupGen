import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';

export function Settings() {
    const navigate = useNavigate();
    const auth = getAuth();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate('/'); // Redirect to homepage after sign out
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    return (
        <div className="SettingsBox">
            <div className="SettingsContent">
                <div className="SettingItem">
                    
                    {auth.currentUser ? (
                        <div className="UserInfo">
                            <p><strong>Name:</strong> {auth.currentUser.displayName}</p>
                            <p><strong>Email:</strong> {auth.currentUser.email}</p>
                            {auth.currentUser.photoURL && (
                                <img 
                                    src={auth.currentUser.photoURL} 
                                    alt="Profile" 
                                    className="ProfileImage"
                                />
                            )}
                        </div>
                    ) : (
                        <p>No user information available.</p>
                    )}
                </div>
                <div className="SettingItem">
                    <button onClick={handleSignOut} className="SetAsUserButton">Sign Out</button>
                </div>
            </div>
        </div>
    );
}