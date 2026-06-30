import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text' | 'card';
  shimmer?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  variant = 'rect', 
  shimmer = true 
}) => {
  const baseClasses = cn(
    "relative overflow-hidden",
    variant === 'circle' && "rounded-full",
    variant === 'text' && "rounded-md h-4",
    variant === 'card' && "rounded-2xl",
    !variant || variant === 'rect' && "rounded-xl",
    className
  );

  // Premium gradient – light to slightly darker then back
  const gradientClass = shimmer
    ? "bg-gradient-to-r from-gray-100 via-gray-200/80 to-gray-100 bg-[length:200%_100%] animate-shimmer"
    : "bg-gray-100";

  return (
    <div className={cn(baseClasses, gradientClass)} />
  );
};

// Add this to your global CSS (e.g., index.css or tailwind.css):
/*

*/