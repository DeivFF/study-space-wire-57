import React from 'react';

export interface FaIconProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  size?: number;
  color?: string;
}

export const FaIcon: React.FC<FaIconProps> = ({ icon: Icon, size = 16, color }) => {
  return <Icon size={size} color={color} />;
};

export default FaIcon;
