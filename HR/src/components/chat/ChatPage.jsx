import { useState } from "react";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import InternalChatWindow from "./InternalChatWindow";
import HRNavbar from "../hr/HRNavbar";
import { MessageCircle } from "lucide-react";

const MY_TYPE = "hr";

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState(null);

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-4 lg:p-6">
      <HRNavbar />
      <div className="mt-6 flex h-[calc(100vh-150px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <ChatList setActiveChat={setActiveChat} activeChat={activeChat} />
        {activeChat?.internal ? (
          <InternalChatWindow activeChat={activeChat} myType={MY_TYPE} />
        ) : activeChat ? (
          <ChatWindow activeChat={activeChat} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 text-slate-400">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100">
              <MessageCircle
                size={36}
                aria-hidden="true"
                className="text-indigo-400"
              />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-slate-700">
              Select a chat
            </h3>
            <p className="text-sm">
              Choose IT team or a client to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
