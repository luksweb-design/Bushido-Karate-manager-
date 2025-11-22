
import React, { useState } from 'react';
import { AppScreen } from '../types';
import { Menu, Shield, Users, CheckSquare, Award, Settings, X, Home, Landmark, Sliders, ClipboardList } from 'lucide-react';

interface HeaderProps {
  currentScreen: AppScreen;
  setScreen: (s: AppScreen) => void;
  isTrial: boolean;
}

const Header: React.FC<HeaderProps> = ({ currentScreen, setScreen, isTrial }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { screen: AppScreen.DOJO, label: 'Meu Dojo', icon: Landmark },
    { screen: AppScreen.SETTINGS, label: 'Configurações', icon: Settings }, // Ícone de Engrenagem para Configurações Gerais
    { screen: AppScreen.DASHBOARD, label: 'Dados do Exame', icon: ClipboardList }, // Ícone de Prancheta para o Evento
    { screen: AppScreen.STUDENTS, label: 'Alunos', icon: Users },
    { screen: AppScreen.SELECTION, label: 'Seleção', icon: CheckSquare },
    { screen: AppScreen.EVALUATION, label: 'Avaliação', icon: Shield },
    { screen: AppScreen.RESULTS, label: 'Resultados', icon: Award },
  ];

  const handleNavClick = (screen: AppScreen) => {
    setScreen(screen);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Navbar */}
      <header className="bg-bushido-black text-white shadow-lg sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Area */}
            <div className="flex items-center gap-2 z-50 cursor-pointer" onClick={() => setScreen(AppScreen.DOJO)}>
              <div className="bg-bushido-red p-1.5 rounded">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                  <h1 className="text-xl font-bold font-jp tracking-wider">BUSHIDO</h1>
                  <p className="text-xs text-gray-400 -mt-1 uppercase tracking-widest">Manager</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-1 overflow-x-auto">
              {navItems.map((item) => (
                <button
                  key={item.screen}
                  onClick={() => setScreen(item.screen)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                    currentScreen === item.screen
                      ? 'bg-bushido-dark text-bushido-red border-b-2 border-bushido-red'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden z-50">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-300 hover:text-white p-2 focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <X className="h-7 w-7" />
                ) : (
                  <Menu className="h-7 w-7" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar / Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar / Drawer Content */}
      <div 
        className={`fixed inset-y-0 left-0 w-64 bg-bushido-black z-50 transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl border-r border-gray-800 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center px-6 border-b border-gray-800 bg-bushido-dark">
            <span className="text-white font-jp font-bold text-lg tracking-wider">MENU</span>
          </div>

          {/* Sidebar Links */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.screen}
                onClick={() => handleNavClick(item.screen)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                  currentScreen === item.screen
                    ? 'bg-bushido-red text-white shadow-lg'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 text-gray-500 px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs uppercase tracking-widest">Sistema Online</span>
            </div>
            <p className="text-xs text-gray-600 text-center mt-4">v1.2.0 Beta</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
