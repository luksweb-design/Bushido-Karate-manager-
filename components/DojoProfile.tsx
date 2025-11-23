
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
      // Also sync the main exam config academy name if desired, or keep separate
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Branding */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white shadow-lg rounded-lg p-6 text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-4 font-jp">Logo do Dojo</h3>
            
            <div className="relative mx-auto w-48 h-48 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center overflow-hidden group mb-4">
              {state.dojoProfile.logoUrl ? (
                <img src={state.dojoProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-20 h-20 text-gray-300" />
              )}
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="w-10 h-10 text-white" />
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
              className="text-bushido-red font-semibold hover:underline text-sm"
            >
              Alterar Logomarca
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Esta logo será usada nos certificados e cabeçalhos.
            </p>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 relative overflow-visible">
             <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-2">
                 <BadgeCheck className="w-5 h-5 text-indigo-600" />
                 <h4 className="font-bold text-indigo-800">Bushido Pass</h4>
               </div>
               
               {/* Tooltip Bushido Pass */}
               <div className="relative group">
                  <HelpCircle className="w-4 h-4 text-indigo-400 cursor-help" />
                  <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg hidden group-hover:block z-20 pointer-events-none">
                     O ID é um código numérico de 6 dígitos encontrado no seu perfil do aplicativo Bushido Mobile.
                     <div className="absolute -bottom-1 right-1 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                  </div>
               </div>
             </div>
             
             <p className="text-xs text-indigo-700 mb-3">
               Integre seu dojo com a rede Bushido Pass para sincronização automática.
             </p>
             <input 
               type="text" 
               placeholder="ID (Ex: 123456)"
               className="w-full bg-white border border-indigo-200 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
               value={state.dojoProfile.bushidoPassId || ''}
               onChange={(e) => handleChange('bushidoPassId', e.target.value)}
             />
          </div>
        </div>

        {/* Right Column: Details Form */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-gray-900 px-6 py-4 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white font-jp">Dados Cadastrais</h2>
                <p className="text-gray-400 text-sm">Informações oficiais da academia.</p>
              </div>
              <Building2 className="text-gray-600 w-8 h-8" />
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Dojo / Academia *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2.5 focus:ring-bushido-red focus:border-bushido-red sm:text-sm"
                      placeholder="Ex: Bushido Kai Dojo"
                      value={state.dojoProfile.nome}
                      onChange={(e) => handleChange('nome', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                    CPF ou CNPJ
                    <span className="text-[10px] text-gray-400 font-normal bg-gray-100 px-2 py-0.5 rounded-full">Opcional</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2.5 focus:ring-bushido-red focus:border-bushido-red sm:text-sm"
                      placeholder="00.000.000/0001-00"
                      value={state.dojoProfile.documento}
                      onChange={(e) => handleChange('documento', e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Usado para conferir autenticidade jurídica nos certificados gerados.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website / Rede Social</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2.5 focus:ring-bushido-red focus:border-bushido-red sm:text-sm"
                      placeholder="instagram.com/seudojo"
                      value={state.dojoProfile.website || ''}
                      onChange={(e) => handleChange('website', e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Será gerado um QR Code no certificado apontando para este link.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2.5 focus:ring-bushido-red focus:border-bushido-red sm:text-sm"
                      placeholder="Rua do Karatê, 123 - Centro"
                      value={state.dojoProfile.endereco || ''}
                      onChange={(e) => handleChange('endereco', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de Contato</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      className="block w-full pl-10 bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2.5 focus:ring-bushido-red focus:border-bushido-red sm:text-sm"
                      placeholder="contato@dojo.com"
                      value={state.dojoProfile.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2.5 focus:ring-bushido-red focus:border-bushido-red sm:text-sm"
                      placeholder="(00) 90000-0000"
                      value={state.dojoProfile.telefone || ''}
                      onChange={(e) => handleChange('telefone', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button
                  onClick={onNext}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-bushido-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bushido-red transition-all"
                >
                  Salvar e Configurar Exame
                  <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
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
