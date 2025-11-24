import React, { useState } from 'react';
import { AppScreen } from '../types';
import { Menu, Shield, Users, CheckSquare, Award, Settings, X, LogOut, Landmark, ClipboardList } from 'lucide-react';

interface HeaderProps {
  currentScreen: AppScreen;
  setScreen: (s: AppScreen) => void;
  isTrial: boolean;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentScreen, setScreen, isTrial, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { screen: AppScreen.DOJO, label: 'DOJO', icon: Landmark },
    { screen: AppScreen.SETTINGS, label: 'CONFIG', icon: Settings },
    { screen: AppScreen.DASHBOARD, label: 'EXAME', icon: ClipboardList },
    { screen: AppScreen.STUDENTS, label: 'ALUNOS', icon: Users },
    { screen: AppScreen.SELECTION, label: 'SELEÇÃO', icon: CheckSquare },
    { screen: AppScreen.EVALUATION, label: 'AVALIAÇÃO', icon: Shield },
    { screen: AppScreen.RESULTS, label: 'RESULTADOS', icon: Award },
  ];

  const handleNavClick = (screen: AppScreen) => {
    setScreen(screen);
    setIsMobileMenuOpen(false);
  };

  const handleLogoutClick = async () => {
    if (confirm("Deseja sair do sistema?")) {
      onLogout();
    }
  };

  return (
    <>
      <header className="bg-bushido-black/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            {/* Logo Area */}
            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setScreen(AppScreen.DOJO)}>
              <div className="bg-gradient-to-br from-bushido-red to-red-900 p-2.5 transform -skew-x-12 border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.3)] group-hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] transition-all">
                <Shield className="h-7 w-7 text-white transform skew-x-12" />
              </div>
              <div className="flex flex-col">
                  <h1 className="text-3xl font-display font-bold tracking-[0.1em] text-white leading-none">BUSHIDO</h1>
                  <div className="flex items-center gap-2">
                     <span className="h-[2px] w-6 bg-bushido-red"></span>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">Manager</p>
                  </div>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.screen}
                  onClick={() => setScreen(item.screen)}
                  className={`relative px-5 py-2.5 text-sm font-display font-bold tracking-wider uppercase transition-all flex items-center gap-2 overflow-hidden group transform hover:-skew-x-12 ${
                    currentScreen === item.screen
                      ? 'text-white'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {/* Background Hover Effect */}
                  <span className={`absolute inset-0 bg-bushido-red/10 transform transition-transform duration-200 origin-bottom ${
                    currentScreen === item.screen ? 'scale-y-100 skew-x-12 border-b-2 border-bushido-red' : 'scale-y-0 group-hover:scale-y-100 group-hover:skew-x-12'
                  }`}></span>
                  
                  <item.icon className={`w-4 h-4 relative z-10 ${currentScreen === item.screen ? 'text-bushido-red' : ''}`} />
                  <span className="relative z-10">{item.label}</span>
                </button>
              ))}
              <div className="h-6 w-px bg-white/10 mx-4 rotate-12"></div>
              <button 
                onClick={handleLogoutClick}
                className="text-gray-500 hover:text-bushido-red transition-colors p-2 hover:bg-white/5 rounded transform hover:-skew-x-12"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </nav>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-8 w-8" />
                ) : (
                  <Menu className="h-8 w-8" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div 
        className={`fixed inset-y-0 right-0 w-80 bg-bushido-black border-l border-white/10 z-50 transform transition-transform duration-300 ease-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full bg-noise">
          <div className="h-24 flex items-center justify-between px-8 border-b border-white/5">
             <span className="text-white font-display font-bold text-2xl tracking-widest uppercase">Menu</span>
             <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500"><X/></button>
          </div>

          <nav className="flex-1 px-6 py-8 space-y-4 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.screen}
                onClick={() => handleNavClick(item.screen)}
                className={`w-full btn-blade flex items-center gap-4 px-6 py-5 text-lg font-display font-bold uppercase tracking-wider ${
                  currentScreen === item.screen
                    ? 'bg-bushido-red text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] border-none'
                    : 'bg-bushido-surface text-gray-500 border border-white/5'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-8 border-t border-white/5 bg-bushido-surface">
             <button 
                onClick={handleLogoutClick}
                className="w-full btn-blade bg-black border border-red-900/30 text-red-500 hover:text-white hover:bg-red-900/50 py-4 flex items-center justify-center gap-3 font-display font-bold uppercase tracking-widest text-sm"
              >
                <LogOut className="w-4 h-4" /> <span>Encerrar Sessão</span>
             </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;