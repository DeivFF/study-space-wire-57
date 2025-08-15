
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  ChevronLeft,
  Menu,
  Target,
  HelpCircle,
  Music,
  Play,
  Tag,
  Users
} from 'lucide-react';

interface NavigationProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Navigation = ({ activeSection, setActiveSection, isCollapsed, onToggleCollapse }: NavigationProps) => {
  const navigate = useNavigate();
  const menuItems = [
    { id: 'resumos', label: 'Resumos', icon: FileText },
    { id: 'aulas', label: 'Aulas', icon: Play },
    { id: 'questoes', label: 'Questões', icon: HelpCircle },
    { id: 'audios', label: 'Áudios', icon: Music },
    { id: 'estatisticas', label: 'Estatísticas', icon: BarChart3 },
    { id: 'plano-estudos', label: 'Plano de Estudos', icon: Target },
    { id: 'topicos', label: 'Tópicos', icon: Tag },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <nav className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="p-4 flex-grow">
        <div className="relative mb-8 flex items-center">
          <div className="flex-grow flex justify-center">
            {!isCollapsed && (
              <img
                src="/logo.svg"
                alt="CNU Study logo"
                className="h-[2.8rem] w-auto"
              />
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => handleNavigate('/sala-de-estudos-avancada')}
          className={`w-full flex items-center px-3 py-2 rounded-lg transition-all text-gray-700 hover:bg-gray-50 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
          title={isCollapsed ? "Minhas salas" : undefined}
        >
          <Users className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
          {!isCollapsed && (
            <span className="font-medium">Minhas salas</span>
          )}
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
