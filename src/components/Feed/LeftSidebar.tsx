import { Home, Users, Layers, Calendar, BarChart3, Star, TrendingUp } from 'lucide-react';

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeftSidebar({ isOpen, onClose }: LeftSidebarProps) {
  const navItems = [
    { icon: Home, label: 'Feed', active: true },
    { icon: Layers, label: 'Flashcards' },
    { icon: Calendar, label: 'Calendário' },
    { icon: BarChart3, label: 'Estatísticas' },
    { icon: Star, label: 'Favoritos' },
  ];

  const trendingTags = ['#Direito', '#Matemática', '#Medicina', '#TI', '#Redação'];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-64 bg-app-panel border-r border-app-border z-50 lg:z-auto
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        pt-16 lg:pt-0
      `}>
        <div className="p-4 h-full overflow-y-auto">
          <nav className="space-y-1 mb-6">
            {navItems.map((item) => (
              <div
                key={item.label}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors
                  ${item.active 
                    ? 'bg-app-muted text-app-accent' 
                    : 'text-app-text hover:bg-app-muted'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </nav>
          
          <div className="bg-app-bg-soft border border-app-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-app-text">Tendências</h3>
              <TrendingUp className="w-4 h-4 text-app-text-muted" />
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-app-muted text-app-text text-sm rounded-full cursor-pointer hover:bg-app-accent hover:text-white transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}