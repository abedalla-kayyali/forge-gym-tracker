export interface Achievement {
  id: string;
  name: string;
  unlocked_date?: string;
  description?: string;
}

export interface XPLevel {
  level: number;
  name: string;
  icon: string;
  minXP: number;
  maxXP: number;
}

export type Rank = 'rookie' | 'iron' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legend';
