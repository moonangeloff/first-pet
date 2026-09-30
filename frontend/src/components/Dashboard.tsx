import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  LogOut, Plus, Shield, LayoutDashboard, MessageSquare, 
  ArrowRight, ShieldAlert, Sparkles, CheckCircle2, Search, 
  Filter, Users, Database, BarChart3, Clock, User, ChevronRight,
  AlertTriangle, CheckCircle, Info
} from 'lucide-react';
import TicketDetail from './TicketDetail';
import AdminPanel from './AdminPanel';

interface UserData {
    user_id: string;
    username: string;
    role_id: number;
}

interface Ticket {
  ticket_id: string;
  title: string;
  description: string;
  status_id: number;
  priority_id: number;
  created_at: string;
  due_date: string;
  last_activity: string;
  last_author: string;
  creator_name?: string;
}

const Dashboard = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority_id: 2 });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'resolved'>('all');

  const fetchUser = async () => {
      try {
          const res = await api.get('/users/me');
          setUser(res.data);
      } catch (err) { 
          localStorage.removeItem('token');
          window.location.reload();
      } finally {
          setLoading(false);
      }
  }

  const fetchTickets = async () => {
    try {
      const response = await api.get('/tickets/');
      setTickets(response.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchUser();
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000);
    return () => clearInterval(interval);
  }, []);

  const isAdmin = user?.role_id === 3;
  const isAgentOrAdmin = user?.role_id === 2 || user?.role_id === 3;
  
  const activeTicket = tickets.find(t => t.status_id < 4);
  const hasActiveTicket = !!activeTicket;

  const getStatusConfig = (id: number) => {
      switch(id) {
          case 1: return { label: 'НОВЫЙ', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', icon: <Info size={12}/> };
          case 2: return { label: 'В РАБОТЕ', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: <Clock size={12}/> };
          case 3: return { label: 'ОЖИДАНИЕ', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', icon: <Clock size={12}/> };
          case 4: return { label: 'РЕШЕН', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: <CheckCircle size={12}/> };
          case 5: return { label: 'ЗАКРЫТ', color: 'text-zinc-500', bg: 'bg-zinc-800/50', border: 'border-zinc-700/50', icon: <Lock size={12}/> };
          default: return { label: 'НЕИЗВЕСТНО', color: 'text-zinc-400', bg: 'bg-zinc-800', border: 'border-zinc-700', icon: <Info size={12}/> };
      }
  }

  const getPriorityConfig = (id: number) => {
      switch(id) {
          case 4: return { label: 'КРИТИЧЕСКИЙ', color: 'text-red-500' };
          case 3: return { label: 'ВЫСОКИЙ', color: 'text-orange-500' };
          case 2: return { label: 'СРЕДНИЙ', color: 'text-zinc-400' };
          default: return { label: 'НИЗКИЙ', color: 'text-zinc-500' };
      }
  }

  const filteredTickets = tickets.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.ticket_id.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeTab === 'active') return matchesSearch && t.status_id < 4;
      if (activeTab === 'resolved') return matchesSearch && t.status_id >= 4;
      return matchesSearch;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgentOrAdmin && hasActiveTicket) return;
    try {
      await api.post('/tickets/', { ...newTicket, priority_id: isAgentOrAdmin ? newTicket.priority_id : 2 });
      setShowModal(false);
      setNewTicket({ title: '', description: '', priority_id: 2 });
      fetchTickets();
    } catch (err) { console.error(err); }
  };

  if (loading || !user) {
    return (
      <div className="h-screen bg-[#0a0a0b] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border border-zinc-700 border-t-white animate-spin"></div>
            <span className="text-[10px] text-zinc-500 tracking-tighter">LOADING_SYSTEM_CORE...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-300 font-sans flex flex-col md:flex-row overflow-hidden">
      
      {/* LEFT SIDEBAR (Sharp, Utilitarian) */}
      <aside className="w-full md:w-64 bg-[#0f0f11] border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
            <div className="w-6 h-6 bg-white flex items-center justify-center rounded-sm">
                <Shield className="text-black" size={14} />
            </div>
            <span className="text-sm font-black tracking-tight text-white uppercase italic">ServicePro</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
            <button 
                onClick={() => { setShowAdminPanel(false); setSelectedTicketId(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-colors ${!showAdminPanel ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800/50 text-zinc-500'}`}
            >
                <LayoutDashboard size={14} /> ТЕРМИНАЛ ЗАЯВОК
            </button>
            {isAdmin && (
                <button 
                    onClick={() => setShowAdminPanel(true)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-colors ${showAdminPanel ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800/50 text-zinc-500'}`}
                >
                    <Shield size={14} /> АДМИНИСТРИРОВАНИЕ
                </button>
            )}
        </nav>

        <div className="p-4 border-t border-zinc-800 space-y-4">
            <div className="flex items-center gap-3 px-3">
                <div className="w-8 h-8 bg-zinc-800 rounded-sm flex items-center justify-center text-zinc-500 border border-zinc-700">
                    <User size={14} />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black text-white truncate uppercase">{user.username}</p>
                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">
                        {user.role_id === 3 ? 'ADMIN_ROOT' : user.role_id === 2 ? 'AGENT_OP' : 'CLIENT_NODE'}
                    </p>
                </div>
            </div>
            <button 
                onClick={() => { localStorage.removeItem('token'); window.location.reload(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold text-zinc-500 hover:text-red-400 transition-colors"
            >
                <LogOut size={14} /> ЗАВЕРШИТЬ СЕССИЮ
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0a0a0b]">
        
        {/* TOP BAR */}
        <header className="h-14 border-b border-zinc-800 px-8 flex items-center justify-between bg-[#0a0a0b]/50 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500">
                <span className="uppercase">SYSTEM</span>
                <ChevronRight size={10} />
                <span className="text-white uppercase tracking-widest">{showAdminPanel ? 'ADMIN_CONSOLE' : 'TICKET_QUEUE'}</span>
            </div>
            {!showAdminPanel && isAgentOrAdmin && (
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                        <input 
                            className="bg-zinc-900 border border-zinc-800 rounded-sm py-1.5 pl-9 pr-4 text-[10px] font-bold focus:outline-none focus:border-zinc-600 w-48 transition-all"
                            placeholder="SEARCH_QUERY..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-white text-black text-[10px] font-black px-4 py-1.5 rounded-sm hover:bg-zinc-200 transition-all uppercase"
                    >
                        + Создать тикет
                    </button>
                </div>
            )}
        </header>

        {/* VIEWPORT */}
        <div className="flex-1 overflow-y-auto p-8">
            {showAdminPanel ? (
                <AdminPanel onClose={() => setShowAdminPanel(false)} />
            ) : isAgentOrAdmin ? (
                /* AGENT VIEW: Information-Dense Table */
                <div className="space-y-6">
                    <div className="flex gap-4 border-b border-zinc-800">
                        {['all', 'active', 'resolved'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                            >
                                {tab === 'all' ? 'ВСЕ' : tab === 'active' ? 'АКТИВНЫЕ' : 'АРХИВ'}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>}
                            </button>
                        ))}
                    </div>

                    <div className="border border-zinc-800 rounded-sm bg-[#0f0f11]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                    <th className="p-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">ID / СУБЪЕКТ</th>
                                    <th className="p-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center">СТАТУС</th>
                                    <th className="p-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center">ПРИОРИТЕТ</th>
                                    <th className="p-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right">ОБНОВЛЕН</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {filteredTickets.map(t => {
                                    const status = getStatusConfig(t.status_id);
                                    const priority = getPriorityConfig(t.priority_id);
                                    return (
                                        <tr 
                                            key={t.ticket_id}
                                            onClick={() => setSelectedTicketId(t.ticket_id)}
                                            className="hover:bg-zinc-800/20 cursor-pointer transition-colors"
                                        >
                                            <td className="p-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[11px] font-bold text-white uppercase tracking-tight">{t.title}</span>
                                                    <span className="text-[9px] font-mono text-zinc-600">ID_{t.ticket_id.slice(0,8).toUpperCase()}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-sm ${status.bg} ${status.border} ${status.color}`}>
                                                    {status.icon}
                                                    <span className="text-[9px] font-black tracking-tighter">{status.label}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`text-[9px] font-black ${priority.color}`}>{priority.label}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className="text-[9px] font-bold text-zinc-600 uppercase">{new Date(t.last_activity).toLocaleDateString()}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredTickets.length === 0 && (
                            <div className="p-20 text-center text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em]">
                                NO_DATA_AVAILABLE
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* CLIENT VIEW: Direct, Clear, Information-dense but simple */
                <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-500 pt-10">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">ТЕРМИНАЛ ПОДДЕРЖКИ</h2>
                        <div className="h-0.5 w-12 bg-white"></div>
                    </div>

                    {!hasActiveTicket ? (
                        <div className="space-y-10 py-10">
                            <div className="p-8 border border-dashed border-zinc-800 flex flex-col items-center gap-6 text-center">
                                <Sparkles className="text-zinc-700" size={32} />
                                <p className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed tracking-widest max-w-[200px]">
                                    АКТИВНЫХ ОБРАЩЕНИЙ НЕТ. СИСТЕМА ГОТОВА К НОВОМУ ЗАПРОСУ.
                                </p>
                                <button 
                                    onClick={() => setShowModal(true)}
                                    className="bg-white text-black px-10 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all rounded-sm"
                                >
                                    ОТКРЫТЬ НОВЫЙ ТИКЕТ
                                </button>
                            </div>

                            {tickets.some(t => t.status_id >= 4) && (
                                <div className="space-y-4">
                                    <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em]">АРХИВ РЕШЕННЫХ</p>
                                    <div className="divide-y divide-zinc-900 border border-zinc-900">
                                        {tickets.filter(t => t.status_id >= 4).slice(0, 5).map(t => (
                                            <div 
                                                key={t.ticket_id} 
                                                onClick={() => setSelectedTicketId(t.ticket_id)}
                                                className="p-4 flex items-center justify-between hover:bg-zinc-900 transition-all cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <CheckCircle2 size={14} className="text-zinc-800 group-hover:text-emerald-500" />
                                                    <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300">{t.title}</span>
                                                </div>
                                                <ArrowRight size={12} className="text-zinc-800" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-[#0f0f11] border border-zinc-800 p-8 rounded-sm space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-blue-400 bg-blue-400/5 px-2 py-1 border border-blue-400/10 uppercase tracking-tighter">АКТИВНАЯ СЕССИЯ</span>
                                    <span className="text-[9px] font-mono text-zinc-600">#{activeTicket.ticket_id.slice(0,8).toUpperCase()}</span>
                                </div>
                                <h3 className="text-xl font-black text-white uppercase italic">{activeTicket.title}</h3>
                                <div className="grid grid-cols-2 gap-px bg-zinc-800 border border-zinc-800">
                                    <div className="bg-[#0a0a0b] p-4">
                                        <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">СТАТУС</p>
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">{getStatusConfig(activeTicket.status_id).label}</p>
                                    </div>
                                    <div className="bg-[#0a0a0b] p-4">
                                        <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">ОБНОВЛЕНО</p>
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">{new Date(activeTicket.last_activity).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedTicketId(activeTicket.ticket_id)}
                                    className="w-full py-4 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-3"
                                >
                                    ПЕРЕЙТИ В ДИАЛОГ <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </main>

      {/* OVERLAY MODALS (Sharp) */}
      {selectedTicketId && (
          <TicketDetail 
            ticketId={selectedTicketId} 
            isAdmin={isAgentOrAdmin} 
            onClose={() => { setSelectedTicketId(null); fetchTickets(); }} 
          />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[#0f0f11] border border-zinc-800 rounded-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-zinc-800 bg-zinc-900/30">
                    <h2 className="text-sm font-black text-white uppercase italic tracking-widest">НОВОЕ ОБРАЩЕНИЕ</h2>
                </div>
                <form onSubmit={handleCreate} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">ТЕМА ЗАПРОСА</label>
                        <input 
                            className="w-full bg-zinc-950 border border-zinc-800 p-4 text-xs font-bold text-white focus:outline-none focus:border-zinc-600 rounded-sm"
                            placeholder="NAME_YOUR_ISSUE..."
                            value={newTicket.title}
                            onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">ОПИСАНИЕ ИНЦИДЕНТА</label>
                        <textarea 
                            className="w-full bg-zinc-950 border border-zinc-800 p-4 text-xs font-medium text-zinc-300 focus:outline-none focus:border-zinc-600 h-32 resize-none rounded-sm"
                            placeholder="DESCRIBE_THE_SITUATION..."
                            value={newTicket.description}
                            onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                        />
                    </div>
                    {isAgentOrAdmin && (
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">УРОВЕНЬ ЭСКАЛАЦИИ</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[1,2,3,4].map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setNewTicket({...newTicket, priority_id: p})}
                                        className={`py-2 text-[9px] font-black border transition-all ${newTicket.priority_id === p ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
                                    >
                                        LVL_0{p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[9px] font-black text-zinc-500 uppercase hover:text-zinc-300">ОТМЕНА</button>
                        <button type="submit" className="flex-[2] py-3 bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-zinc-200">ИНИЦИИРОВАТЬ</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
