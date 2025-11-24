import React, { useRef } from 'react';
import { DojoState } from '../types';
import { ArrowRight, Camera, Building2, CreditCard, MapPin, Mail, Phone, BadgeCheck, Globe, HelpCircle } from 'lucide-react';

interface Props {
  state: DojoState;
  updateState: (s: DojoState) => void;
  onNext: () => void;
}

const DojoProfile: React.FC<Props> = ({ state, updateState, onNext }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: string, value: string) => {
    updateState({
      ...state,
      dojoProfile: { ...state.dojoProfile, [field]: value },
      config: field === 'nome' ? { ...state.config, academia: value } : state.config
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Branding */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-bushido-card border border-white/5 shadow-2xl p-8 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-bushido-gold"></div>
            
            <h3 className="text-2xl font-display font-bold text-white mb-6 uppercase tracking-wider">Identidade</h3>
            
            <div className="relative mx-auto w-48 h-48 bg-bushido-surface border-2 border-white/10 flex items-center justify-center overflow-hidden mb-8 shadow-inner transform rotate-3 transition-transform group-hover:rotate-0">
              {state.dojoProfile.logoUrl ? (
                <img src={state.dojoProfile.logoUrl} alt="Logo" className="w-full h-full object-contain p-4" />
              ) : (
                <Building2 className="w-20 h-20 text-gray-800" />
              )}
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
              >
                <Camera className="w-10 h-10 text-bushido-gold" />
              </div>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleLogoUpload} 
              accept="image/*" 
              className="hidden" 
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="btn-blade bg-bushido-surface border border-white/10 text-gray-300 hover:text-white hover:border-bushido-gold w-full py-3 font-bold uppercase tracking-wider text-sm"
            >
              <span>Upload Logo</span>
            </button>
            <p className="text-[10px] text-gray-600 mt-3 font-mono uppercase">
              Formato PNG Transparente
            </p>
          </div>

          <div className="bg-gradient-to-br from-bushido-surface to-black border border-indigo-900/30 p-6 relative overflow-hidden">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <BadgeCheck className="w-5 h-5 text-indigo-500" />
                 <h4 className="font-display font-bold text-indigo-400 tracking-wider text-sm">BUSHIDO PASS</h4>
               </div>
               <HelpCircle className="w-4 h-4 text-gray-700 cursor-help" />
             </div>
             
             <p className="text-[10px] text-gray-500 mb-4 leading-relaxed uppercase tracking-wide">
               Sincronização com a rede Bushido.
             </p>
             <input 
               type="text" 
               placeholder="ID DO DOJO (Ex: 123456)"
               className="w-full bg-black/50 border border-indigo-900/50 rounded-none text-indigo-200 py-3 px-4 text-xs font-mono focus:border-indigo-500 focus:outline-none"
               value={state.dojoProfile.bushidoPassId || ''}
               onChange={(e) => handleChange('bushidoPassId', e.target.value)}
             />
          </div>
        </div>

        {/* Right Column: Details Form */}
        <div className="lg:col-span-2">
          <div className="bg-bushido-card border border-white/5 shadow-2xl relative">
            <div className="bg-bushido-surface px-8 py-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-display font-bold text-white uppercase tracking-wider">Dados Cadastrais</h2>
                <p className="text-bushido-gold text-xs font-bold uppercase tracking-[0.2em] mt-1">Informações Oficiais</p>
              </div>
              <Building2 className="text-bushido-red w-8 h-8 opacity-40 transform -skew-x-12" />
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Nome do Dojo / Academia <span className="text-bushido-red">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-600" />
                    </div>
                    <input
                      type="text"
                      className="input-bushido block w-full pl-10 py-4 font-display text-lg uppercase tracking-wide"
                      placeholder="Ex: BUSHIDO KAI DOJO"
                      value={state.dojoProfile.nome}
                      onChange={(e) => handleChange('nome', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center justify-between">
                    CPF ou CNPJ
                    <span className="text-[9px] text-gray-700 border border-gray-800 px-1 rounded">OPCIONAL</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-gray-600" />
                    </div>
                    <input
                      type="text"
                      className="input-bushido block w-full pl-10 py-3 text-sm font-mono tracking-wide"
                      placeholder="00.000.000/0001-00"
                      value={state.dojoProfile.documento}
                      onChange={(e) => handleChange('documento', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Website / Social</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-gray-600" />
                    </div>
                    <input
                      type="text"
                      className="input-bushido block w-full pl-10 py-3 text-sm"
                      placeholder="instagram.com/seudojo"
                      value={state.dojoProfile.website || ''}
                      onChange={(e) => handleChange('website', e.target.value)}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Endereço Completo</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-600" />
                    </div>
                    <input
                      type="text"
                      className="input-bushido block w-full pl-10 py-3 text-sm uppercase"
                      placeholder="LOGRADOURO, NÚMERO - BAIRRO, CIDADE"
                      value={state.dojoProfile.endereco || ''}
                      onChange={(e) => handleChange('endereco', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">E-mail de Contato</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-600" />
                    </div>
                    <input
                      type="email"
                      className="input-bushido block w-full pl-10 py-3 text-sm"
                      placeholder="contato@dojo.com"
                      value={state.dojoProfile.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Telefone / WhatsApp</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-600" />
                    </div>
                    <input
                      type="text"
                      className="input-bushido block w-full pl-10 py-3 text-sm"
                      placeholder="(00) 90000-0000"
                      value={state.dojoProfile.telefone || ''}
                      onChange={(e) => handleChange('telefone', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 flex justify-end">
                <button
                  onClick={onNext}
                  className="btn-blade bg-bushido-red hover:bg-bushido-red-dark text-white px-10 py-4 font-display font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center gap-3 transition-all"
                >
                  <span>Salvar e Avançar</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DojoProfile;