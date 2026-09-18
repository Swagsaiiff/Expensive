import React from 'react';
import {
  Utensils,
  Bus,
  Receipt,
  ShoppingCart,
  ShoppingBag,
  Film,
  Laptop,
  Smartphone,
  HeartPulse,
  GraduationCap,
  Plane,
  Coffee,
  Users,
  Gift,
  PiggyBank,
  MoreHorizontal,
  DollarSign,
  Tag,
  CreditCard,
  Briefcase,
  LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Bus,
  Receipt,
  ShoppingCart,
  ShoppingBag,
  Film,
  Laptop,
  Smartphone,
  HeartPulse,
  GraduationCap,
  Plane,
  Coffee,
  Users,
  Gift,
  PiggyBank,
  MoreHorizontal,
  DollarSign,
  Tag,
  CreditCard,
  Briefcase,
};

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', size = 20 }) => {
  const IconComponent = ICON_MAP[name] || Tag;
  return <IconComponent className={className} size={size} />;
};
