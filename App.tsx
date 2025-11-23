import React, { useState, useEffect, useRef } from 'react';
import { DojoState, AppScreen } from './types';
import { loadState, robustSave } from './services/storage';
// import { initFirebaseSync, saveToFirestore, auth } from './services/firebase'; // Disabled for local UX testing
import { auth, signOut } from './services/firebase'; // Keep auth for Login screen only
import { onAuthStateChanged } from "firebase/auth";
import Header from './components/Header';
import StudentManager from './components/StudentManager';
import ExamConfigScreen from './components/ExamConfig';
import Selection from './components/Selection';
import Evaluation from './components/Evaluation';
import Results from './components/Results';
import DojoProfile from './components/DojoProfile';
import Settings from './components/Settings';
import Login from './components/Login';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.DOJO);
  const [dojoState, setDojoState] = useState<DojoState>(loadState());
  // const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  // New: Dev Mode State
  const [isDevMode, setIsDevMode] = useState(false);
  
  // const isRemoteUpdate = useRef(false);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  /* 
  // FIREBASE SYNC DISABLED FOR LOCAL TESTING
  // 2. Initialize Firebase Sync on Mount (if authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = initFirebaseSync((remoteData) => {
      isRemoteUpdate.current = true;
      setDojoState(prev => ({
          ...prev,
          ...remoteData,
      }));
      setIsFirebaseConnected(true);
    });

    return () => {
       if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isAuthenticated]);

  // 3. Persistence Effect
  useEffect(() => {
    robustSave(dojoState);

    if (isAuthenticated && !isRemoteUpdate.current) {
        const timeout = setTimeout(() => {
            saveToFirestore(dojoState);
        }, 1000);
        return () => clearTimeout(timeout);
    } else {
        isRemoteUpdate.current = false;
    }
  }, [dojoState, isAuthenticated]);
  */

  // Local Persistence Only for now
  useEffect(() => {
    robustSave(dojoState);
  }, [dojoState]);

  const updateState = (newState: DojoState) => {
    setDojoState(newState);
  };

  const handleLogout = async () => {
    if (isDevMode) {
      setIsDevMode(false);
    } else {
      await signOut(auth);
    }
  };

  const renderScreen = () => {
    switch (screen) {
      case AppScreen.DOJO:
        return <DojoProfile state={dojoState} updateState={updateState} onNext={() => setScreen(AppScreen.DASHBOARD)} />;
      case AppScreen.SETTINGS:
        return <Settings state={dojoState} updateState={updateState} />;
      case AppScreen.DASHBOARD:
        return <ExamConfigScreen state={dojoState} updateState={updateState} onNext={() => setScreen(AppScreen.STUDENTS)} />;
      case AppScreen.STUDENTS:
        return <StudentManager state={dojoState} updateState={updateState} onNext={() => setScreen(AppScreen.SELECTION)} />;
      case AppScreen.SELECTION:
        return <Selection state={dojoState} updateState={updateState} onNext={() => setScreen(AppScreen.EVALUATION)} />;
      case AppScreen.EVALUATION:
        return <Evaluation state={dojoState} updateState={updateState} onFinish={() => setScreen(AppScreen.RESULTS)} />;
      case AppScreen.RESULTS:
        return <Results state={dojoState} updateState={updateState} onContinue={() => setScreen(AppScreen.SELECTION)} onFinish={() => setScreen(AppScreen.DASHBOARD)} />;
      default:
        return <DojoProfile state={dojoState} updateState={updateState} onNext={() => setScreen(AppScreen.DASHBOARD)} />;
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated && !isDevMode) {
    return <Login onDevBypass={() => setIsDevMode(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header 
        currentScreen={screen} 
        setScreen={setScreen} 
        isTrial={dojoState.isTrial} 
        onLogout={handleLogout}
      />
      
      {/* 
      {!isFirebaseConnected && (
         <div className="bg-blue-600 text-white text-xs text-center py-1 flex justify-center items-center gap-2 no-print">
            <Loader2 className="w-3 h-3 animate-spin" />
            Sincronizando...
         </div>
      )}
      */}
      
      <div className={`text-white text-xs text-center py-1 flex justify-center items-center gap-2 no-print ${isDevMode ? 'bg-gray-800' : 'bg-yellow-600'}`}>
         {isDevMode 
            ? "MODO DESENVOLVEDOR - Dados apenas locais (Não sincronizado)" 
            : "Modo Local (Offline) - Sincronização pausada para testes"}
      </div>

      <main className="flex-1 overflow-y-auto">
        {renderScreen()}
      </main>
      
      <footer className="bg-bushido-black text-gray-500 py-4 text-center text-xs no-print">
        <p>&copy; {new Date().getFullYear()} Bushido Graduation Manager</p>
      </footer>
    </div>
  );
};

export default App;