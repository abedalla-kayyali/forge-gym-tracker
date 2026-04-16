export interface BodyWeightEntry {
  date: string;
  weight_kg: number;
  notes?: string;
}

export interface Measurement {
  date: string;
  chest?: number;
  waist?: number;
  hips?: number;
  left_arm?: number;
  right_arm?: number;
  left_thigh?: number;
  right_thigh?: number;
  left_calf?: number;
  right_calf?: number;
  shoulders?: number;
  neck?: number;
  notes?: string;
}

export interface InBodyEntry {
  date: string;
  muscle_mass?: number;
  body_fat?: number;
  body_fat_pct?: number;
  water?: number;
  bmi?: number;
  notes?: string;
}

export interface BodyPhoto {
  id: string;
  date: string;
  dataUrl: string;
  type: 'front' | 'side' | 'back';
  notes?: string;
}
