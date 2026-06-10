export const STORAGE_KEYS = {
  // Workout data
  WORKOUTS: 'forge_workouts',
  BW_WORKOUTS: 'forge_bw_workouts',
  CARDIO: 'forge_cardio',
  TEMPLATES: 'forge_templates',

  // Profile & settings
  PROFILE: 'forge_profile',
  SETTINGS: 'forge_settings',
  THEME: 'forge_theme',
  ACCENT: 'forge_accent',
  LANG: 'forge_lang',
  SOUND: 'forge_sound',
  HAPTIC: 'forge_haptic',
  LAYOUT: 'forge_layout',
  CUSTOM_BG: 'forge_custom_bg',
  DNN: 'forge_dnn',

  // Body & measurements
  BODY_WEIGHT: 'forge_bodyweight',
  MEASUREMENTS: 'forge_measurements',
  INBODY: 'forge_inbody_tests',

  // Nutrition
  MEALS: 'forge_meals',
  MEAL_LIBRARY: 'forge_meal_library',
  MACRO_TARGETS: 'forge_macro_targets',
  WATER: 'forge_water',

  // Steps & health
  STEPS: 'forge_steps',
  STEP_GOAL: 'forge_step_goal',
  WEEKLY_GOAL: 'forge_weekly_goal',
  /** Extra goal targets (target weight, direction, protein) — weekly sessions
   *  stays under WEEKLY_GOAL for backward compat. */
  GOALS: 'forge_goals',
  READINESS: 'forge_readiness',
  READINESS_TODAY: 'forge_readiness_today',
  CHECKINS: 'forge_checkins',

  // Coach & programs
  ACTIVE_PROGRAM: 'forge_active_program',
  AI_PROGRAM: 'forge_ai_program',
  SPLIT: 'forge_split',
  MESOCYCLE: 'forge_mesocycle',
  MRV_CONFIG: 'forge_mrv_config',
  DELOAD_DATA: 'forge_deload_data',
  LAST_DEBRIEF: 'forge_last_debrief',

  // Social
  DUEL_STATE: 'forge_duel_state_v2',

  // Gamification
  ACHIEVEMENTS: 'forge_achievements',
  EXPERIENCE: 'forge_experience',
  GOAL: 'forge_goal',

  // Custom user content
  BW_CUSTOM_EXERCISES: 'forge_bw_custom_exercises',
  CARDIO_CUSTOM_TYPES: 'forge_cardio_custom_types',
  SAVED_ANSWERS: 'forge_saved_answers',

  // Active session (device-local, transient — never synced to cloud)
  ACTIVE_SESSION: 'forge_active_session',

  // Flags & meta
  GUEST: 'forge_guest',
  ONBOARDING_DONE: 'forge_onboarding_v238_done',
  SCHEMA_VERSION: 'forge_schema_version',
  PROGRESS_CARD_LAST: 'forge_progress_card_last_sunday',
  DITTO_TIP_SHOWN: 'forge_ditto_tip_shown',
  FEATURE_TIPS_SHOWN: 'forge_feature_tips_shown',
  REENGAGEMENT_SHOWN: 'forge_reengagement_shown',

  // Profile name variants (legacy)
  NAME: 'forge_name',
  USERNAME: 'forge_username',
  PROFILE_NAME: 'forge_profile_name',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
