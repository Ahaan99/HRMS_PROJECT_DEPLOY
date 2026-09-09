import { useState } from "react";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import InternalChatWindow from "./InternalChatWindow";
import HRNavbar from "../hr/HRNavbar";
import { MessageCircle } from "lucide-react";

const MY_TYPE = "it";

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState(null);

  return (
    <>
      <HRNavbar />
      <div className="flex h-[calc(100vh-103px)] bg-white border rounded-xl overflow-hidden shadow-lg">
        <ChatList setActiveChat={setActiveChat} activeChat={activeChat} />
        {activeChat?.internal ? (
          <InternalChatWindow activeChat={activeChat} myType={MY_TYPE} />
        ) : activeChat ? (
          <ChatWindow activeChat={activeChat} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={40} className="text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-1">
              Select a chat
            </h3>
            <p className="text-sm">
              Choose HR team or a client to start chatting
            </p>
          </div>
        )}
      </div>
    </>
  );
}
