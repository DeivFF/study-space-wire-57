
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  HelpCircle,
  Users,
  BookOpen,
  ChevronDown,
  Compass,
  MessageCircle,
  Activity
} from 'lucide-react';

const menuItems = [
  {
    title: "Questões",
    icon: HelpCircle,
    path: "/questoes"
  },
  {
    title: "Resumos",
    icon: BookOpen,
    path: "/"
  }
];

const explorarItems = [
  {
    title: "Comunidades",
    icon: Users,
    path: "/comunidades"
  },
  {
    title: "Feed",
    icon: Activity,
    path: "/feed"
  },
  {
    title: "Sala",
    icon: MessageCircle,
    path: "/sala"
  }
];


export function LeftSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [explorarOpen, setExplorarOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    return location.pathname === path;
  };

  const isExplorarActive = explorarItems.some(item => isActive(item.path));

  return (
    <div className="w-64 bg-app-bg-soft border-r border-app-border h-full">
      <div className="p-4">
        <div className="space-y-1">
              {menuItems.map((item) => (
                <div key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`
                      w-full justify-start px-4 py-3 text-left font-medium transition-colors flex items-center
                      ${isActive(item.path) 
                        ? 'bg-app-accent/10 text-app-accent rounded-lg' 
                        : 'text-app-text hover:bg-app-muted rounded-lg'
                      }
                    `}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.title}
                  </button>
                </div>
              ))}
              
              {/* Botão Explorar */}
              <div>
                <button
                  onClick={() => setExplorarOpen(!explorarOpen)}
                  className={`
                    w-full justify-start px-4 py-3 text-left font-medium transition-colors flex items-center
                    ${isExplorarActive 
                      ? 'bg-app-accent/10 text-app-accent rounded-lg' 
                      : 'text-app-text hover:bg-app-muted rounded-lg'
                    }
                  `}
                >
                  <Compass className="mr-3 h-5 w-5" />
                  Explorar
                  <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${explorarOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Submenu Explorar */}
                {explorarOpen && (
                  <div className="ml-6 mt-1 space-y-1">
                    {explorarItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`
                          w-full justify-start px-4 py-2 text-left text-sm transition-colors flex items-center
                          ${isActive(item.path) 
                            ? 'bg-app-accent/10 text-app-accent rounded-lg' 
                            : 'text-app-text-muted hover:bg-app-muted rounded-lg'
                          }
                        `}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
        </div>
      </div>
    </div>
  );
}
