import { MessengerChat } from "react-messenger-chat-plugin";

function ChatMessenger() {
  return (
    <MessengerChat
      pageId="102162639123374"
      language="sv_SE"
      themeColor={"#000000"}
      bottomSpacing={300}
      loggedInGreeting="loggedInGreeting"
      loggedOutGreeting="loggedOutGreeting"
      greetingDialogDisplay={"show"}
      debugMode={true}
      appId="630725065511841"
    />
  );
}

export default ChatMessenger;
