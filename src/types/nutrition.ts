export interface Meal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings?: number;
}

export interface DayMeals {
  meals: Meal[];
}

export type MealsLog = Record<string, DayMeals>;
export type MealLibrary = Record<string, Meal>;

export interface MacroTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  target_date?: string;
}

export interface WaterLog {
  cups_drunk: number;
  goal_cups: number;
}

export type WaterHistory = Record<string, WaterLog>;
