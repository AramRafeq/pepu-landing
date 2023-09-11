import { useEffect } from "react";
export default function App() {
  useEffect(() => {
    window.location.replace("pepu://");
    setTimeout(function () {
      // Link to the App Store should go here -- only fires if deep link fails
      window.location = "https://onelink.to/pepu";
    }, 5000);
  }, []);
  return (
    <>
      <span></span>
    </>
  );
}
export const runtime = "edge";
