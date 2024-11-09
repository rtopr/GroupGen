import NavBar from "../Components/NavBar";
import { Settings } from "../Components/Settings";

export function SettingsPage() {
    return (
        <div className="App">
            <NavBar />
            <div className="SettingsFlexBox">
                <Settings />
            </div>
        </div>
    );
}
