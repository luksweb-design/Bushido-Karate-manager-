import React, { useState, useEffect, useRef } from 'react';
import { DojoState, AppScreen } from './types';
import { loadState, robustSave } from './services/storage';
import { initFirebaseSync, saveToFirestore } from './services/firebase';
import Header from './components/Header';
import StudentManager from './components/StudentManager';
import ExamConfigScreen from './components/ExamConfig';
import Selection from './components/Selection';
import Evaluation from './components/Evaluation';
import Results from './components/Results';
import DojoProfile from './components/DojoProfile';
import Settings from './components/Settings';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.DOJO);
  const [dojoState, setDojoState] = useState<DojoState>(loadState());
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  
  // Ref to prevent save loops (Local -> Remote -> Local -> Save again)
  const isRemoteUpdate = useRef(false);

  // 1. Initialize Firebase Sync on Mount
  useEffect(() => {
    const unsubscribe = initFirebaseSync((remoteData) => {
      // Mark this update as remote so we don't save it back immediately
      isRemoteUpdate.current = true;
      
      // Merge remote config with local state to preserve current session tweaks if needed,
      // but generally remote should win for synchronization.
      setDojoState(prev => ({
          ...prev,
          ...remoteData,
          // Preserve specific local UI states if any, otherwise full override
      }));
      
      setIsFirebaseConnected(true);
    });

    return () => {
       if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // 2. Persistence Effect (Local Storage + Firestore)
  useEffect(() => {
    // Save to Local Storage (Always, for offline capability)
    robustSave(dojoState);

    // Save to Firestore (Debounced, only if not a remote update)
    if (!isRemoteUpdate.current) {
        const timeout = setTimeout(() => {
            saveToFirestore(dojoState);
        }, 1000); // 1 second debounce
        return () => clearTimeout(timeout);
    } else {
        // Reset flag for next local change
        isRemoteUpdate.current = false;
    }
  }, [dojoState]);

  const updateState = (newState: DojoState) => {
    setDojoState(newState);
  };

  const renderScreen = () => {
    switch (screen) {
      case AppScreen.DOJO:
        return (
          <DojoProfile
            state={dojoState}
            updateState={updateState}
            onNext={() => setScreen(AppScreen.DASHBOARD)}
          />
        );
      case AppScreen.SETTINGS:
        return (
          <Settings
            state={dojoState}
            updateState={updateState}
          />
        );
      case AppScreen.DASHBOARD:
        return (
          <ExamConfigScreen 
            state={dojoState} 
            updateState={updateState} 
            onNext={() => setScreen(AppScreen.STUDENTS)} 
          />
        );
      case AppScreen.STUDENTS:
        return (
          <StudentManager 
            state={dojoState} 
            updateState={updateState} 
            onNext={() => setScreen(AppScreen.SELECTION)} 
          />
        );
      case AppScreen.SELECTION:
        return (
          <Selection 
            state={dojoState} 
            updateState={updateState} 
            onNext={() => setScreen(AppScreen.EVALUATION)} 
          />
        );
      case AppScreen.EVALUATION:
        return (
          <Evaluation 
            state={dojoState} 
            updateState={updateState} 
            onFinish={() => setScreen(AppScreen.RESULTS)} 
          />
        );
      case AppScreen.RESULTS:
        return (
          <Results 
            state={dojoState} 
            updateState={updateState}
            onContinue={() => setScreen(AppScreen.SELECTION)}
            onFinish={() => setScreen(AppScreen.DASHBOARD)}
          />
        );
      default:
        return (
          <DojoProfile
            state={dojoState}
            updateState={updateState}
            onNext={() => setScreen(AppScreen.DASHBOARD)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header currentScreen={screen} setScreen={setScreen} isTrial={dojoState.isTrial} />
      
      {/* Cloud Sync Indicator */}
      {!isFirebaseConnected && (
         <div className="bg-blue-600 text-white text-xs text-center py-1 flex justify-center items-center gap-2 no-print">
            <Loader2 className="w-3 h-3 animate-spin" />
            Conectando ao banco de dados...
         </div>
      )}

      <main className="flex-1 overflow-y-auto">
        {renderScreen()}
      </main>
      {/* Persistent CTA for mobile if needed, or footer info */}
      <footer className="bg-bushido-black text-gray-500 py-4 text-center text-xs no-print">
        <p>&copy; {new Date().getFullYear()} Bushido Manager. Oss!</p>
      </footer>
    </div>
  );
};

export default App;