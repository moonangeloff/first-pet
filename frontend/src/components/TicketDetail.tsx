import React, { useEffect, useState } from 'react';
import api from '../api';
import { Send, Bot, User, CheckCircle, Trash2, Edit2, Check, Lock, ChevronLeft, RefreshCcw, Clock, PauseCircle, CheckSquare, MessageSquarePlus, Info } from 'lucide-react';

interface Comment {
  comment_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  body: string;
  created_at: string;
}

interface TicketDetailProps {
  ticketId: string;
  onClose: () => void;
  isAdmin: boolean;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId, onClose, isAdmin }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewTicket] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [currentTicket, setCurrentTicket] = useState<any>(null);

  const fetchComments = async () => {
    try {
      const response = await api.get(`/comments/${ticketId}`);
      setComments(response.data);
    } catch (err) { console.error(err); }
  };

  const fetchTicket = async () => {
      try {
          const response = await api.get(`/tickets/`);
          const ticket = response.data.find((t: any) => t.ticket_id === ticketId);
          setCurrentTicket(ticket);
          setNewTitle(ticket.title);
      } catch (err) { console.error(err); }
  }

  useEffect(() => {
    fetchComments();
    fetchTicket();
    const interval = setInterval(() => {
        fetchComments();
        fetchTicket();
    }, 3000);
    return () => clearInterval(interval);
  }, [ticketId]);

  const handleSend = async (e?: React.FormEvent, customBody?: string) => {
    if (e) e.preventDefault();
    if (currentTicket?.status_id >= 4) return;
    
    const body = customBody || newComment;
    if (!body.trim()) return;
    setNewTicket('');

    try {
      await api.post('/comments/', { ticket_id: ticketId, body });
      fetchComments();
    } catch (err) { console.error(err); }
  };

  const askAI = async () => {
    setLoading(true);
    try {
      await api.post(`/tickets/${ticketId}/ai-help`);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const updateStatus = async (statusId: number, reason?: string) => {
      try {
          let statusName = "";
          switch(statusId) {
              case 2: statusName = "ОТКРЫТ"; break;
              case 3: statusName = "ОЖИДАНИЕ"; break;
              case 4: statusName = "РЕШЕН"; break;
              case 5: statusName = "ЗАКРЫТ"; break;
          }
          
          await handleSend(undefined, `[СИСТЕМА: СТАТУС ИЗМЕНЕН НА ${statusName}] ${reason || ""}`);
          await api.patch(`/tickets/${ticketId}`, { status_id: statusId });
          await fetchTicket(); 
      } catch (err) { console.error(err); }
  }

  const getStatusLabel = (id: number) => {
      switch(id) {
          case 1: return 'НОВЫЙ';
          case 2: return 'ОТКРЫТ';
          case 3: return 'ОЖИДАНИЕ';
          case 4: return 'РЕШЕН';
          case 5: return 'ЗАКРЫТ';
          default: return 'НЕИЗВЕСТНО';
      }
  }

  const isLocked = currentTicket?.status_id >= 4;

  return (
    <div className="fixed inset-0 bg-black/90 z-[110] flex items-center justify-end font-sans">
      <div className="w-full max-w-4xl h-full bg-[#0a0a0b] border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <header className="h-16 border-b border-zinc-800 px-8 flex items-center justify-between bg-zinc-900/30">
          <div className="flex items-center gap-6 min-w-0 flex-1">
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white">
                <ChevronLeft size={20} />
            </button>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-4">
                    <h2 className="text-xs font-black text-white uppercase tracking-widest truncate italic">
                        {currentTicket?.title || 'ЗАГРУЗКА...'}
                    </h2>
                    <div className={`px-2 py-0.5 border border-zinc-700 rounded-sm text-[9px] font-black text-zinc-400 uppercase`}>
                        {getStatusLabel(currentTicket?.status_id)}
                    </div>
                </div>
            </div>
          </div>
          {isAdmin && (
              <button onClick={() => { if(window.confirm("УДАЛИТЬ ЗАПИСЬ?")) api.delete(`/tickets/${ticketId}`).then(onClose) }} className="p-2 text-zinc-600 hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
          )}
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* Sidebar Metadata */}
            <div className="w-64 border-r border-zinc-800 bg-zinc-900/10 p-6 space-y-8 hidden md:block">
                <section className="space-y-4">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">ДЕТАЛИ ОБЪЕКТА</p>
                    <div className="space-y-4">
                        <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase mb-1">ID ЗАПРОСА</p>
                            <p className="text-[10px] font-mono text-zinc-300">#{ticketId.slice(0,12).toUpperCase()}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase mb-1">ПРИОРИТЕТ</p>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Level 0{currentTicket?.priority_id}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase mb-1">СОЗДАН</p>
                            <p className="text-[10px] font-black text-zinc-400 uppercase">{currentTicket ? new Date(currentTicket.created_at).toLocaleDateString() : '...'}</p>
                        </div>
                    </div>
                </section>

                {isAdmin && !isLocked && (
                    <section className="space-y-4 pt-8 border-t border-zinc-800">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">УПРАВЛЕНИЕ</p>
                        <div className="flex flex-col gap-2">
                            {currentTicket?.status_id === 1 && (
                                <button onClick={() => updateStatus(2)} className="w-full text-left p-2 text-[9px] font-black text-blue-500 hover:bg-blue-500/5 transition-all border border-blue-500/20 rounded-sm">В РАБОТУ</button>
                            )}
                            {currentTicket?.status_id === 2 && (
                                <button onClick={() => updateStatus(3)} className="w-full text-left p-2 text-[9px] font-black text-amber-500 hover:bg-amber-500/5 transition-all border border-amber-500/20 rounded-sm">В ОЖИДАНИЕ</button>
                            )}
                            <button onClick={() => updateStatus(4)} className="w-full text-left p-2 text-[9px] font-black text-emerald-500 hover:bg-emerald-500/5 transition-all border border-emerald-500/20 rounded-sm">РЕШИТЬ</button>
                            <button onClick={() => updateStatus(5, "Manual terminal")} className="w-full text-left p-2 text-[9px] font-black text-red-500 hover:bg-red-500/5 transition-all border border-red-500/20 rounded-sm">ЗАКРЫТЬ</button>
                        </div>
                    </section>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-[#0c0c0d]">
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {comments.map((c) => (
                        <div key={c.comment_id} className={`flex ${c.author_role === 'client' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] ${c.author_role === 'client' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                                <div className="flex items-center gap-2 px-1">
                                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                                        {c.author_role === 'client' ? 'NODE_USER' : c.author_name === 'ai_bot' ? 'CORE_AI' : 'OP_' + c.author_name.toUpperCase()}
                                    </span>
                                </div>
                                <div className={`p-4 text-xs font-medium leading-relaxed border ${
                                    c.author_role === 'client' 
                                    ? 'bg-white text-black border-white rounded-bl-xl' 
                                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 rounded-br-xl'
                                }`}>
                                    {c.body}
                                </div>
                                <span className="text-[8px] font-bold text-zinc-700 px-1 italic">
                                    {new Date(c.created_at).toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <footer className="p-6 border-t border-zinc-800 bg-[#0a0a0b]">
                    {isLocked ? (
                        <div className="p-4 border border-zinc-800 text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] text-center">
                            TERMINAL_READ_ONLY
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <form onSubmit={handleSend} className="flex gap-2">
                                <input 
                                    className="flex-1 bg-zinc-950 border border-zinc-800 p-4 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-600 rounded-sm"
                                    placeholder="INPUT_MESSAGE..."
                                    value={newComment}
                                    onChange={(e) => setNewTicket(e.target.value)}
                                />
                                <button type="submit" className="bg-white text-black px-6 py-2 rounded-sm hover:bg-zinc-200 transition-all">
                                    <Send size={18} />
                                </button>
                            </form>
                            <div className="flex gap-2">
                                <button 
                                    onClick={askAI}
                                    disabled={loading}
                                    className="flex-1 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-900 border border-zinc-800 hover:text-white transition-all disabled:opacity-30"
                                >
                                    {loading ? 'ANALYZING...' : 'INVOKE_AI_ASSISTANT'}
                                </button>
                                {!isAdmin && (
                                    <button 
                                        onClick={() => updateStatus(5, "Closed by user")}
                                        className="px-6 py-3 text-[9px] font-black uppercase text-zinc-600 border border-zinc-800 hover:text-red-500 hover:border-red-500/30 transition-all"
                                    >
                                        TERMINATE
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </footer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
