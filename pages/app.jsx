import { useEffect } from "react";
export default function App() {
    useEffect(() => {
        document.getElementById("l").src = "pepu://";
        setTimeout(function () {
            // Link to the App Store should go here -- only fires if deep link fails                
            window.location = "https://onelink.to/pepu";
        }, 2000);
    }, [])
    return (
        <>
            <iframe id="l" width="1" height="1" style={{ visibility: 'hidden' }}></iframe>
        </>
    );
}
