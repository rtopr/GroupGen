import { MemberGrid } from "../Components/MembersGrid";
import NavBar from "../Components/NavBar";
export function MembersPage({db,user}){
    return (
        <>
        <div className ="App">
            <NavBar/>
            <MemberGrid db = {db} user={user}/>
        </div>
        </>
    );
}
