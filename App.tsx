import React, { useState, useEffect } from 'react';
import { DojoState, AppScreen } from './types';
import { loadState, robustSave } from './services/storage';
import { auth, signOut } from './services/firebase';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { robustSave(dojoState); }, [dojoState]);

  const updateState = (newState: DojoState) => setDojoState(newState);
  const handleLogout = async () => { if(isDevMode) setIsDevMode(false); else await signOut(auth); };

  const renderScreen = () => {
    switch (screen) {
      case AppScreen.DOJO: return <DojoProfile state={dojoState} updateState={updateState} onNext={() => setScreen(AppScreen.DASHBOARD)} />;
      case AppScreen.SETTINGS: return <Settings state={dojoState} updateState={updateState} />;
      case AppScreen.DASHBOARD: return <ExamConfigScreen state={dojoState} updateState={updateState} onNext={() => setScreen(AppScreen.STUDENTS)} />;
      case AppScreen.STUDENTS: return <StudentManager state={dojoState} updateState={updateState} onNext={() => setScreen(AppScreen.SELECTION)} />;
      case AppScreen.SELECTION: return <Selection state={dojoState} updateState={updateState} onNext={() => setScreen(AppScreen.EVALUATION)} />;
      case AppScreen.EVALUATION: return <Evaluation state={dojoState} updateState={updateState} onFinish={() => setScreen(AppScreen.RESULTS)} />;
      case AppScreen.RESULTS: return <Results state={dojoState} updateState={updateState} onContinue={() => setScreen(AppScreen.SELECTION)} onFinish={() => setScreen(AppScreen.DASHBOARD)} />;
      default: return <DojoProfile state={dojoState} updateState={updateState} onNext={() => setScreen(AppScreen.DASHBOARD)} />;
    }
  };

  if (isLoadingAuth) return <div className="min-h-screen bg-bushido-black flex items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin text-bushido-red" /></div>;
  if (!isAuthenticated && !isDevMode) return <Login onDevBypass={() => setIsDevMode(true)} />;

  return (
    <div className="min-h-screen bg-bushido-black bg-noise text-gray-100 flex flex-col font-sans selection:bg-bushido-red selection:text-white overflow-hidden">
      <Header currentScreen={screen} setScreen={setScreen} isTrial={dojoState.isTrial} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-bushido-red scrollbar-track-bushido-surface">
        <div className="fixed inset-0 bg-gradient-to-b from-bushido-black/0 via-bushido-black/50 to-bushido-black pointer-events-none -z-10" />
        {renderScreen()}
      </main>
    </div>
  );
};
export default App;