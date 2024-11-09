import { HomeGrid } from '../Components/HomeGrid';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LandingPage } from './LandingPage';
export function Home({db, firebaseApp,auth, chatNames, setChatNames,chatID,setChatID,chatMembers,setChatMembers}) {
    const [user] = useAuthState(auth);
    return (
        <>
            {user? console.log("user id:", user.uid): null}
            {user ? <HomeGrid db = {db} 
            user={user}
            setChatID={setChatID} 
            chatID={chatID} 
            chatNames={chatNames} 
            setChatNames={setChatNames}
            chatMembers={chatMembers}
            setChatMembers={setChatMembers}/> : <LandingPage auth={auth} firebaseApp={firebaseApp}/>}
        </>
    );
}
