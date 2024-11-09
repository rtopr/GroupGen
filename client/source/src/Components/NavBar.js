import { Link } from "react-router-dom";
import { HiMiniHome } from "react-icons/hi2";
import { FaUserFriends } from "react-icons/fa";
import { SlOptions } from "react-icons/sl";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useState, useEffect } from "react";
import { useMediaQuery } from 'react-responsive';

const NavBar = ({ showMembers, setShowMembers }) => {
  const [user, setUser] = useState(null);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <nav className="NavBar">
      <Link to="/" className="logo-link">
        <h1 className="logo">Groupgen</h1>
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            {isMobile && window.location.pathname.includes('/chat') && (
              <button onClick={() => setShowMembers(!showMembers)} className="nav-toggle-btn">
                {showMembers ? 'Show Chat' : 'Show Members'}
              </button>
            )}
            <Link to="/settings" className="nav-item"><SlOptions/></Link>
            <Link to="/members" className="nav-item"><FaUserFriends/></Link>
          </>
        ) : null}
        <Link to="/" className="nav-item"><HiMiniHome/></Link>
      </div>
    </nav>
  );
}

export default NavBar;