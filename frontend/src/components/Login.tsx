import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      const response = await api.post('/token', formData);
      localStorage.setItem('token', response.data.access_token);
      navigate('/dashboard');
      window.location.reload();
    } catch (err) {
      setError('ОШИБКА_АВТОРИЗАЦИИ: НЕВЕРНЫЕ_ДАННЫЕ');
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] flex items-center justify-center p-6 font-sans selection:bg-white selection:text-black">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-4">
            <div className="w-10 h-10 bg-white flex items-center justify-center rounded-sm mx-auto shadow-2xl">
                <Shield className="text-black" size={20} />
            </div>
            <div className="text-center">
                <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">ServicePro</h1>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-1">Terminal_v4.2</p>
            </div>
        </div>

        <div className="bg-[#0f0f11] border border-zinc-800 p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-3 bg-red-500/5 border border-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">
                ИДЕНТИФИКАТОР
              </label>
              <input
                type="text"
                required
                className="block w-full bg-zinc-950 border border-zinc-800 p-4 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-all uppercase"
                placeholder="USERNAME"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">
                КЛЮЧ_ДОСТУПА
              </label>
              <input
                type="password"
                required
                className="block w-full bg-zinc-950 border border-zinc-800 p-4 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-white text-black py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-zinc-200 transition-all active:scale-[0.98]"
            >
              АВТОРИЗОВАТЬСЯ
            </button>
          </form>

          <div className="pt-6 border-t border-zinc-900 text-center">
            <Link to="/register" className="text-[9px] font-black text-zinc-600 hover:text-white uppercase tracking-widest transition-colors">
              СОЗДАТЬ_НОВЫЙ_УЗЕЛ_ДОСТУПА
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
