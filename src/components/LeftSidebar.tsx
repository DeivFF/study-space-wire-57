
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  Activity,
  Settings,
  LogOut,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

// Avatar options mapping (same as in OnboardingModal)
 const avatarOptions = [
   { id: 'a1', bg: '#FEE2E2', fg: '#991B1B', emoji: '😀' },
   { id: 'a2', bg: '#E0F2FE', fg: '#075985', emoji: '😎' },
   { id: 'a3', bg: '#ECFDF5', fg: '#065F46', emoji: '👋' },
   { id: 'a4', bg: '#FFF7ED', fg: '#9A3412', emoji: '✨' },
   { id: 'a5', bg: '#EEF2FF', fg: '#3730A3', emoji: '👩‍🎓' },
   { id: 'a6', bg: '#FAE8FF', fg: '#86198F', emoji: '👾' },
   { id: 'a7', bg: '#F0FDFA', fg: '#155E75', emoji: '🤩' },
   { id: 'a8', bg: '#F5F5F4', fg: '#1C1917', emoji: '💻' },
   { id: 'a9', bg: '#E9D5FF', fg: '#6B21A8', emoji: '🔥' },
   { id: 'a10', bg: '#DCFCE7', fg: '#166534', emoji: '🌱' },
   { id: 'a11', bg: '#FFE4E6', fg: '#9F1239', emoji: '💜' },
   { id: 'a12', bg: '#E2E8F0', fg: '#0F172A', emoji: '🔍' }
 ];

 // Function to get emoji for avatar ID
 const getAvatarEmoji = (avatarId: string) => {
   const avatar = avatarOptions.find(option => option.id === avatarId);
   return avatar ? avatar.emoji : '👤';
 };

export function LeftSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:bg-app-muted rounded-lg p-2 transition-colors">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  {user?.avatarUrl ? (
                    // Check if avatarUrl is an ID (starts with 'a') or a real URL
                    user.avatarUrl.startsWith('a') ? (
                      // It's an avatar ID, render the emoji avatar
                      <div className="w-full h-full rounded-full flex items-center justify-center bg-app-accent text-white text-lg">
                        {getAvatarEmoji(user.avatarUrl)}
                      </div>
                    ) : (
                      // It's a URL, use AvatarImage
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                    )
                  ) : (
                    <AvatarFallback className="bg-app-accent text-white text-sm">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-app-text">
                    {user?.nickname || user?.name || 'Usuário'}
                  </span>
                  <span className="text-xs text-app-text-muted">
                    {user?.email}
                  </span>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-app-text-muted" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => navigate('/meu-perfil')}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => navigate('/calendario')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span>Calendário</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => navigate('/configuracoes')}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-app-danger focus:text-app-danger"
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
