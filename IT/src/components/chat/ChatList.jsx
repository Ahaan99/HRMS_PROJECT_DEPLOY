import { useEffect, useState } from "react";
import axios from "axios";
import { MessageCircle, Search, Users } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const MY_TYPE = "it";
const GROUP = { room: "hr-it", name: "HR Team", sub: "Group - every HR and IT member" };

const timeAgo = (d) => {
  if (!d) return "";
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(d).toLocaleDateString([], { day: "numeric", month: "short" });
};

export default function ChatList({ setActiveChat, activeChat }) {
  const [clients, setClients] = useState([]);
  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("hrms_it_Token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios
      .get(`${BASE_URL}/chat/hr/clients`, { headers })
      .then((res) => setClients(res.data.data || []))
      .catch((err) => console.error(err));

    const loadPeople = () =>
      axios
        .get(`${BASE_URL}/chat/internal/directory?senderType=${MY_TYPE}`, { headers })
        .then((res) => setPeople(res.data.data || []))
        .catch((err) => console.error(err));
    loadPeople();
    const interval = setInterval(loadPeople, 10000);
    return () => clearInterval(interval);
  }, []);

  const openClient = async (client) => {
    try {
      const res = await axios.post(`${BASE_URL}/chat/hr/start`, { clientId: client.id }, { headers });
      setActiveChat({
        conversation_id: res.data.conversationId,
        company_name: client.company_name,
        client_name: client.client_name,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const openInternal = (c) =>
    setActiveChat({ internal: true, room: c.room, name: c.name, sub: c.sub, person: c.person || null });

  const q = search.toLowerCase();
  const filteredPeople = people.filter(
    (p) => p.name?.toLowerCase().includes(q) || p.designation?.toLowerCase().includes(q),
  );
  const filteredClients = clients.filter(
    (c) => c.company_name?.toLowerCase().includes(q) || c.client_name?.toLowerCase().includes(q),
  );
  const showGroup = !q || GROUP.name.toLowerCase().includes(q);

  const InternalRow = ({ room, name, sub, preview, when, avatar, onClick }) => {
    const isActive = activeChat?.internal && activeChat?.room === room;
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left p-4 border-b transition-all ${
          isActive ? "bg-amber-50 border-l-4 border-l-amber-500" : "hover:bg-gray-50 border-l-4 border-l-transparent"
        }`}
      >
        <div className="flex items-center gap-3">
          {avatar}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-semibold text-gray-800 text-sm truncate">{name}</div>
              {when && <span className="text-[10px] text-gray-400 shrink-0">{when}</span>}
            </div>
            <div className="text-xs text-gray-500 truncate">{preview || sub}</div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="w-72 border-r flex flex-col bg-white">
      <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-pink-600">
        <h2 className="text-white font-bold text-lg mb-3">IT Chat</h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people or clients..."
            className="w-full pl-9 pr-3 py-2 bg-white/20 text-white placeholder-white/60 rounded-xl text-sm outline-none focus:bg-white/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          HR Team {people.length ? `(${people.length})` : ""}
        </div>
        {filteredPeople.length === 0 && !showGroup ? (
          <p className="px-4 py-3 text-xs text-gray-400">No HR member matches</p>
        ) : (
          filteredPeople.map((p) => (
            <InternalRow
              key={p.room}
              room={p.room}
              name={p.name}
              sub={p.designation || "HR department"}
              preview={p.last_message ? `${p.last_from_me ? "You: " : ""}${p.last_message}` : null}
              when={timeAgo(p.last_at)}
              avatar={
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {p.name.charAt(0).toUpperCase()}
                </div>
              }
              onClick={() => openInternal({ room: p.room, name: p.name, sub: p.designation || "HR department", person: p })}
            />
          ))
        )}
        {showGroup && (
          <InternalRow
            room={GROUP.room}
            name={GROUP.name}
            sub={GROUP.sub}
            avatar={
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Users size={18} />
              </div>
            }
            onClick={() => openInternal(GROUP)}
          />
        )}

        <div className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Clients</div>
        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <MessageCircle size={40} className="mb-2 text-gray-200" />
            <p className="text-sm">No clients found</p>
          </div>
        ) : (
          filteredClients.map((client) => {
            const isActive = !activeChat?.internal && activeChat?.company_name === client.company_name;
            return (
              <button
                type="button"
                key={client.id}
                onClick={() => openClient(client)}
                className={`w-full text-left p-4 border-b transition-all ${
                  isActive ? "bg-purple-50 border-l-4 border-l-purple-500" : "hover:bg-gray-50 border-l-4 border-l-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    {client.company_name?.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{client.company_name}</div>
                    <div className="text-xs text-gray-500">{client.client_name}</div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="p-3 border-t bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-500">Connected</span>
        </div>
      </div>
    </div>
  );
}
