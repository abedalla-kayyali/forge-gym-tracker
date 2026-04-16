export interface DuelState {
  opponent: string;
  score: number;
  opponentScore?: number;
  end_date: string;
  type?: string;
  status?: 'active' | 'completed' | 'expired';
}

export interface CommunityItem {
  id: string;
  type: 'exercise' | 'meal';
  name: string;
  data: Record<string, unknown>;
  author?: string;
  created_at?: string;
}
