import React, { useEffect, useState } from 'react';
import api from '../api';
import { Users, Shield, UserCog, ChevronLeft, Save, AlertCircle, Plus, Trash2, BarChart3, Database, LayoutGrid, List } from 'lucide-react';

interface User {
    user_id: string;
    username: string;
    email: string;
    role_id: number;
    created_at: string;
}

interface Role {
    role_id: number;
    name: string;
}

interface AdminPanelProps {
    onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
    const [tab, setTab] = useState<'analytics' | 'users' | 'kb'>('analytics');
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [kb, setKb] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [newKb, setNewKb] = useState({ question: '', answer: '', category: '' });

    const fetchData = async () => {
        try {
            const [usersRes, rolesRes, kbRes, analyticsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/roles'),
                api.get('/admin/kb'),
                api.get('/admin/analytics')
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
            setKb(kbRes.data);
            setAnalytics(analyticsRes.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Не удалось загрузить данные администратора");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRoleChange = async (userId: string, roleName: string) => {
        setUpdating(userId);
        setError(null);
        try {
            await api.patch(`/admin/users/${userId}/role?role_name=${roleName}`);
            await fetchData();
        } catch (err: any) {
            setError(err.response?.data?.detail || "Не удалось обновить роль");
        } finally {
            setUpdating(null);
        }
    };

    const handleAddKb = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/kb', newKb);
            setNewKb({ question: '', answer: '', category: '' });
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.detail || "Не удалось добавить запись в БЗ");
        }
    };

    const handleDeleteKb = async (id: number) => {
        try {
            await api.delete(`/admin/kb/${id}`);
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.detail || "Не удалось удалить запись БЗ");
        }
    };

    if (loading) return null;

    const getRoleLabel = (name: string) => {
        switch(name) {
            case 'client': return 'КЛИЕНТ';
            case 'agent': return 'АГЕНТ';
            case 'admin': return 'АДМИН';
            default: return name.toUpperCase();
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500 font-sans">
            
            {/* Header Tabs */}
            <div className="flex items-center gap-2 bg-[#0f0f11] p-1 border border-zinc-800 rounded-sm w-fit">
                {[
                    { id: 'analytics', label: 'СТАТИСТИКА', icon: <BarChart3 size={12}/> },
                    { id: 'users', label: 'ДОСТУП', icon: <Users size={12}/> },
                    { id: 'kb', label: 'БАЗА ЗНАНИЙ', icon: <Database size={12}/> }
                ].map(t => (
                    <button 
                        key={t.id}
                        onClick={() => setTab(t.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 text-[9px] font-black tracking-widest transition-all ${tab === t.id ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            {tab === 'analytics' && analytics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 border border-zinc-800 bg-[#0f0f11] space-y-2">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">АКТИВНЫЕ ТИКЕТЫ</p>
                        <p className="text-5xl font-black text-white italic">{analytics.total_tickets}</p>
                    </div>
                    <div className="p-8 border border-zinc-800 bg-[#0f0f11] space-y-2">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">УЗЛЫ ПОЛЬЗОВАТЕЛЕЙ</p>
                        <p className="text-5xl font-black text-white italic">{analytics.total_users}</p>
                    </div>
                    <div className="p-8 border border-zinc-800 bg-[#0f0f11] col-span-1 md:col-span-3">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-8">РАСПРЕДЕЛЕНИЕ РЕСУРСОВ</p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                            {Object.entries(analytics.status_distribution).map(([name, count]: any) => (
                                <div key={name} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[8px] font-black text-zinc-500 uppercase">{name}</span>
                                        <span className="text-xs font-black text-white">{count}</span>
                                    </div>
                                    <div className="h-1 bg-zinc-800 w-full overflow-hidden">
                                        <div className="h-full bg-white transition-all duration-1000" style={{ width: `${(count/analytics.total_tickets)*100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'users' && (
                <div className="border border-zinc-800 rounded-sm bg-[#0f0f11] overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-900/50 border-b border-zinc-800">
                                <th className="p-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">ПОЛЬЗОВАТЕЛЬ</th>
                                <th className="p-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest text-center">УРОВЕНЬ ДОСТУПА</th>
                                <th className="p-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest text-right">ДЕЙСТВИЯ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {users.map(u => (
                                <tr key={u.user_id} className="hover:bg-zinc-800/20 transition-all">
                                    <td className="p-4">
                                        <p className="text-[11px] font-bold text-white uppercase tracking-tight">{u.username}</p>
                                        <p className="text-[9px] font-medium text-zinc-600">{u.email}</p>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-[10px] font-black text-blue-500 border border-blue-500/20 px-3 py-1 bg-blue-500/5">
                                            {getRoleLabel(roles.find(r => r.role_id === u.role_id)?.name || '...')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <select 
                                            className="bg-zinc-950 border border-zinc-800 text-[10px] font-black p-2 text-zinc-400 outline-none focus:border-zinc-600 transition-all"
                                            value={roles.find(r => r.role_id === u.role_id)?.name}
                                            onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                                            disabled={updating === u.user_id}
                                        >
                                            {roles.map(r => (
                                                <option key={r.role_id} value={r.name}>{getRoleLabel(r.name)}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'kb' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-8 border border-zinc-800 bg-[#0f0f11] space-y-8">
                            <p className="text-[10px] font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                                <Plus size={14}/> НОВАЯ ЗАПИСЬ
                            </p>
                            <form onSubmit={handleAddKb} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">ВОПРОС / ТРИГГЕР</label>
                                    <input 
                                        className="w-full bg-zinc-950 border border-zinc-800 p-3 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-600"
                                        value={newKb.question}
                                        onChange={e => setNewKb({...newKb, question: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">КАТЕГОРИЯ</label>
                                    <input 
                                        className="w-full bg-zinc-950 border border-zinc-800 p-3 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-600"
                                        value={newKb.category}
                                        onChange={e => setNewKb({...newKb, category: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">ЭТАЛОННЫЙ ОТВЕТ</label>
                                    <textarea 
                                        className="w-full bg-zinc-950 border border-zinc-800 p-3 text-[10px] font-medium text-zinc-300 focus:outline-none focus:border-zinc-600 h-32 resize-none"
                                        value={newKb.answer}
                                        onChange={e => setNewKb({...newKb, answer: e.target.value})}
                                        required
                                    />
                                </div>
                                <button type="submit" className="w-full py-4 bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">
                                    ЗАФИКСИРОВАТЬ
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {kb.map(item => (
                            <div key={item.kb_id} className="p-6 border border-zinc-800 bg-[#0f0f11] space-y-4 group relative">
                                <button onClick={() => handleDeleteKb(item.kb_id)} className="absolute top-4 right-4 text-zinc-800 hover:text-red-500 transition-colors">
                                    <Trash2 size={12}/>
                                </button>
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-black text-zinc-600 uppercase border border-zinc-800 px-2 py-0.5">NODE_{item.kb_id}</span>
                                    {item.category && <span className="text-[8px] font-black text-blue-500 uppercase border border-blue-500/20 px-2 py-0.5">{item.category}</span>}
                                </div>
                                <h4 className="text-xs font-black text-white uppercase italic leading-tight">{item.question}</h4>
                                <p className="text-[10px] text-zinc-500 leading-relaxed">{item.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
