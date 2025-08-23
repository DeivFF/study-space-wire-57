
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter
} from "@/components/ui/sidebar";
import { 
  Navigation, 
  HelpCircle, 
  GraduationCap, 
  Users, 
  BookOpen,
  User,
  ChevronDown,
  Compass,
  MessageCircle,
  Activity
} from 'lucide-react';

const menuItems = [
  {
    title: "Navegação",
    icon: Navigation,
    path: "/navegacao"
  },
  {
    title: "Questões",
    icon: HelpCircle,
    path: "/questoes"
  },
  {
    title: "Aulas",
    icon: GraduationCap,
    path: "/aulas"
  },
  {
    title: "Amigos",
    icon: Users,
    path: "/amigos"
  },
  {
    title: "Resumos",
    icon: BookOpen,
    path: "/"
  }
];

const explorarItems = [
  {
    title: "Sala de Estudo",
    icon: BookOpen,
    path: "/sala-estudo"
  },
  {
    title: "Comunidades",
    icon: Users,
    path: "/comunidades"
  },
  {
    title: "Feed",
    icon: Activity,
    path: "/feed"
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
    <Sidebar side="left" className="w-64">
      <SidebarContent className="bg-app-bg-soft border-r border-app-border">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={isActive(item.path)}
                    className={`
                      w-full justify-start px-4 py-3 text-left font-medium transition-colors
                      ${isActive(item.path) 
                        ? 'bg-app-accent/10 text-app-accent rounded-lg' 
                        : 'text-app-text hover:bg-app-muted rounded-lg'
                      }
                    `}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.title}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Botão Explorar */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setExplorarOpen(!explorarOpen)}
                  isActive={isExplorarActive}
                  className={`
                    w-full justify-start px-4 py-3 text-left font-medium transition-colors
                    ${isExplorarActive 
                      ? 'bg-app-accent/10 text-app-accent rounded-lg' 
                      : 'text-app-text hover:bg-app-muted rounded-lg'
                    }
                  `}
                >
                  <Compass className="mr-3 h-5 w-5" />
                  Explorar
                  <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${explorarOpen ? 'rotate-180' : ''}`} />
                </SidebarMenuButton>
                
                {/* Submenu Explorar */}
                {explorarOpen && (
                  <div className="ml-6 mt-1 space-y-1">
                    {explorarItems.map((item) => (
                      <SidebarMenuButton
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        isActive={isActive(item.path)}
                        className={`
                          w-full justify-start px-4 py-2 text-left text-sm transition-colors
                          ${isActive(item.path) 
                            ? 'bg-app-accent/10 text-app-accent rounded-lg' 
                            : 'text-app-text-muted hover:bg-app-muted rounded-lg'
                          }
                        `}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.title}
                      </SidebarMenuButton>
                    ))}
                  </div>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-app-border bg-app-bg-soft p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-app-text-muted" />
            <span className="text-sm font-medium text-app-text">Usuario</span>
          </div>
          <ChevronDown className="h-4 w-4 text-app-text-muted" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
