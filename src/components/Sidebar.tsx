
import React, { useState } from 'react';
import Navigation from './Navigation';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const Sidebar = ({ activeSection, setActiveSection }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Navigation
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      isCollapsed={isCollapsed}
      onToggleCollapse={handleToggleCollapse}
    />
  );
};

export default Sidebar;
