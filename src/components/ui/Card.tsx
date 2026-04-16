import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  hoverable?: boolean;
}

export function Card({ children, className = '', padding = true, hoverable = false }: CardProps) {
  return (
    <div className={`card-elevated rounded-2xl transition-all duration-200 ${padding ? 'p-4' : ''} ${hoverable ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]' : ''} ${className}`}>
      {children}
    </div>
  );
}
