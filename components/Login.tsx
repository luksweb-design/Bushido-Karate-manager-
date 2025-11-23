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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-bushido-black p-8 text-center border-b-4 border-bushido-red">
           <div className="mx-auto bg-bushido-red w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-lg transform rotate-3">
              <Shield className="w-10 h-10 text-white" />
           </div>
           <h1 className="text-2xl font-bold text-white font-jp tracking-wider">BUSHIDO</h1>
           <p className="text-gray-400 text-sm uppercase tracking-widest mt-1">Graduation Manager</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Acesse sua conta</h2>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 flex items-start gap-3 rounded-r">
               <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
               <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-bushido-red focus:border-transparent outline-none transition-all"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-bushido-red focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-bushido-black text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              Entrar
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou continue com</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-6 w-full bg-white text-gray-700 border border-gray-300 font-bold py-3 px-4 rounded-lg shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Google
            </button>

            {onDevBypass && (
              <button
                onClick={onDevBypass}
                className="mt-4 w-full bg-gray-100 text-gray-600 border border-gray-200 font-medium py-3 px-4 rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Code2 className="w-4 h-4" />
                Modo Desenvolvedor (Offline)
              </button>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 text-center border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Use a mesma conta do app mobile para sincronizar.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;