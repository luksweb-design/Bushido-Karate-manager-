import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Shield, Mail, Lock, LogIn, AlertCircle, Loader2, Code2 } from 'lucide-react';

interface LoginProps {
  onDevBypass?: () => void;
}

const Login: React.FC<LoginProps> = ({ onDevBypass }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao autenticar com Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bushido-black bg-noise flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-bushido-red/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Card */}
      <div className="max-w-md w-full bg-bushido-card/60 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 transform transition-all">
        {/* Header Strip */}
        <div className="h-1 w-full bg-gradient-to-r from-bushido-black via-bushido-red to-bushido-black"></div>
        
        <div className="p-10 text-center relative">
           <div className="mx-auto bg-gradient-to-br from-bushido-red to-red-900 w-24 h-24 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(220,38,38,0.4)] transform -skew-x-12 border border-red-500/30">
              <Shield className="w-12 h-12 text-white transform skew-x-12" />
           </div>
           <h1 className="text-5xl font-display font-bold text-white tracking-[0.1em] leading-none mb-1">BUSHIDO</h1>
           <p className="text-bushido-gold text-xs font-bold uppercase tracking-[0.4em] opacity-80">Graduation Manager</p>
        </div>

        <div className="px-10 pb-10">
          {error && (
            <div className="mb-6 bg-red-950/30 border border-red-900/50 p-4 flex items-center gap-3">
               <AlertCircle className="w-5 h-5 text-bushido-red flex-shrink-0" />
               <p className="text-sm text-red-200 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Acesso Sensei</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-600 group-focus-within:text-bushido-red transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  className="input-bushido block w-full pl-12 pr-4 py-4 font-medium text-white placeholder-gray-700 focus:placeholder-gray-500"
                  placeholder="E-MAIL"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Palavra-Passe</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-600 group-focus-within:text-bushido-red transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  className="input-bushido block w-full pl-12 pr-4 py-4 font-medium text-white placeholder-gray-700 focus:placeholder-gray-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-blade w-full bg-bushido-red hover:bg-red-600 text-white font-display font-bold text-xl py-4 px-4 shadow-[0_4px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_30px_rgba(220,38,38,0.5)] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              <span className="flex items-center gap-2">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogIn className="w-6 h-6" />}
                ENTRAR NO DOJO
              </span>
            </button>
          </form>

          <div className="mt-8">
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-gray-600 text-[10px] font-bold uppercase tracking-widest">Opções Alternativas</span>
                <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-4 w-full bg-bushido-surface border border-white/10 text-gray-300 font-bold py-3 px-4 hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-3 uppercase text-sm tracking-wide"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100" alt="Google" />
              Google Login
            </button>

            {onDevBypass && (
              <button
                onClick={onDevBypass}
                className="mt-3 w-full opacity-40 hover:opacity-100 text-gray-500 text-xs font-mono uppercase tracking-tighter flex justify-center gap-2 items-center transition-opacity"
              >
                <Code2 className="w-3 h-3" /> Modo Offline (Dev)
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-6 text-[10px] text-gray-700 font-mono tracking-widest uppercase">
        Sistema Bushido v2.0 • High Performance
      </div>
    </div>
  );
};

export default Login;