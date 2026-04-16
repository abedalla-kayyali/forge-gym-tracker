export interface Exercise {
  name: string;
  muscle: string; // Capitalized: 'Chest', 'Back', etc.
  equipment: string; // 'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'smith'
  tip: string;
}

export const EXERCISE_DB: Exercise[] = [
  // CHEST
  { name: 'Barbell Bench Press', muscle: 'Chest', equipment: 'barbell', tip: 'Lie flat, grip shoulder-width, lower to chest, drive up explosively' },
  { name: 'Dumbbell Bench Press', muscle: 'Chest', equipment: 'dumbbell', tip: 'Lie flat, dumbbells at chest level, press up and together' },
  { name: 'Incline Barbell Press', muscle: 'Chest', equipment: 'barbell', tip: '30–45° incline targets upper chest — keep elbows slightly tucked' },
  { name: 'Incline Dumbbell Press', muscle: 'Chest', equipment: 'dumbbell', tip: '30–45° incline, neutral or pronated grip, full stretch at bottom' },
  { name: 'Decline Bench Press', muscle: 'Chest', equipment: 'barbell', tip: 'Decline 15–30° targets lower chest, keep feet anchored' },
  { name: 'Cable Fly', muscle: 'Chest', equipment: 'cable', tip: 'Arms wide, arc hands together at chest height, feel pec stretch' },
  { name: 'Pec Deck / Machine Fly', muscle: 'Chest', equipment: 'machine', tip: 'Squeeze pecs hard at center, controlled return to stretch' },
  { name: 'Push-Up', muscle: 'Chest', equipment: 'bodyweight', tip: 'Hands shoulder-width, lower chest to floor, full lockout at top' },
  { name: 'Dip (Chest)', muscle: 'Chest', equipment: 'bodyweight', tip: 'Lean forward 30° to target chest more than triceps' },
  { name: 'Landmine Press', muscle: 'Chest', equipment: 'barbell', tip: 'Single-arm press with barbell anchored — great for upper chest' },

  // BACK
  { name: 'Barbell Deadlift', muscle: 'Back', equipment: 'barbell', tip: 'Hip hinge, flat back, bar over mid-foot, drive hips forward at lockout' },
  { name: 'Pull-Up', muscle: 'Back', equipment: 'bodyweight', tip: 'Overhand grip, pull chest to bar, full extension at bottom' },
  { name: 'Chin-Up', muscle: 'Back', equipment: 'bodyweight', tip: 'Underhand grip, elbows drive down and back, more bicep involvement' },
  { name: 'Barbell Row', muscle: 'Back', equipment: 'barbell', tip: 'Hinge at hips, row bar to lower chest, elbows back at 45°' },
  { name: 'Dumbbell Row', muscle: 'Back', equipment: 'dumbbell', tip: 'Knee and hand on bench, row to hip, keep shoulder down' },
  { name: 'Seated Cable Row', muscle: 'Back', equipment: 'cable', tip: 'Sit upright, pull handle to lower abdomen, squeeze shoulder blades' },
  { name: 'Lat Pulldown', muscle: 'Back', equipment: 'machine', tip: 'Wide overhand grip, pull bar to upper chest, lean slightly back' },
  { name: 'T-Bar Row', muscle: 'Back', equipment: 'barbell', tip: 'Straddle the bar, pull to lower chest, keep back flat' },
  { name: 'Face Pull', muscle: 'Back', equipment: 'cable', tip: 'Rope at head height, pull to face with elbows high — great for posture' },
  { name: 'Romanian Deadlift', muscle: 'Back', equipment: 'barbell', tip: 'Hip hinge with soft knees, bar stays close to legs, feel hamstring stretch' },

  // SHOULDERS
  { name: 'Barbell Overhead Press', muscle: 'Shoulders', equipment: 'barbell', tip: 'Press from front rack, bar moves in straight line overhead, lock out' },
  { name: 'Dumbbell Shoulder Press', muscle: 'Shoulders', equipment: 'dumbbell', tip: 'Seated or standing, press overhead from ear level, full lockout' },
  { name: 'Lateral Raise', muscle: 'Shoulders', equipment: 'dumbbell', tip: 'Slight forward lean, arms slightly bent, raise to shoulder height' },
  { name: 'Front Raise', muscle: 'Shoulders', equipment: 'dumbbell', tip: 'Arms straight, raise to shoulder height in front, controlled down' },
  { name: 'Arnold Press', muscle: 'Shoulders', equipment: 'dumbbell', tip: 'Rotate from neutral to pronated as you press — full shoulder activation' },
  { name: 'Cable Lateral Raise', muscle: 'Shoulders', equipment: 'cable', tip: 'Low cable, raise arm to side for constant tension throughout range' },
  { name: 'Upright Row', muscle: 'Shoulders', equipment: 'barbell', tip: 'Narrow grip, pull bar to chin, elbows lead throughout' },
  { name: 'Machine Shoulder Press', muscle: 'Shoulders', equipment: 'machine', tip: 'Seated, press handles overhead, adjust seat for 90° at bottom' },
  { name: 'Reverse Pec Deck', muscle: 'Shoulders', equipment: 'machine', tip: 'Seated facing pad, open arms wide — isolates rear delts' },
  { name: 'Band Pull-Apart', muscle: 'Shoulders', equipment: 'bodyweight', tip: 'Hold band at chest, pull apart to T shape — great rear delt activation' },
  { name: 'Cable Rear Delt Fly', muscle: 'Shoulders', equipment: 'cable', tip: 'Cross cables, pull apart with straight arms for rear delts' },
  { name: 'Machine Lateral Raise', muscle: 'Shoulders', equipment: 'machine', tip: 'Seated lateral raise machine — constant tension on medial delt' },

  // BICEPS
  { name: 'Barbell Curl', muscle: 'Biceps', equipment: 'barbell', tip: 'Elbows pinned at sides, curl to shoulders without swinging' },
  { name: 'Dumbbell Curl', muscle: 'Biceps', equipment: 'dumbbell', tip: 'Alternate or simultaneous, supinate wrist at top for full contraction' },
  { name: 'Hammer Curl', muscle: 'Biceps', equipment: 'dumbbell', tip: 'Neutral grip, targets brachialis and forearm alongside bicep' },
  { name: 'Preacher Curl', muscle: 'Biceps', equipment: 'barbell', tip: 'Arm pad isolates bicep — slow negative for max tension' },
  { name: 'Cable Curl', muscle: 'Biceps', equipment: 'cable', tip: 'Low pulley, constant tension through full range of motion' },
  { name: 'Concentration Curl', muscle: 'Biceps', equipment: 'dumbbell', tip: 'Seated, elbow on inner thigh, curl slowly for peak contraction' },
  { name: 'Incline Dumbbell Curl', muscle: 'Biceps', equipment: 'dumbbell', tip: 'Incline bench, arms hang behind body — great stretch at bottom' },

  // TRICEPS
  { name: 'Skull Crusher', muscle: 'Triceps', equipment: 'barbell', tip: 'Bar to forehead, elbows fixed, extend to full lockout' },
  { name: 'Tricep Pushdown', muscle: 'Triceps', equipment: 'cable', tip: 'Bar or rope, extend arms fully, elbows pinned at sides' },
  { name: 'Overhead Tricep Extension', muscle: 'Triceps', equipment: 'dumbbell', tip: 'Arm behind head, extend fully — great long head stretch' },
  { name: 'Close-Grip Bench Press', muscle: 'Triceps', equipment: 'barbell', tip: 'Narrow grip, lower to sternum, elbows tucked throughout' },
  { name: 'Dip (Tricep)', muscle: 'Triceps', equipment: 'bodyweight', tip: 'Stay upright to target triceps — lower until upper arm is parallel' },
  { name: 'Cable Overhead Extension', muscle: 'Triceps', equipment: 'cable', tip: 'Rope behind head, extend forward and down, squeeze at lockout' },

  // FOREARMS
  { name: 'Wrist Curl', muscle: 'Forearms', equipment: 'barbell', tip: 'Forearms on bench, palms up, curl wrists up through full flexion' },
  { name: 'Reverse Wrist Curl', muscle: 'Forearms', equipment: 'barbell', tip: 'Forearms on bench, palms down, extend wrists to work extensors' },
  { name: 'Farmer Carry', muscle: 'Forearms', equipment: 'dumbbell', tip: 'Heavy dumbbells, walk with tight grip and upright posture' },
  { name: 'Plate Pinch Hold', muscle: 'Forearms', equipment: 'barbell', tip: 'Pinch two plates together with fingers, hold for time' },
  { name: 'Behind-The-Back Wrist Curl', muscle: 'Forearms', equipment: 'barbell', tip: 'Bar behind back, curl wrists up without moving arms' },

  // CORE
  { name: 'Plank', muscle: 'Core', equipment: 'bodyweight', tip: 'Forearms on floor, straight line from head to heels, squeeze everything' },
  { name: 'Crunch', muscle: 'Core', equipment: 'bodyweight', tip: "Hands behind head, curl shoulders toward knees, don't pull neck" },
  { name: 'Leg Raise', muscle: 'Core', equipment: 'bodyweight', tip: 'Lying flat, raise straight legs to 90°, lower slowly without arching back' },
  { name: 'Russian Twist', muscle: 'Core', equipment: 'bodyweight', tip: 'Feet off floor, rotate torso side to side, add weight to progress' },
  { name: 'Ab Wheel Rollout', muscle: 'Core', equipment: 'bodyweight', tip: 'Kneel, roll forward until parallel with floor, pull back with abs' },
  { name: 'Cable Crunch', muscle: 'Core', equipment: 'cable', tip: 'Kneeling, pull rope down while crunching — keep hips stationary' },
  { name: 'Hanging Leg Raise', muscle: 'Core', equipment: 'bodyweight', tip: 'Hang from bar, raise legs to 90°, avoid swinging' },
  { name: 'Pallof Press', muscle: 'Core', equipment: 'cable', tip: 'Anti-rotation press — resist the cable pulling you sideways' },
  { name: 'Dead Bug', muscle: 'Core', equipment: 'bodyweight', tip: 'On back, opposite arm and leg extend simultaneously, keep low back flat' },
  { name: 'Hollow Body Hold', muscle: 'Core', equipment: 'bodyweight', tip: 'Lower back pressed to floor, arms and legs extended — hold position' },

  // LEGS
  { name: 'Barbell Back Squat', muscle: 'Legs', equipment: 'barbell', tip: 'Bar on upper back, squat below parallel, drive knees out over toes' },
  { name: 'Front Squat', muscle: 'Legs', equipment: 'barbell', tip: 'Bar on front delts, upright torso — great quad development' },
  { name: 'Goblet Squat', muscle: 'Legs', equipment: 'dumbbell', tip: 'Hold dumbbell at chest, squat deep, elbows track inside knees' },
  { name: 'Leg Press', muscle: 'Legs', equipment: 'machine', tip: 'Feet shoulder-width, lower to 90°, never lock knees at top' },
  { name: 'Hack Squat', muscle: 'Legs', equipment: 'machine', tip: 'Shoulder pads, feet forward on plate, squat deep for quad focus' },
  { name: 'Bulgarian Split Squat', muscle: 'Legs', equipment: 'dumbbell', tip: 'Rear foot elevated on bench, lower front knee, keep torso upright' },
  { name: 'Leg Extension', muscle: 'Legs', equipment: 'machine', tip: 'Extend legs fully, pause and squeeze quads at top, lower slowly' },
  { name: 'Leg Curl (Lying)', muscle: 'Legs', equipment: 'machine', tip: 'Lie prone, curl heels toward glutes, pause at top contraction' },
  { name: 'Leg Curl (Seated)', muscle: 'Legs', equipment: 'machine', tip: 'Seated version targets hamstrings with different stretch profile' },
  { name: 'Lunges', muscle: 'Legs', equipment: 'dumbbell', tip: 'Step forward, both knees at 90°, push through front heel to return' },
  { name: 'Walking Lunges', muscle: 'Legs', equipment: 'dumbbell', tip: 'Continuous alternating lunges forward — great for coordination and volume' },
  { name: 'Smith Machine Squat', muscle: 'Legs', equipment: 'smith', tip: 'Feet slightly forward, use the guided path for safe heavy loading' },
  { name: 'Pendulum Squat', muscle: 'Legs', equipment: 'machine', tip: 'Upright torso, deep range of motion — excellent quad isolation' },
  { name: 'Sissy Squat', muscle: 'Legs', equipment: 'bodyweight', tip: 'Lean back, raise heels, lower knees toward floor — brutal quad isolation' },
  { name: 'Adductor Machine', muscle: 'Legs', equipment: 'machine', tip: 'Seated hip adduction for inner-thigh volume and stability' },

  // GLUTES
  { name: 'Hip Thrust', muscle: 'Glutes', equipment: 'barbell', tip: 'Shoulders on bench, drive hips up, squeeze glutes hard at top' },
  { name: 'Romanian Deadlift (DB)', muscle: 'Glutes', equipment: 'dumbbell', tip: 'Hip hinge, feel hamstring stretch, drive hips forward to stand' },
  { name: 'Glute Bridge', muscle: 'Glutes', equipment: 'bodyweight', tip: 'Lie on back, feet flat, drive hips up squeezing glutes — add weight' },
  { name: 'Cable Kickback', muscle: 'Glutes', equipment: 'cable', tip: 'Standing or on all fours, kick leg back with full hip extension' },
  { name: 'Sumo Deadlift', muscle: 'Glutes', equipment: 'barbell', tip: 'Wide stance, toes out 45°, grip inside legs — great glute/adductor load' },
  { name: 'Step-Up', muscle: 'Glutes', equipment: 'dumbbell', tip: 'Step onto bench or box, drive through heel, fully extend hip at top' },
  { name: 'Abductor Machine', muscle: 'Glutes', equipment: 'machine', tip: 'Seated, push knees out against pads — targets glute med' },
  { name: 'Donkey Kick', muscle: 'Glutes', equipment: 'bodyweight', tip: 'On all fours, kick heel toward ceiling — squeeze glute at top' },
  { name: 'Cable Pull-Through', muscle: 'Glutes', equipment: 'cable', tip: 'Hip hinge with cable behind you — strong glute lockout without spinal load' },
  { name: 'Smith Hip Thrust', muscle: 'Glutes', equipment: 'smith', tip: 'Use the smith path for stable hip thrust loading and high-rep glute work' },

  // CALVES
  { name: 'Calf Raise (Standing)', muscle: 'Calves', equipment: 'machine', tip: 'Full ROM — deep stretch at bottom, pause at top, slow controlled reps' },
  { name: 'Calf Raise (Seated)', muscle: 'Calves', equipment: 'machine', tip: 'Seated targets soleus — slow controlled reps with full stretch' },

  // TRAPS
  { name: 'Barbell Shrug', muscle: 'Traps', equipment: 'barbell', tip: 'Pull shoulders straight up toward ears, pause at top, slow lower' },
  { name: 'Dumbbell Shrug', muscle: 'Traps', equipment: 'dumbbell', tip: 'Same as barbell shrug but allows more natural ROM' },
  { name: 'Behind-the-Back Shrug', muscle: 'Traps', equipment: 'barbell', tip: 'Bar behind glutes, shrug upward — targets lower traps' },
  { name: 'Trap Bar Carry', muscle: 'Traps', equipment: 'barbell', tip: 'Heavy loaded carries with trap bar to build traps, grip, and posture under load' },
  { name: 'Cable Upright Row', muscle: 'Traps', equipment: 'cable', tip: 'Low cable, narrow grip, pull to chin with elbows high' },

  // NECK
  { name: 'Neck Flexion', muscle: 'Neck', equipment: 'bodyweight', tip: 'Chin to chest against resistance — slow and controlled' },
  { name: 'Neck Extension', muscle: 'Neck', equipment: 'bodyweight', tip: 'Head back against resistance — build posterior neck strength' },
  { name: 'Band Neck Isometric', muscle: 'Neck', equipment: 'bodyweight', tip: 'Band around head, resist rotation and lateral flex isometrically' },

  // LOWER BACK
  { name: 'Back Extension', muscle: 'Lower Back', equipment: 'bodyweight', tip: 'Hinge at hips on pad, extend until body is straight, squeeze lower back' },
  { name: 'Good Morning', muscle: 'Lower Back', equipment: 'barbell', tip: 'Bar on upper back, hinge forward with soft knees, feel hamstring-back chain' },
  { name: 'Hyperextension', muscle: 'Lower Back', equipment: 'machine', tip: 'On GHD, extend until parallel — can hold weight for progression' },
  { name: 'Reverse Hyper', muscle: 'Lower Back', equipment: 'machine', tip: 'Lie prone on pad, swing legs up — decompresses spine and builds lower back' },
];

// Helper to filter by muscle group (maps lowercase MuscleGroup type to capitalized DB names)
export function getExercisesByMuscle(muscle: string): Exercise[] {
  const capitalized = muscle.charAt(0).toUpperCase() + muscle.slice(1);
  return EXERCISE_DB.filter((e) => e.muscle === capitalized);
}

// Search exercises by name (fuzzy-ish substring match)
export function searchExercises(query: string, muscle?: string): Exercise[] {
  const lower = query.toLowerCase();
  let results = EXERCISE_DB.filter((e) => e.name.toLowerCase().includes(lower));
  if (muscle) {
    const capitalized = muscle.charAt(0).toUpperCase() + muscle.slice(1);
    results = results.filter((e) => e.muscle === capitalized);
  }
  return results;
}
