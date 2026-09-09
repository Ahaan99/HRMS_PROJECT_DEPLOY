import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import API from "../services/api";
import { Bot, Mic, MicOff, Send, X, Volume2, VolumeX } from "lucide-react";

export default function VoiceAssistant() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your HRMS assistant. Ask me about employees, leaves, attendance, candidates, bugs or visitors — type or tap the mic.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakOn, setSpeakOn] = useState(true);
  const recogRef = useRef(null);
  const bottomRef = useRef(null);
  const speechSupported =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (pathname === '/dashboard/chatbot') return null;

  const speak = (text) => {
    if (!speakOn || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    window.speechSynthesis.speak(u);
  };

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setInput("");
    const history = messages.slice(-6);
    setMessages((m) => [...m, { role: "user", content: message }]);
    setBusy(true);
    try {
      const { data } = await API.post("/assistant/chat", { message, history });
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      speak(data.reply);
    } catch {
      const fallback = "Sorry, I couldn't reach the assistant service.";
      setMessages((m) => [...m, { role: "assistant", content: fallback }]);
    } finally {
      setBusy(false);
    }
  };

  const toggleMic = () => {
    if (!speechSupported) return;
    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = "en-IN";
    r.interimResults = false;
    r.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setListening(false);
      send(transcript);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recogRef.current = r;
    setListening(true);
    r.start();
  };

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI assistant"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-300/50 flex items-center justify-center hover:bg-indigo-700 transition"
        >
          <Bot size={26} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white">
            <Bot size={19} />
            <span className="font-semibold text-sm">HRMS Voice Assistant</span>
            <button
              onClick={() => setSpeakOn((v) => !v)}
              className="ml-auto opacity-80 hover:opacity-100"
              aria-label={speakOn ? "Mute voice" : "Unmute voice"}
            >
              {speakOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                window.speechSynthesis?.cancel();
              }}
              className="opacity-80 hover:opacity-100"
              aria-label="Close assistant"
            >
              <X size={17} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-80 min-h-52 bg-gray-50">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-indigo-600 text-white rounded-br-sm"
                    : "bg-white border border-gray-200 text-gray-700 rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
            ))}
            {busy && (
              <div className="bg-white border border-gray-200 text-gray-400 rounded-2xl rounded-bl-sm px-3 py-2 text-sm w-fit">
                Thinking...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 p-3 border-t border-gray-100"
          >
            {speechSupported && (
              <button
                type="button"
                onClick={toggleMic}
                aria-label={listening ? "Stop listening" : "Speak"}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                  listening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? "Listening..." : "Ask about your HRMS..."}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
            <button
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
