// FORGE Gym Tracker — Exercise Database + Training Programs

// Auto-extracted from index.html — edit here for future exercise changes.



// ── EXERCISE LIBRARY ──

const EXERCISE_DB = [

  // CHEST

  {n:'Barbell Bench Press',m:'Chest',e:'barbell',mediaKey:'barbell bench press',t:'Lie flat, grip shoulder-width, lower to chest, drive up explosively'},

  {n:'Dumbbell Bench Press',m:'Chest',e:'dumbbell',mediaKey:'dumbbell bench press',t:'Lie flat, dumbbells at chest level, press up and together'},

  {n:'Incline Barbell Press',m:'Chest',e:'barbell',mediaKey:'incline barbell press',t:'30–45° incline targets upper chest — keep elbows slightly tucked'},

  {n:'Incline Dumbbell Press',m:'Chest',e:'dumbbell',mediaKey:'incline dumbbell press',t:'30–45° incline, neutral or pronated grip, full stretch at bottom'},

  {n:'Decline Bench Press',m:'Chest',e:'barbell',mediaKey:'decline bench press',t:'Decline 15–30° targets lower chest, keep feet anchored'},

  {n:'Cable Fly',m:'Chest',e:'cable',mediaKey:'cable fly',t:'Arms wide, arc hands together at chest height, feel pec stretch'},

  {n:'Pec Deck / Machine Fly',m:'Chest',e:'machine',mediaKey:'pec deck / machine fly',t:'Squeeze pecs hard at center, controlled return to stretch'},

  {n:'Push-Up',m:'Chest',e:'bodyweight',mediaKey:'push-up',t:'Hands shoulder-width, lower chest to floor, full lockout at top'},

  {n:'Dip (Chest)',m:'Chest',e:'bodyweight',mediaKey:'dip (chest)',t:'Lean forward 30° to target chest more than triceps'},

  {n:'Landmine Press',m:'Chest',e:'barbell',mediaKey:'landmine press',t:'Single-arm press with barbell anchored — great for upper chest'},

  // BACK

  {n:'Barbell Deadlift',m:'Back',e:'barbell',mediaKey:'barbell deadlift',t:'Hip hinge, flat back, bar over mid-foot, drive hips forward at lockout'},

  {n:'Pull-Up',m:'Back',e:'bodyweight',mediaKey:'pull-up',t:'Overhand grip, pull chest to bar, full extension at bottom'},

  {n:'Chin-Up',m:'Back',e:'bodyweight',mediaKey:'chin-up',t:'Underhand grip, elbows drive down and back, more bicep involvement'},

  {n:'Barbell Row',m:'Back',e:'barbell',mediaKey:'barbell row',t:'Hinge at hips, row bar to lower chest, elbows back at 45°'},

  {n:'Dumbbell Row',m:'Back',e:'dumbbell',mediaKey:'dumbbell row',t:'Knee and hand on bench, row to hip, keep shoulder down'},

  {n:'Seated Cable Row',m:'Back',e:'cable',mediaKey:'seated cable row',t:'Sit upright, pull handle to lower abdomen, squeeze shoulder blades'},

  {n:'Lat Pulldown',m:'Back',e:'machine',mediaKey:'lat pulldown',t:'Wide overhand grip, pull bar to upper chest, lean slightly back'},

  {n:'T-Bar Row',m:'Back',e:'barbell',mediaKey:'t-bar row',t:'Straddle the bar, pull to lower chest, keep back flat'},

  {n:'Face Pull',m:'Back',e:'cable',mediaKey:'face pull',t:'Rope at head height, pull to face with elbows high — great for posture'},

  {n:'Romanian Deadlift',m:'Back',e:'barbell',mediaKey:'romanian deadlift',t:'Hip hinge with soft knees, bar stays close to legs, feel hamstring stretch'},

  // SHOULDERS

  {n:'Barbell Overhead Press',m:'Shoulders',e:'barbell',t:'Press from front rack, bar moves in straight line overhead, lock out'},

  {n:'Dumbbell Shoulder Press',m:'Shoulders',e:'dumbbell',t:'Seated or standing, press overhead from ear level, full lockout'},

  {n:'Lateral Raise',m:'Shoulders',e:'dumbbell',t:'Slight forward lean, arms slightly bent, raise to shoulder height'},

  {n:'Front Raise',m:'Shoulders',e:'dumbbell',t:'Arms straight, raise to shoulder height in front, controlled down'},

  {n:'Arnold Press',m:'Shoulders',e:'dumbbell',t:'Rotate from neutral to pronated as you press — full shoulder activation'},

  {n:'Cable Lateral Raise',m:'Shoulders',e:'cable',t:'Low cable, raise arm to side for constant tension throughout range'},

  {n:'Upright Row',m:'Shoulders',e:'barbell',t:'Narrow grip, pull bar to chin, elbows lead throughout'},

  {n:'Machine Shoulder Press',m:'Shoulders',e:'machine',t:'Seated, press handles overhead, adjust seat for 90° at bottom'},

  {n:'Reverse Pec Deck',m:'Shoulders',e:'machine',t:'Face machine, arms wide — targets rear deltoids and upper back'},

  {n:'Band Pull-Apart',m:'Shoulders',e:'band',t:'Arms extended, pull band apart to chest, squeeze shoulder blades'},

  {n:'Cable Rear Delt Fly',m:'Shoulders',e:'cable',t:'Cross cables or dual handles, sweep out and back to isolate rear delts'},

  {n:'Machine Lateral Raise',m:'Shoulders',e:'machine',t:'Seated machine path for strict lateral delt loading without momentum'},

  // BICEPS

  {n:'Barbell Curl',m:'Biceps',e:'barbell',t:'Elbows fixed at sides, curl to shoulder, squeeze hard at top'},

  {n:'Dumbbell Curl',m:'Biceps',e:'dumbbell',t:'Alternate or together — supinate wrist as you curl for full contraction'},

  {n:'Hammer Curl',m:'Biceps',e:'dumbbell',t:'Neutral grip throughout — targets brachialis and brachioradialis'},

  {n:'Preacher Curl',m:'Biceps',e:'barbell',t:'Arm against pad, strict curl, full extension at bottom'},

  {n:'Cable Curl',m:'Biceps',e:'cable',t:'Low pulley, constant tension through full range, no swinging'},

  {n:'Concentration Curl',m:'Biceps',e:'dumbbell',t:'Seated, elbow on inner thigh, curl slowly for peak contraction'},

  {n:'Incline Dumbbell Curl',m:'Biceps',e:'dumbbell',t:'Incline bench, arms hang behind body — great stretch at bottom'},

  // TRICEPS

  {n:'Skull Crusher',m:'Triceps',e:'barbell',t:'Bar to forehead, elbows fixed, extend to full lockout'},

  {n:'Tricep Pushdown',m:'Triceps',e:'cable',t:'Bar or rope, extend arms fully, elbows pinned at sides'},

  {n:'Overhead Tricep Extension',m:'Triceps',e:'dumbbell',t:'Arm behind head, extend fully — great long head stretch'},

  {n:'Close-Grip Bench Press',m:'Triceps',e:'barbell',t:'Narrow grip, lower to sternum, elbows tucked throughout'},

  {n:'Dip (Tricep)',m:'Triceps',e:'bodyweight',t:'Stay upright to target triceps — lower until upper arm is parallel'},

  {n:'Cable Overhead Extension',m:'Triceps',e:'cable',t:'Rope behind head, extend forward and down, squeeze at lockout'},

  // CORE

  {n:'Plank',m:'Core',e:'bodyweight',t:'Forearms on floor, straight line from head to heels, squeeze everything'},

  {n:'Crunch',m:'Core',e:'bodyweight',t:'Hands behind head, curl shoulders toward knees, don\'t pull neck'},

  {n:'Leg Raise',m:'Core',e:'bodyweight',t:'Lying flat, raise straight legs to 90°, lower slowly — don\'t arch back'},

  {n:'Russian Twist',m:'Core',e:'bodyweight',t:'Seated, lean back 45°, rotate torso side to side — add weight plate'},

  {n:'Ab Wheel Rollout',m:'Core',e:'bodyweight',t:'Kneel, roll forward until parallel with floor, pull back with abs'},

  {n:'Cable Crunch',m:'Core',e:'cable',t:'Kneel, pull rope to elbows, crunch down — focus on abs not hips'},

  {n:'Hanging Leg Raise',m:'Core',e:'bodyweight',t:'Hang from bar, raise legs to parallel or higher, controlled descent'},

  {n:'Pallof Press',m:'Core',e:'cable',t:'Stand sideways to cable, press straight out — resist rotation'},

  {n:'Dead Bug',m:'Core',e:'bodyweight',t:'Lie on back, extend opposite arm and leg while keeping low back flat'},

  {n:'Hollow Body Hold',m:'Core',e:'bodyweight',t:'Lower back pressed to floor, arms and legs extended — hold position'},

  // LEGS

  {n:'Barbell Back Squat',m:'Legs',e:'barbell',t:'Bar on upper back, squat below parallel, drive knees out over toes'},

  {n:'Front Squat',m:'Legs',e:'barbell',t:'Bar on front delts, upright torso — great quad development'},

  {n:'Goblet Squat',m:'Legs',e:'dumbbell',t:'Hold dumbbell at chest, squat deep, elbows track inside knees'},

  {n:'Leg Press',m:'Legs',e:'machine',t:'Feet shoulder-width, lower to 90°, never lock knees at top'},

  {n:'Hack Squat',m:'Legs',e:'machine',t:'Shoulder pads, feet forward on plate, squat deep for quad focus'},

  {n:'Bulgarian Split Squat',m:'Legs',e:'dumbbell',t:'Rear foot elevated on bench, lower front knee, keep torso upright'},

  {n:'Leg Extension',m:'Legs',e:'machine',t:'Extend legs fully, pause and squeeze quads at top, lower slowly'},

  {n:'Leg Curl (Lying)',m:'Legs',e:'machine',t:'Lie prone, curl heels toward glutes, pause at top contraction'},

  {n:'Leg Curl (Seated)',m:'Legs',e:'machine',t:'Seated version targets hamstrings with different stretch profile'},

  {n:'Calf Raise (Standing)',m:'Calves',e:'machine',t:'Full ROM — deep stretch at bottom, full plantarflexion at top'},

  {n:'Calf Raise (Seated)',m:'Calves',e:'machine',t:'Seated version targets soleus (deeper calf) more than gastrocnemius'},

  {n:'Lunges',m:'Legs',e:'dumbbell',t:'Step forward, lower back knee toward floor, push through front heel'},

  {n:'Walking Lunges',m:'Legs',e:'dumbbell',t:'Continuous forward lunges — great for coordination and quad burn'},

  {n:'Smith Machine Squat',m:'Legs',e:'smith',t:'Use the fixed path to push quad volume with stable setup and deep ROM'},

  {n:'Pendulum Squat',m:'Legs',e:'machine',t:'Machine squat arc that lets you bias quads with deep knee flexion'},

  {n:'Sissy Squat',m:'Legs',e:'bodyweight',t:'Knees travel forward while torso stays long — brutal quad isolation'},

  {n:'Adductor Machine',m:'Legs',e:'machine',t:'Seated hip adduction for inner-thigh volume and groin strength'},

  // GLUTES

  {n:'Hip Thrust',m:'Glutes',e:'barbell',t:'Shoulders on bench, drive hips up, squeeze glutes hard at top'},

  {n:'Romanian Deadlift (DB)',m:'Glutes',e:'dumbbell',t:'Hip hinge, feel hamstring stretch, drive hips forward to stand'},

  {n:'Glute Bridge',m:'Glutes',e:'bodyweight',t:'Lie on back, feet flat, drive hips up squeezing glutes — add weight'},

  {n:'Cable Kickback',m:'Glutes',e:'cable',t:'Standing or on all fours, kick leg back with full hip extension'},

  {n:'Sumo Deadlift',m:'Glutes',e:'barbell',t:'Wide stance, toes out 45°, grip inside legs — great glute/adductor load'},

  {n:'Step-Up',m:'Glutes',e:'dumbbell',t:'Step onto bench or box, drive through heel, fully extend hip at top'},

  {n:'Abductor Machine',m:'Glutes',e:'machine',t:'Seated, push knees out against pads — targets glute med'},

  {n:'Donkey Kick',m:'Glutes',e:'bodyweight',t:'On all fours, kick heel toward ceiling — squeeze glute at top'},

  {n:'Cable Pull-Through',m:'Glutes',e:'cable',t:'Hip hinge with cable behind you — strong glute lockout without spinal load'},

  {n:'Smith Hip Thrust',m:'Glutes',e:'smith',t:'Use the smith path for stable hip thrust loading and high-rep glute work'},

  // TRAPS / UPPER BACK

  {n:'Barbell Shrug',m:'Traps',e:'barbell',t:'Hold bar at thighs, shrug shoulders straight up — no rolling'},

  {n:'Dumbbell Shrug',m:'Traps',e:'dumbbell',t:'Dumbbells at sides, shrug up and hold 1 second at top'},

  {n:'Behind-the-Back Shrug',m:'Traps',e:'barbell',t:'Bar behind glutes, shrug up — unique rear trap activation'},

  {n:'Trap Bar Carry',m:'Traps',e:'barbell',t:'Heavy loaded carries with trap bar to build traps, grip, and posture under load'},

  {n:'Cable Upright Row',m:'Traps',e:'cable',t:'Cable path keeps tension on upper traps and delts through the whole pull'},

  // NECK

  {n:'Neck Flexion',m:'Neck',e:'machine',t:'Controlled neck flexion through a short safe range with no jerking'},

  {n:'Neck Extension',m:'Neck',e:'machine',t:'Brace the torso and extend slowly to build neck strength safely'},

  {n:'Band Neck Isometric',m:'Neck',e:'band',t:'Hold against band tension without losing stacked head and neck posture'},

  // LOWER BACK

  {n:'Back Extension',m:'Lower Back',e:'machine',t:'45° or flat bench, hinge at hips, extend to neutral spine'},

  {n:'Good Morning',m:'Lower Back',e:'barbell',t:'Bar on upper back, hinge forward keeping back flat, drive hips'},

  {n:'Hyperextension',m:'Lower Back',e:'bodyweight',t:'On GHD or 45° bench, extend until body is straight — don\'t hyperextend'},

  {n:'Reverse Hyper',m:'Lower Back',e:'machine',t:'Swing the legs under control for posterior-chain work with low spinal fatigue'},

  // FOREARMS

  {n:'Wrist Curl',m:'Forearms',e:'barbell',t:'Forearms on thighs, wrist curls with full range of motion'},

  {n:'Reverse Wrist Curl',m:'Forearms',e:'barbell',t:'Overhand grip, curl wrists up — targets extensors'},

  {n:'Farmer\'s Carry',m:'Forearms',e:'dumbbell',t:'Heavy dumbbells at sides, walk with upright posture — grip killer'},

  {n:'Plate Pinch Hold',m:'Forearms',e:'plate',t:'Pinch smooth plates together and hold for thumb and crushing-grip strength'},

  {n:'Behind-The-Back Wrist Curl',m:'Forearms',e:'barbell',t:'Bar held behind hips for direct forearm flexor burn and pump'},

  // ── CALISTHENICS / BODYWEIGHT ────────────────────────────────
  // Push progression
  {n:'Wall Push-Up',m:'Chest',e:'bodyweight',mediaKey:'wall push-up',steps:['Stand arm\'s length from a wall and place hands flat against it, shoulder-width apart at chest height.','Lean body forward at an angle, keeping body straight from head to heels.','Bend elbows to lower your chest toward the wall in a controlled motion.','Push through palms to straighten arms and return to start. Focus on squeezing the chest at lockout.']},
  {n:'Incline Push-Up',m:'Chest',e:'bodyweight',mediaKey:'incline push-up',steps:['Place hands on an elevated surface (bench, step, or table) shoulder-width apart.','Step feet back so your body forms a straight line from head to heels.','Lower your chest to the surface by bending elbows at roughly 45°.','Press back up to full lockout, squeezing chest and triceps at the top.']},
  {n:'Diamond Push-Up',m:'Triceps',e:'bodyweight',mediaKey:'diamond push-up',steps:['Get into push-up position and bring hands together under your chest, forming a diamond shape with thumbs and index fingers.','Keep elbows close to your body throughout the movement.','Lower your chest toward your hands until it nearly touches.','Press up explosively to lockout — feel the triceps contract hard at the top.']},
  {n:'Archer Push-Up',m:'Chest',e:'bodyweight',mediaKey:'archer push-up',steps:['Set up in a wide push-up position with arms much wider than shoulder-width.','Lower yourself toward one hand by bending that elbow while the opposite arm stays nearly straight (like an archer drawing a bow).','Pause at the bottom, chest close to the bent-arm side.','Push back up to center and repeat on the other side.']},
  {n:'One-Arm Push-Up',m:'Chest',e:'bodyweight',mediaKey:'one-arm push-up',steps:['Place one hand on the floor directly under your chest. Spread feet wide for balance. Hold the other hand behind your back.','Maintain a rigid plank — do not let hips rotate.','Lower your chest toward the floor by bending the working elbow.','Press through your palm to full lockout. Keep the movement slow and controlled.']},
  // Pull progression
  {n:'Dead Hang',m:'Back',e:'bodyweight',mediaKey:'dead hang',steps:['Grip a pull-up bar with hands shoulder-width apart using an overhand grip.','Let your body hang fully — arms completely straight, shoulders relaxed then actively engaged (retract and depress scapulae).','Hold the position while breathing steadily. Keep core lightly braced.','Progress by increasing hold time. This builds grip strength and shoulder health.']},
  {n:'Negative Pull-Up',m:'Back',e:'bodyweight',mediaKey:'negative pull-up',steps:['Jump or step up so your chin is above the bar with hands shoulder-width overhand grip.','Slowly lower your body over 3–5 seconds, fully straightening arms at the bottom.','Focus on feeling the lats stretch and engage throughout the descent.','Step back up and repeat. This builds pulling strength faster than dead hangs alone.']},
  {n:'L-Sit Pull-Up',m:'Back',e:'bodyweight',mediaKey:'l-sit pull-up',steps:['Hang from the bar and raise your legs to 90° (parallel to the floor), forming an L-shape.','Hold the L-sit position throughout — this engages core intensely.','Pull your chest to the bar just like a regular pull-up.','Lower with control, maintaining the leg position throughout the full rep.']},
  {n:'Archer Pull-Up',m:'Back',e:'bodyweight',mediaKey:'archer pull-up',steps:['Grip the bar wider than shoulder-width.','Pull toward one hand, extending the other arm straight while pulling (like an archer drawing a bow).','Reach chin to or past the pulling hand.','Lower under control and alternate sides each rep.']},
  {n:'Muscle-Up',m:'Back',e:'bodyweight',mediaKey:'muscle-up',steps:['Hang from a bar with a false grip (wrists over the bar). Generate a slight swing (kip) to build momentum.','Explosively pull the bar to your hips — higher than a standard pull-up.','As the bar reaches your waist, lean forward and push down, transitioning over the bar.','Lock out arms fully at the top with the bar at hip level. Lower with control.']},
  // Dip progression
  {n:'Bench Dip',m:'Triceps',e:'bodyweight',mediaKey:'bench dip',steps:['Sit on the edge of a bench with hands beside your hips, fingers pointing forward.','Slide your hips off the bench and extend legs out in front of you (easier = bent knees).','Lower your body by bending elbows to 90°, keeping them pointed straight back.','Press through palms to straighten arms. Squeeze triceps hard at the top.']},
  {n:'Straight Bar Dip',m:'Triceps',e:'bodyweight',mediaKey:'straight bar dip',steps:['Grip a low horizontal bar (like a smith machine bar) with overhand grip.','Hang with arms extended, body angled forward slightly.','Lower your chest toward the bar by bending elbows — keep them tracking back.','Press back up to full arm extension. Squeeze triceps at the top.']},
  {n:'Parallel Bar Dip',m:'Triceps',e:'bodyweight',mediaKey:'parallel bar dip',steps:['Grip parallel bars and press up to support your bodyweight with straight arms.','Stay upright to focus on triceps (or lean forward slightly for more chest).','Lower your body until upper arms are parallel to the floor.','Drive through palms to return to full lockout. Keep shoulders down and back.']},
  {n:'Ring Dip',m:'Triceps',e:'bodyweight',mediaKey:'ring dip',steps:['Grip gymnastic rings and press up to lockout. Actively turn rings out at the top (RTO) for shoulder stability.','Lower your body under control — rings will challenge stability compared to bars.','Stop when upper arms are parallel to the floor.','Press up to full lockout, turning rings out as you finish. Progress by adding weight.']},
  // Hinge progression
  {n:'Single-Leg Glute Bridge',m:'Glutes',e:'bodyweight',mediaKey:'single-leg glute bridge',steps:['Lie on your back with one knee bent, foot flat on the floor. Extend the other leg straight.','Brace your core and drive the planted heel into the floor.','Raise your hips until your body forms a straight line from shoulder to knee.','Squeeze the glute hard at the top, hold 1 second, then lower with control.']},
  {n:'Nordic Curl',m:'Legs',e:'bodyweight',mediaKey:'nordic curl',steps:['Anchor your heels under something sturdy (partner, pad, or lat pulldown machine). Kneel upright with hips extended.','Slowly lower your torso forward, fighting the descent with your hamstrings for as long as possible.','When hamstrings give out, catch yourself on your hands, then use hands to help return to the starting position.','Over time, try to lower further under control before catching yourself. This is the best hamstring strengthening exercise.']},
  // Squat progression
  {n:'Assisted Squat',m:'Legs',e:'bodyweight',mediaKey:'assisted squat',steps:['Hold a door frame, TRX, or sturdy object with both hands for balance.','Stand with feet shoulder-width apart, toes slightly turned out.','Lower into a squat by pushing knees out and sitting hips back. Go as deep as comfortable.','Press through heels to stand back up. Use your arms only for balance, not to pull yourself up.']},
  {n:'Bodyweight Squat',m:'Legs',e:'bodyweight',mediaKey:'bodyweight squat',steps:['Stand feet shoulder-width apart, toes slightly out. Arms can extend forward for balance.','Initiate by pushing knees out and sitting hips back and down.','Descend until thighs are at least parallel to the floor. Keep chest up and back flat.','Drive through heels to stand, squeezing glutes at the top.']},
  {n:'Pistol Squat',m:'Legs',e:'bodyweight',mediaKey:'pistol squat',steps:['Stand on one leg, extending the other leg straight out in front of you.','Keep the floating leg elevated as you slowly squat down on the standing leg.','Descend until your hamstring touches your calf. Keep your torso upright and heel on the floor.','Drive through the heel of the standing leg to return upright. Use arms forward for counterbalance.']},
  // Core
  {n:'Dragon Flag',m:'Core',e:'bodyweight',mediaKey:'dragon flag',steps:['Lie on a bench and grip the sides firmly behind your head for support.','Press shoulders into the bench and lift your entire body up in a straight line, supporting only on shoulder blades.','Lower your body in one rigid plank — do NOT bend at the hips. This is the key.','Stop just before your body touches the bench and hold briefly, then raise back up.']},
  {n:'Bicycle Crunch',m:'Core',e:'bodyweight',mediaKey:'bicycle crunch',steps:['Lie on your back, hands lightly behind your head, knees raised to 90°.','Simultaneously crunch and rotate one elbow toward the opposite knee while extending the other leg.','Switch sides in a controlled pedaling motion — think rotation, not just elbow-to-knee.','Move slowly enough to feel your obliques work. Avoid pulling on your neck.']},
  {n:'Windmill',m:'Core',e:'bodyweight',mediaKey:'windmill',steps:['Stand with feet wider than hip-width. Raise one arm overhead and let the other hang.','Keeping both legs straight (or slight bend), hinge sideways toward the lower hand, reaching down toward your foot.','Keep the overhead arm pointing straight up throughout — rotate chest toward the ceiling.','Return to standing. This stretches obliques and improves hip mobility.']},
  {n:'Dragon Flag Lateral',m:'Core',e:'bodyweight',mediaKey:'dragon flag lateral',steps:['Lie on your side on a bench or floor, gripping a support above your head.','Keeping body fully rigid, raise your legs and hips off the surface in a side plank position.','Lower laterally with control — maintain straight body alignment throughout.','This targets the obliques and lateral core chain with intense demand.']},
  // Lunge progression
  {n:'Reverse Lunge',m:'Legs',e:'bodyweight',mediaKey:'reverse lunge',steps:['Stand tall, feet hip-width apart. Step one foot straight back and lower your knee toward the floor.','Lower until the back knee nearly touches the floor and front thigh is parallel.','Keep your front knee aligned over your ankle — do not let it cave inward.','Push through the front heel to return to standing. Alternate legs each rep.']},
  {n:'Walking Lunge',m:'Legs',e:'bodyweight',mediaKey:'walking lunge',steps:['Stand tall and step forward with one foot into a lunge position.','Lower your back knee toward the floor while keeping your torso upright.','At the bottom, drive off the front foot and bring the back foot forward to stand.','Continue stepping forward alternating legs — focus on balance and upright posture.']},
  {n:'Lateral Lunge',m:'Legs',e:'bodyweight',mediaKey:'lateral lunge',steps:['Stand with feet together. Step one foot far out to the side.','Shift your weight onto the stepping leg, bending that knee while the other leg stays straight.','Push your hips back as you descend — knee tracks over toes.','Drive through the bent leg\'s heel to return to the starting position.']},
  {n:'Deficit Lunge',m:'Legs',e:'bodyweight',mediaKey:'deficit lunge',steps:['Stand on a raised surface (plate or small step) with feet hip-width apart.','Step forward or backward into a lunge. The elevation increases the range of motion significantly.','Lower until the back knee nearly (or actually) touches the floor below your platform.','Push through the front heel to return. Increased ROM makes quads and glutes work harder.']},
  // Horizontal pull progression
  {n:'Inverted Row',m:'Back',e:'bodyweight',mediaKey:'inverted row',steps:['Set a barbell or bar at hip height in a rack. Lie under it and grip the bar with overhand hands, shoulder-width apart.','Hang with straight arms, heels on the floor, body in a rigid plank.','Pull your chest to the bar by retracting shoulder blades and driving elbows back.','Lower with control back to full arm extension. Elevate feet to increase difficulty.']},
  {n:'Australian Pull-Up',m:'Back',e:'bodyweight',mediaKey:'australian pull-up',steps:['Set a bar at waist height. Lie under it and grip with an overhand grip, shoulder-width apart.','Hang with arms straight and body slightly inclined — heels on the floor.','Pull your chest to the bar, leading with the elbows and squeezing shoulder blades together at the top.','Lower slowly to full arm extension. This is a great horizontal pull progression before full pull-ups.']},
  {n:'Archer Row',m:'Back',e:'bodyweight',mediaKey:'archer row',steps:['Hang under a bar or rings with a wide grip, body in a horizontal row position.','Pull toward one hand, extending the other arm straight (like an archer drawing a bow).','Retract the shoulder blade of the pulling arm and feel the lat engage.','Lower under control and repeat on the other side.']},
  {n:'One-Arm Row',m:'Back',e:'bodyweight',mediaKey:'one-arm row',steps:['Set up under a bar at hip height. Grip the bar with one hand, allowing your body to rotate slightly.','Hang with arm straight, body in a plank with one hand gripping the bar.','Pull your chest toward the bar using only one arm, rotating slightly at the top.','Lower slowly. This builds unilateral back strength and core stability.']},
  // Shoulder press progression
  {n:'Pike Push-Up',m:'Shoulders',e:'bodyweight',mediaKey:'pike push-up',steps:['Start in a push-up position and walk feet toward hands so your hips rise and your body forms an inverted V.','Hands should be shoulder-width apart, forming a straight line with your torso.','Bend elbows and lower the top of your head toward the floor between your hands.','Press back up to the inverted V position. This is essentially a bodyweight overhead press.']},
  {n:'Decline Push-Up',m:'Shoulders',e:'bodyweight',mediaKey:'decline push-up',steps:['Place feet on an elevated surface (bench, box, or wall). Hands on the floor shoulder-width apart.','The higher the elevation, the more the movement targets shoulders over chest.','Lower your head toward the floor while keeping body straight.','Press back up to full arm extension. Increase elevation as you get stronger.']},
  {n:'Wall Handstand Push-Up',m:'Shoulders',e:'bodyweight',mediaKey:'wall handstand push-up',steps:['Kick up into a handstand with heels against the wall for support. Arms locked out, core tight.','Slowly lower your head toward the floor by bending elbows — they should track out to the sides.','Stop when head lightly touches (or use an ab mat as a target).','Press back up powerfully to lockout. This is one of the most demanding bodyweight shoulder movements.']},
  {n:'Handstand Push-Up',m:'Shoulders',e:'bodyweight',mediaKey:'handstand push-up',steps:['Press into a freestanding handstand — engage core, squeeze glutes, and stack joints (hands, shoulders, hips, ankles).','Lower your head toward the floor by bending elbows, maintaining balance throughout.','The descent is slow and controlled — this is the hardest part.','Press back up to locked-out handstand position. Requires significant overhead pressing strength and balance.']},
  // Calf progression
  {n:'Calf Raise',m:'Calves',e:'bodyweight',mediaKey:'calf raise',steps:['Stand with feet hip-width apart on a flat surface (or toes on a step for full ROM).','Rise up on your toes as high as possible, squeezing calves hard at the top.','Hold the peak contraction for 1 second.','Lower slowly through the full range of motion — feel the deep stretch at the bottom.']},
  {n:'Single-Leg Calf Raise',m:'Calves',e:'bodyweight',mediaKey:'single-leg calf raise',steps:['Stand on one foot on the edge of a step. Hold something light for balance.','Lower your heel as far as possible below the step level for full calf stretch.','Rise up explosively on your toes, getting full plantar flexion at the top.','Lower slowly under control. Single-leg version doubles the load and builds unilateral calf strength.']},
  {n:'Donkey Calf Raise',m:'Calves',e:'bodyweight',mediaKey:'donkey calf raise',steps:['Stand at a 90° hip hinge position — hinge forward and hold a bench or bar for support, torso nearly parallel to the floor.','Stand on toes on a raised edge for full range of motion.','Rise up on toes, squeezing calves at the top with full plantar flexion.','Lower slowly for a deep stretch. The hip-bent position targets the gastrocnemius through its full length.']},
  // Hip flexor / leg raise progression
  {n:'Lying Leg Raise',m:'Core',e:'bodyweight',mediaKey:'lying leg raise',steps:['Lie flat on your back with hands under your glutes for lower back support.','Keep legs together and straight. Raise them to 90° (perpendicular to the floor).','Slowly lower legs back down, stopping just before they touch the floor.','Keep lower back pressed into the floor throughout. If it arches, bend knees slightly.']},
  {n:'Hanging Knee Raise',m:'Core',e:'bodyweight',mediaKey:'hanging knee raise',steps:['Hang from a pull-up bar with a shoulder-width overhand grip. Let body hang fully.','Brace your core and raise both knees toward your chest by flexing at the hips.','Hold the top position briefly, squeezing abs.','Lower legs slowly to the dead hang position. Avoid swinging — control each rep.']},
  {n:'Toes to Bar',m:'Core',e:'bodyweight',mediaKey:'toes to bar',steps:['Hang from a pull-up bar with shoulder-width overhand grip. Body fully extended.','Engage core and raise both legs with straight knees until toes touch the bar.','Control the movement — avoid kipping unless specifically training that skill.','Lower legs slowly back to the hang position. This requires significant hip flexor and lat strength.']},

];



const _EX_LIB_MUSCLES = ['All','Chest','Back','Shoulders','Biceps','Triceps','Forearms','Core','Lower Back','Glutes','Legs','Calves','Traps','Neck'];

const FREE_EXERCISE_JSON_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

const FREE_EXERCISE_IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const EXERCISE_STORE = {

  raw: [...EXERCISE_DB],

  byName: new Map(),

  bodyweight: []

};

EXERCISE_DB.forEach(item => {

  const key = (item.n || '').trim().toLowerCase();

  if (key) EXERCISE_STORE.byName.set(key, item);

});

const MUSCLE_CATEGORY_MAP = {

  abdominals: 'Core',

  'rectus abdominis': 'Core',

  obliques: 'Core',

  serratus: 'Chest',

  chest: 'Chest',

  biceps: 'Biceps',

  triceps: 'Triceps',

  shoulders: 'Shoulders',

  deltoids: 'Shoulders',

  traps: 'Traps',

  back: 'Back',

  lats: 'Back',

  'middle back': 'Back',

  'upper back': 'Back',

  glutes: 'Glutes',

  quadriceps: 'Legs',

  hamstrings: 'Legs',

  calves: 'Calves',

  adductors: 'Legs',

  abductors: 'Legs',

  forearms: 'Forearms',

  neck: 'Neck',

  'lower back': 'Lower Back',

  core: 'Core'

};



let exerciseCatalogPromise = null;



const _titleCase = value =>

  String(value || '')

    .toLowerCase()

    .split(/[\s_-]+/)

    .filter(Boolean)

    .map(word => word[0].toUpperCase() + word.slice(1))

    .join(' ');



const _mapMuscleToCategory = muscle => {

  if (!muscle) return 'Core';

  const normalized = String(muscle).toLowerCase().trim();

  return MUSCLE_CATEGORY_MAP[normalized] || _titleCase(normalized);

};



function normalizeFreeExercise(record) {

  if (!record || !record.name) return null;

  const primary = Array.isArray(record.primaryMuscles) ? record.primaryMuscles.map(_titleCase).filter(Boolean) : [];

  const secondary = Array.isArray(record.secondaryMuscles) ? record.secondaryMuscles.map(_titleCase).filter(Boolean) : [];

  const instructions = Array.isArray(record.instructions)

    ? record.instructions.map(instr => instr.trim()).filter(Boolean)

    : [];

  const steps = instructions.slice(0, 4);

  const muscle = _mapMuscleToCategory(primary[0] || secondary[0] || record.category);

  const images = Array.isArray(record.images) ? record.images.map(img => `${FREE_EXERCISE_IMAGE_BASE}${img}`) : [];

  return {

    id: record.id,

    n: record.name,

    m: muscle,

    e: record.equipment || 'body only',

    t: instructions[0] || record.name,

    steps,

    instructions,

    images,

    primaryMuscles: primary,

    secondaryMuscles: secondary,

    mechanic: record.mechanic || record.type || record.category || '',

    force: record.force || '',

    difficulty: record.level || ''

  };

}



function hydrateExerciseDatabase(exercises) {
  // Map curated mediaKeys to preserve them
  const curatedKeys = new Map();
  EXERCISE_DB.forEach(ex => {
    if (ex.mediaKey) curatedKeys.set(_normalizeExerciseName(ex.n), ex.mediaKey);
  });

  EXERCISE_DB.length = 0;
  EXERCISE_DB.push(...exercises);
  
  // Re-apply curated mediaKeys
  EXERCISE_DB.forEach(ex => {
    const key = _normalizeExerciseName(ex.n);
    if (curatedKeys.has(key)) ex.mediaKey = curatedKeys.get(key);
  });

  EXERCISE_STORE.raw = exercises;
  EXERCISE_STORE.byName.clear();
  exercises.forEach(ex => {
    const key = _normalizeExerciseName(ex.n);
    if (key) EXERCISE_STORE.byName.set(key, ex);
  });
}



async function fetchFreeExerciseCatalog() {

  const response = await fetch(FREE_EXERCISE_JSON_URL, { cache: 'no-store' });

  if (!response.ok) throw new Error('Failed to reach Free Exercise DB');

  const payload = await response.json();

  if (!Array.isArray(payload)) throw new Error('Free Exercise DB returned invalid payload');

  const normalized = payload.map(normalizeFreeExercise).filter(Boolean);

  normalized.sort((a, b) => a.n.localeCompare(b.n));

  hydrateExerciseDatabase(normalized);

  return normalized;

}



function ensureFreeExerciseData() {

  if (exerciseCatalogPromise) return exerciseCatalogPromise;

  exerciseCatalogPromise = fetchFreeExerciseCatalog().catch(err => {

    console.warn('[FORGE] Unable to load Free Exercise DB', err);

    return EXERCISE_STORE.raw;

  });

  return exerciseCatalogPromise;

}

let _exLibMuscle = 'All';

let communityExercises = [];
const FREE_EXERCISE_MEDIA_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
let _freeTreeInjected = false;
const FORM_INSPECTOR_MEDIA_FILE = 'data/form-inspector-media.json';

let FORM_INSPECTOR_MEDIA = {};



const FORM_INSPECTOR_META = {

  'barbell bench press': {

    mechanic: 'Compound',

    steps: [

      'Plant feet firmly, pinch shoulder blades, and load lats.',

      'Lower to mid-chest under control while keeping elbows at ~45°.',

      'Explosively drive the bar up without losing tightness.'

    ]

  },

  'push-up': {

    mechanic: 'Compound',

    steps: [

      'Set hands slightly wider than shoulders, drive through palms.',

      'Brace core and descend until chest grazes the floor.',

      'Explode back up without letting your hips sag.'

    ]

  },

  'bulgarian split squat': {

    mechanic: 'Unilateral',

    steps: [

      'Elevate rear foot on bench, keep front knee tracking over toes.',

      'Descend until front thigh is parallel and torso stays tall.',

      'Drive through the heel, squeeze glutes, and keep balance.'

    ]

  },

  'archer push-up': {

    mechanic: 'Unilateral',

    steps: [

      'Start wide, load one arm while the other straightens.',

      'Lower towards your loaded arm, keeping the other arm locked.',

      'Press back up to center while managing torso rotation.'

    ]

  },

  'pistol squat': {

    mechanic: 'Single-leg',

    steps: [

      'Reach one leg forward, sit back on the standing heel.',

      'Keep hips level and track the knee over the toe.',

      'Stand tall by pressing through the heel and controlling the descent.'

    ]

  },

  'bodyweight row': {

    mechanic: 'Horizontal Pull',

    steps: [

      'Use a low bar; keep the body straight and core tight.',

      'Pull chest toward the bar, leading with the elbows.',

      'Lower slowly until arms are fully extended.'

    ]

  },

  'elevated row': {

    mechanic: 'Horizontal Pull',

    steps: [

      'Place feet on a bench to increase the demand.',

      'Drive your elbows back while keeping shoulder blades retracted.',

      'Hold the top position briefly before a controlled descent.'

    ]

  },

  'archer row': {

    mechanic: 'Unilateral',

    steps: [

      'Pull one side while the opposite arm straightens along the bar.',

      'Keep hips square and chest high during the pull.',

      'Return to center with control and swap sides.'

    ]

  },

  'wall handstand': {

    mechanic: 'Inverted',

    steps: [

      'Hand placement shoulder-width, press through the shoulders.',

      'Walk your feet up the wall while keeping a tight midline.',

      'Stay active through the wrists and avoid collapsing the shoulders.'

    ]

  },

  'freestanding handstand': {

    mechanic: 'Balance',

    steps: [

      'Kick into the handstand with tension running from wrists to toes.',

      'Find equilibrium with micro-adjustments from the fingertips.',

      'Keep a slight lean and avoid locking elbows.'

    ]

  },

  'handstand push-up': {

    mechanic: 'Vertical Push',

    steps: [

      'Start in a solid wall handstand, lower to forehead level.',

      'Drive straight back up while keeping the midline tight.',

      'Control the descent on each rep to protect the shoulders.'

    ]

  },

  'dragon flag': {

    mechanic: 'Core',

    steps: [

      'Grip the bench behind your head and brace the core.',

      'Lower legs as one unit, keeping hips off the bench.',

      'Lock the body and raise back up without arching the lower back.'

    ]

  },

  'jump squat': {

    mechanic: 'Explosive',

    steps: [

      'Sink into a full squat with heels grounded.',

      'Explode upward as high as possible, swinging arms overhead.',

      'Land softly and immediately prepare for the next rep.'

    ]

  }

};



const _normalizeExerciseName = name => (String(name || '').trim().toLowerCase());

function _seedCuratedExerciseStore() {
  EXERCISE_STORE.byName.clear();
  EXERCISE_DB.forEach(entry => {
    const key = _normalizeExerciseName(entry.n);
    if (key) EXERCISE_STORE.byName.set(key, { ...entry });
  });
}

function _splitInstructionText(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(line => String(line || '').trim()).filter(Boolean);
  if (typeof raw === 'string') {
    return raw
      .split(/\r?\n|\.\s+/)
      .map(line => String(line || '').trim())
      .filter(Boolean);
  }
  return [];
}

function _normalizeFreeExerciseEntry(entry) {
  if (!entry || !entry.name) return null;
  const key = _normalizeExerciseName(entry.name);
  if (!key) return null;
  const steps = _splitInstructionText(entry.instructions);
  const equipment = String(entry.equipment || 'body only').trim().toLowerCase();
  return {
    n: entry.name,
    m: entry.primaryMuscles?.[0] || entry.bodyPart || entry.target || 'Bodyweight',
    e: equipment,
    equipment,
    steps,
    instructions: steps,
    type: entry.type === 'hold' ? 'hold' : 'reps',
    mechanic: entry.target || entry.type || '',
    images: Array.isArray(entry.images) ? entry.images.filter(Boolean) : [],
    primaryMuscles: Array.isArray(entry.primaryMuscles) ? entry.primaryMuscles : [],
    source: 'free-db'
  };
}

function _maybeInjectFreeBodyweightTree() {
  if (_freeTreeInjected) return;
  if (!EXERCISE_STORE.bodyweight.length) return;
  const existingNames = new Set(
    CALISTHENICS_TREES.flatMap(tree => tree.levels.map(lvl => _normalizeExerciseName(lvl.n)))
  );
  const candidates = EXERCISE_STORE.bodyweight.filter(
    ex => !existingNames.has(_normalizeExerciseName(ex.n))
  );
  if (!candidates.length) return;
  const selection = candidates.slice(0, 8);
  const tree = {
    tree: 'Bodyweight Vault',
    muscle: 'Bodyweight',
    icon: '🤸',
    levels: selection.map((ex, idx) => ({
      l: idx + 1,
      n: ex.n,
      t: ex.type === 'hold' ? 'hold' : 'reps',
      target: ex.target || (ex.type === 'hold' ? 20 + idx * 5 : 10 + idx * 5)
    }))
  };
  CALISTHENICS_TREES.push(tree);
  _freeTreeInjected = true;
  rebuildBwExercises();
  if (typeof renderBwExercisePicker === 'function') renderBwExercisePicker();
}

async function fetchFreeExerciseData() {
  try {
    const response = await fetch(FREE_EXERCISE_JSON_URL);
    if (!response.ok) throw new Error('Bad response');
    const payload = await response.json();
    if (!Array.isArray(payload)) throw new Error('Unexpected payload');
    const normalized = payload
      .map(_normalizeFreeExerciseEntry)
      .filter(Boolean);

    const combined = [...EXERCISE_DB];
    const seenKeys = new Set(combined.map(entry => _normalizeExerciseName(entry.n)));
    normalized.forEach(entry => {
      const key = _normalizeExerciseName(entry.n);
      if (!key) return;
      const idx = combined.findIndex(item => _normalizeExerciseName(item.n) === key);
      if (idx >= 0) {
        combined[idx] = { ...combined[idx], ...entry };
      } else if (!seenKeys.has(key)) {
        combined.push(entry);
        seenKeys.add(key);
      }
    });

    EXERCISE_STORE.raw = combined;
    EXERCISE_STORE.byName.clear();
    combined.forEach(entry => {
      const key = _normalizeExerciseName(entry.n);
      if (key) EXERCISE_STORE.byName.set(key, entry);
    });

    EXERCISE_STORE.bodyweight = normalized.filter(ex => ex.equipment === 'body only');
    _maybeInjectFreeBodyweightTree();
  } catch (err) {
    console.warn('[FORGE] Unable to load Free Exercise DB', err);
    EXERCISE_STORE.raw = [...EXERCISE_DB];
    EXERCISE_STORE.byName.clear();
    EXERCISE_DB.forEach(entry => {
      const key = _normalizeExerciseName(entry.n);
      if (key) EXERCISE_STORE.byName.set(key, { ...entry });
    });
    EXERCISE_STORE.bodyweight = [];
  }
}

_seedCuratedExerciseStore();



function findExerciseByName(name) {

  const key = _normalizeExerciseName(name);

  if (!key) return null;

  const base = EXERCISE_DB.find(e => e.n && e.n.toLowerCase() === key);
  const storeEntry = EXERCISE_STORE.byName.get(key);

  const meta = FORM_INSPECTOR_META[key];

  if (!base && !storeEntry && !meta) return null;

  return { ...(storeEntry || {}), ...(base || {}), ...(meta || {}) };

}



async function loadFormInspectorMedia() {

  try {

    const response = await fetch(FORM_INSPECTOR_MEDIA_FILE);

    if (!response.ok) throw new Error('Bad response');

    FORM_INSPECTOR_MEDIA = await response.json();

  } catch (err) {

    console.warn('[FORGE] Unable to load form inspector media map', err);

    FORM_INSPECTOR_MEDIA = {};

  }

}



function _exerciseCatalog() {

  if (typeof getMergedExerciseCatalog === 'function') {

    const merged = getMergedExerciseCatalog(EXERCISE_DB);

    communityExercises = merged.filter(e => e && e.shared);

    return merged;

  }

  return EXERCISE_DB;

}



async function _refreshCommunityExercises(onDone) {

  if (typeof ensureCommunityExercisesLoaded === 'function') {

    try { await ensureCommunityExercisesLoaded(); } catch (_e) {}

  }

  const merged = _exerciseCatalog();

  if (typeof onDone === 'function') onDone(merged);

  return merged;

}



function _exerciseAddCta(query, context) {

  const safeQuery = String(query || '').trim().replace(/"/g, '&quot;');

  const muscle = selectedMuscle || (_exLibMuscle !== 'All' ? _exLibMuscle : 'Core');

  const ctx = context === 'autocomplete' ? 'autocomplete' : 'library';

  return `<div class="ex-lib-empty-state">

    <div class="ex-lib-empty-title">Workout not found? Add it</div>

    <div class="ex-lib-empty-sub">Save it once and make it available for all users immediately.</div>

    <input id="ex-add-name-${ctx}" class="ex-lib-search" value="${safeQuery}" placeholder="Exercise name">

    <div class="ex-lib-add-grid">

      <select id="ex-add-muscle-${ctx}" class="meal-input">

        ${_EX_LIB_MUSCLES.filter(m => m !== 'All').map(m => `<option value="${m}"${m===muscle?' selected':''}>${m}</option>`).join('')}

      </select>

      <select id="ex-add-equipment-${ctx}" class="meal-input">

        ${['barbell','dumbbell','machine','cable','bodyweight','band','smith','other'].map(e => `<option value="${e}">${e}</option>`).join('')}

      </select>

    </div>

    <input id="ex-add-tip-${ctx}" class="ex-lib-search" placeholder="Optional tip for other users">

    <button class="meal-btn" type="button" onclick="addMissingWeightedExercise('${ctx}')">Add workout</button>

  </div>`;

}



function openExLib() {

  _exLibMuscle = 'All';

  const srch = document.getElementById('ex-lib-search');

  if (srch) srch.value = '';

  renderExLibFilters();

  renderExLib();

  _refreshCommunityExercises(() => renderExLib());

  document.getElementById('ex-lib-modal').classList.add('open');

  setTimeout(() => { if (srch) srch.focus(); }, 300);

}



function closeExLib() {

  document.getElementById('ex-lib-modal').classList.remove('open');

}



function renderExLibFilters() {

  const fil = document.getElementById('ex-lib-filters');

  if (!fil) return;

  fil.innerHTML = _EX_LIB_MUSCLES.map(m =>

    `<button class="ex-lib-filter-pill${_exLibMuscle===m?' active':''}" onclick="_exLibMuscle='${m}';renderExLibFilters();renderExLib()">${m}</button>`

  ).join('');

}



function renderExLib() {

  const q = (document.getElementById('ex-lib-search')?.value || '').toLowerCase();

  let results = _exerciseCatalog();

  if (_exLibMuscle !== 'All') results = results.filter(e => e.m === _exLibMuscle);

  if (q) results = results.filter(e => e.n.toLowerCase().includes(q) || e.e.toLowerCase().includes(q) || e.m.toLowerCase().includes(q));

  const list = document.getElementById('ex-lib-list');

  if (!list) return;

  if (!results.length) {

    list.innerHTML = _exerciseAddCta(q, 'library');

    return;

  }

  list.innerHTML = results.map(e => {

    const safeName = (e.n || '').replace(/'/g,"\\'");

    return `<div class="ex-lib-item" onclick="pickExLibExercise('${safeName}','${e.m}')">

      <div class="ex-lib-item-header">

        <div class="ex-lib-item-name">${e.n}</div>

        <button class="ex-lib-info" type="button" onclick="event.stopPropagation(); openFormInspector('${safeName}')">ℹ️</button>

      </div>

      <div class="ex-lib-item-tags">

        <span class="ex-lib-tag">${e.m}</span>

        <span class="ex-lib-tag ex-lib-tag-eq">${e.e}</span>

      </div>

      <div class="ex-lib-item-tip">${e.t}</div>

    </div>`;

  }).join('');

}



function pickExLibExercise(name, muscle) {

  const exInput = document.getElementById('exercise-name');

  if (exInput) exInput.value = name;

  closeExLib();

  closeAutocomplete();

  if (muscle && typeof selectMuscle === 'function') selectMuscle(muscle);

  if (typeof updateLastSessionHint === 'function') updateLastSessionHint();

  if (typeof updatePRPath === 'function') updatePRPath();

  if (typeof _loadGhostSets === 'function') _loadGhostSets(name);

  if (document.querySelectorAll('.set-row').length === 0 && typeof loadLastSessionSets === 'function') {

    loadLastSessionSets(name);

  }

}

function _resolveFormInspectorMedia(exercise) {
  if (!exercise) return null;
  if (exercise.vid) return { type: 'video', url: exercise.vid };

  // Prioritize GIFs/images from our manual mapping
  const key = _normalizeExerciseName(exercise.mediaKey || exercise.n);
  const fallback = FORM_INSPECTOR_MEDIA[key];
  if (fallback && fallback.src) {
    const images = (fallback.images && fallback.images.length) ? fallback.images : [];
    return { type: fallback.type === 'gif' ? 'image' : fallback.type, url: fallback.src, images };
  }

  // Fallback to static images from the free database
  if (exercise.images && exercise.images.length) {
    const imgs = exercise.images.map(img => img.startsWith('http') ? img : `${FREE_EXERCISE_MEDIA_BASE}${img}`);
    return { type: 'image', url: imgs[0], images: imgs };
  }

  return null;
}

// Carousel state
let _formCarouselIdx = 0;
let _formCarouselImgs = [];

function formCarouselNav(dir) {
  _formCarouselIdx = (_formCarouselIdx + dir + _formCarouselImgs.length) % _formCarouselImgs.length;
  _formCarouselUpdate();
}

function _formCarouselUpdate() {
  const track = document.getElementById('form-carousel-track');
  const dots = document.getElementById('form-carousel-dots');
  const label = document.getElementById('form-carousel-step-label');
  if (track) track.style.transform = `translateX(-${_formCarouselIdx * 100}%)`;
  if (dots) Array.from(dots.children).forEach((d, i) => d.classList.toggle('active', i === _formCarouselIdx));
  if (label) label.textContent = `Step ${_formCarouselIdx + 1} of ${_formCarouselImgs.length}`;
}

function _formCarouselOpen(images, exerciseName) {
  _formCarouselImgs = images;
  _formCarouselIdx = 0;
  const carousel = document.getElementById('form-carousel');
  const track = document.getElementById('form-carousel-track');
  const dots = document.getElementById('form-carousel-dots');
  if (!carousel || !track || !dots) return;
  track.innerHTML = images.map((url, i) =>
    `<div class="form-carousel-slide"><img src="${url}" alt="${exerciseName} step ${i + 1}" referrerpolicy="no-referrer" loading="${i === 0 ? 'eager' : 'lazy'}"></div>`
  ).join('');
  dots.innerHTML = images.map((_, i) => `<span class="form-carousel-dot${i === 0 ? ' active' : ''}"></span>`).join('');
  _formCarouselUpdate();
  carousel.style.display = 'block';
  // Touch swipe
  let touchStartX = 0;
  carousel.ontouchstart = e => { touchStartX = e.touches[0].clientX; };
  carousel.ontouchend = e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) formCarouselNav(dx < 0 ? 1 : -1);
  };
}



function openFormInspector(name) {

  const exercise = findExerciseByName(name);

  if (!exercise) return;

  const modal = document.getElementById('form-inspector-modal');

  const title = document.getElementById('form-exercise-name');

  const badges = document.getElementById('form-badges');

  const stepsList = document.getElementById('form-steps-list');

  const selectBtn = document.getElementById('form-select-btn');
  const video = document.getElementById('form-video-player');
  const gif = document.getElementById('form-media-gif');
  const empty = document.getElementById('form-media-empty');
  if (gif) {
    gif.removeAttribute('src');
    gif.style.display = 'none';
  }

  if (empty) empty.style.display = 'none';

  const spinner = document.getElementById('form-video-loading');

  if (!modal || !title || !badges || !stepsList || !selectBtn) return;



  const badgeValues = new Set();
  if (exercise.primaryMuscles?.length) badgeValues.add(exercise.primaryMuscles.join(', '));
  if (exercise.m) badgeValues.add(exercise.m);
  if (exercise.e) badgeValues.add(exercise.e);
  if (exercise.mechanic) badgeValues.add(exercise.mechanic);
  if (exercise.source === 'free-db') badgeValues.add('Free Exercise DB');
  badges.innerHTML = Array.from(badgeValues).map(v => `<span class="form-badge">${v}</span>`).join('');



  const stepSources = (exercise.steps && exercise.steps.length)
    ? exercise.steps
    : (exercise.instructions && exercise.instructions.length)
      ? exercise.instructions
      : (exercise.t ? [exercise.t] : []);

  stepsList.innerHTML = stepSources.length

    ? stepSources.map(step => `<li>${step}</li>`).join('')

    : '<li style="opacity:.6;">Technique coming soon.</li>';



  title.textContent = exercise.n || name;

  const media = _resolveFormInspectorMedia(exercise);
  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.style.display = 'none';
  }
  if (gif) {
    gif.removeAttribute('src');
    gif.style.display = 'none';
  }
  if (spinner) spinner.style.display = 'none';
  if (empty) empty.style.display = 'none';

  const expandBtn = document.getElementById('form-expand-btn');
  if (expandBtn) expandBtn.style.display = 'none';
  const carousel = document.getElementById('form-carousel');
  if (carousel) carousel.style.display = 'none';

  if (media && media.type === 'video' && video) {
    video.style.display = 'block';
    video.src = media.url;
    video.load();
    video.play().catch(() => {});
  } else if (media && media.type === 'image') {
    if (media.images && media.images.length > 1) {
      _formCarouselOpen(media.images, exercise.n || name);
    } else if (gif) {
      gif.style.display = 'block';
      gif.src = media.url;
      gif.alt = exercise.n || name;
      if (expandBtn) expandBtn.style.display = 'flex';
    }
  } else if (empty) {
    empty.style.display = 'flex';
  }

  selectBtn.onclick = () => {

    pickExLibExercise(exercise.n, exercise.m);

    closeFormInspector();

  };



  modal.classList.add('open');

}



function closeFormInspector() {

  const modal = document.getElementById('form-inspector-modal');

  const video = document.getElementById('form-video-player');

  if (modal) modal.classList.remove('open');

  if (video) {

    video.pause();

    video.removeAttribute('src');

  }

  const spinner = document.getElementById('form-video-loading');
  if (spinner) spinner.style.display = 'none';
  const carousel = document.getElementById('form-carousel');
  if (carousel) carousel.style.display = 'none';

  closeFormLightbox();

}

function expandFormMedia() {
  const gif = document.getElementById('form-media-gif');
  const lightbox = document.getElementById('form-image-lightbox');
  const lbImg = document.getElementById('lightbox-img');
  if (!lightbox || !lbImg) return;
  const src = gif && gif.style.display !== 'none' ? gif.src : null;
  if (!src) return;
  lbImg.src = src;
  lightbox.classList.add('open');
}

function closeFormLightbox() {
  const lightbox = document.getElementById('form-image-lightbox');
  if (lightbox) lightbox.classList.remove('open');
}



async function addMissingWeightedExercise(context) {

  const ctx = context === 'autocomplete' ? 'autocomplete' : 'library';

  const name = (document.getElementById(`ex-add-name-${ctx}`)?.value || '').trim();

  const muscle = (document.getElementById(`ex-add-muscle-${ctx}`)?.value || selectedMuscle || 'Core').trim();

  const equipment = (document.getElementById(`ex-add-equipment-${ctx}`)?.value || 'other').trim();

  const tip = (document.getElementById(`ex-add-tip-${ctx}`)?.value || '').trim();

  if (!name) {

    if (typeof showToast === 'function') showToast('Enter an exercise name first', 'warn');

    return;

  }

  try {

    const created = typeof addCommunityExercise === 'function'

      ? await addCommunityExercise({ name, muscle, equipment, tip })

      : { n: name, m: muscle, e: equipment, t: tip };

    _exerciseCatalog();

    pickExLibExercise(created.n || name, created.m || muscle);

    renderExLib();

    if (typeof showToast === 'function') showToast('Workout added for all users', 'success');

  } catch (err) {

    console.warn('[FORGE community] add exercise failed', err);

    if (typeof showToast === 'function') showToast('Unable to add workout right now', 'warn');

  }

}



document.addEventListener('DOMContentLoaded', async () => {

  await fetchFreeExerciseData();
  _refreshCommunityExercises();

  loadFormInspectorMedia();

  // Wire SVG zone clicks → open overlay

  document.querySelectorAll('.body-zone').forEach(zone => {

    zone.addEventListener('click', () => selectMuscle(zone.dataset.muscle, false));

  });



  // Swipe-down to close muscle overlay

  const overlay = document.getElementById('muscle-overlay');

  let touchStartY = 0;

  overlay.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, {passive:true});

  overlay.addEventListener('touchmove', e => {

    const dy = e.touches[0].clientY - touchStartY;

    if (dy > 0) overlay.style.transform = 'translateY(' + Math.min(dy * 0.5, 120) + 'px)';

  }, {passive:true});

  overlay.addEventListener('touchend', e => {

    const dy = e.changedTouches[0].clientY - touchStartY;

    overlay.style.transform = '';

    if (dy > 80) closeMuscleOverlay();

  }, {passive:true});



  // Keyboard close

  document.addEventListener('keydown', e => {

    if (e.key !== 'Escape') return;

    // Close in priority order: confirm modal, muscle overlay, rest-fab panel, template modal, any open overlay

    const confirmOverlay = document.getElementById('confirm-modal');

    if (confirmOverlay && confirmOverlay.classList.contains('open')) { hideConfirm(); return; }

    const restPanel = document.getElementById('rest-fab-panel');

    if (restPanel && restPanel.classList.contains('open')) { restPanel.classList.remove('open'); return; }

    const templateModal = document.getElementById('template-modal');

    if (templateModal && templateModal.classList.contains('open')) { templateModal.classList.remove('open'); return; }

    // Close any other open modal overlays

    const openModal = document.querySelector('.modal-overlay.open, .modal.open');

    if (openModal) { openModal.classList.remove('open'); return; }

    // Fallback: close muscle overlay

    closeMuscleOverlay();

  });



  // Exercise name input

  const exInput = document.getElementById('exercise-name');

  if (exInput) {

    exInput.addEventListener('input', () => {

      const name = exInput.value.trim();

      showAutocomplete(name);

      updateLastSessionHint();

    });

    exInput.addEventListener('focus', () => {

      const name = exInput.value.trim();

      if (name) showAutocomplete(name);

    });

    exInput.addEventListener('blur', () => {

      // Small delay so mousedown on item fires first

      setTimeout(() => {

        closeAutocomplete();

        const name = exInput.value.trim();

        if (name) {

          const hasRecord = workouts.some(w => w.exercise.toLowerCase() === name.toLowerCase());

          if (hasRecord && document.querySelectorAll('.set-row').length === 0) {

            loadLastSessionSets(name);

          }

        }

      }, 180);

    });

    exInput.addEventListener('keydown', e => {

      if (e.key === 'Escape') closeAutocomplete();

    });

  }



  // ── New feature initialisation ──

  // Step tracker: render panel (functions defined later in script, use setTimeout to ensure they're ready)

  setTimeout(() => {

    if (typeof renderStepsPanel === 'function') renderStepsPanel();

    if (typeof applyLayout      === 'function') applyLayout();

    if (typeof _updateHdrStreak  === 'function') _updateHdrStreak();

    if (typeof _updateHdrStats   === 'function') _updateHdrStats();

    if (typeof _hdrRestRender    === 'function') _hdrRestRender();

    if (typeof renderMissions    === 'function') { try { renderMissions(); } catch(e) { console.warn('[FORGE] renderMissions init:', e); } }

    if (typeof _updateWaterGoal  === 'function') _updateWaterGoal();

    if (typeof _updateHdrWater   === 'function') _updateHdrWater();

    if (typeof _updateHdrSteps   === 'function') _updateHdrSteps();

    if (typeof _updateHdrCoach   === 'function') _updateHdrCoach();

    if (typeof _updateMascot     === 'function') _updateMascot();

    if (typeof renderCoach       === 'function') renderCoach();

    if (typeof _updateMuscleChipColors === 'function') _updateMuscleChipColors();

    if (typeof _applyRankSkin    === 'function') {

      const _initXP = (typeof calcXP === 'function') ? calcXP() : 0;

      const _initLvl = (typeof getCurrentLevel === 'function') ? getCurrentLevel(_initXP) : null;

      if (_initLvl) _applyRankSkin(_initLvl.name);

    }

  }, 0);

});



/* ── Arcade Gym State ── */

let _comboCount = 0;

let _comboTimer = null;

let _bestCombo  = 0;

let _sessionEnergy = 0;

let _energyMilestones = [25, 50, 75, 100];

let _energyMilestonesHit = new Set();



// ═══════════════════════════════════════════

//  SETS

// ═══════════════════════════════════════════

function _updateSetBadge(n) {

  const el = document.getElementById('set-count-badge');

  if (!el) return;

  const _sAr = (typeof currentLang !== 'undefined') && currentLang === 'ar';

  el.textContent = n + (_sAr ? ' مجموعات' : ' SETS');

}

/* ── Arcade: Combo Counter ── */

function _updateComboStrip() {

  const strip = document.getElementById('combo-strip');

  const countEl = document.getElementById('combo-count');

  if (!strip || !countEl) return;

  if (_comboCount < 2) {

    strip.style.display = 'none';

    strip.classList.remove('combo-strip-glow','combo-strip-fire','combo-fire-anim');

    return;

  }

  strip.style.display = 'flex';

  countEl.textContent = 'x' + _comboCount;

  strip.classList.remove('combo-strip-glow','combo-strip-fire','combo-fire-anim');

  if (_comboCount >= 10) {

    strip.classList.add('combo-strip-fire','combo-fire-anim');

    countEl.textContent = 'x' + _comboCount + ' \uD83D\uDD25';

  } else if (_comboCount >= 5) {

    strip.classList.add('combo-strip-glow');

  }

}



function _breakCombo() {

  if (_comboCount >= 2) {

    if (typeof sndComboBreak === 'function') sndComboBreak();

    if (typeof hapComboBreak === 'function') hapComboBreak();

  }

  _comboCount = 0;

  _updateComboStrip();

}



function _incrementCombo() {

  clearTimeout(_comboTimer);

  _comboCount++;

  if (_comboCount > _bestCombo) _bestCombo = _comboCount;

  if (_comboCount >= 10) {

    if (typeof sndCombo === 'function') sndCombo(3);

    if (typeof hapCombo === 'function') hapCombo(3);

  } else if (_comboCount >= 5) {

    if (typeof sndCombo === 'function') sndCombo(2);

    if (typeof hapCombo === 'function') hapCombo(2);

  } else if (_comboCount >= 3) {

    if (typeof sndCombo === 'function') sndCombo(1);

    if (typeof hapCombo === 'function') hapCombo(1);

  } else if (_comboCount === 2) {

    if (typeof hapTap === 'function') hapTap();

  }

  if (_comboCount === 3 || _comboCount === 5 || _comboCount === 10) {

    _addEnergy(3);

  }

  _updateComboStrip();

  _comboTimer = setTimeout(_breakCombo, 90000);

}



function resetCombo() {

  clearTimeout(_comboTimer);

  _comboCount = 0;

  _bestCombo  = 0;

  _updateComboStrip();

}



/* ── Arcade: Session Energy Meter ── */

function _updateEnergyMeter() {

  const bar   = document.getElementById('session-energy-bar');

  const fill  = document.getElementById('session-energy-fill');

  const label = document.getElementById('session-energy-label');

  if (!bar || !fill || !label) return;

  fill.style.width = _sessionEnergy + '%';

  bar.classList.remove('energy-warm','energy-zone','energy-beast','energy-fire');

  if (_sessionEnergy > 90) {

    bar.classList.add('energy-fire');

    label.textContent = 'ON FIRE';

  } else if (_sessionEnergy > 60) {

    bar.classList.add('energy-beast');

    label.textContent = 'BEAST MODE';

  } else if (_sessionEnergy > 30) {

    bar.classList.add('energy-zone');

    label.textContent = 'IN THE ZONE';

  } else {

    bar.classList.add('energy-warm');

    label.textContent = 'WARMING UP';

  }

}



function _addEnergy(n) {

  const bar = document.getElementById('session-energy-bar');

  if (!bar || bar.style.display === 'none') return;

  _sessionEnergy = Math.min(100, _sessionEnergy + n);

  _updateEnergyMeter();

  _energyMilestones.forEach(m => {

    if (_sessionEnergy >= m && !_energyMilestonesHit.has(m)) {

      _energyMilestonesHit.add(m);

      if (typeof sndMilestone === 'function') sndMilestone();

    }

  });

}



function _resetEnergy() {

  _sessionEnergy = 0;

  _energyMilestonesHit = new Set();

  _updateEnergyMeter();

}



function addSet() {

  setCount++;

  _updateSetBadge(setCount);

  const prevRow = document.querySelector('.set-row:last-child');

  let prevReps = '', prevWeight = '', prevUnit = settings.defaultUnit || 'kg';

  if (prevRow) {

    prevReps   = prevRow.querySelector('.set-reps').value;

    prevWeight = prevRow.querySelector('.set-weight').value;

    prevUnit   = prevRow.querySelector('.set-unit-toggle')?.dataset?.unit || prevRow.querySelector('.set-unit')?.value || prevUnit;

  }

  const row = document.createElement('div');

  row.className = 'set-row'; row.id = 'set-' + setCount;

  row.innerHTML = `

    <div class="set-num" data-type="normal" onclick="cycleSetType(this)" title="Tap to change: Normal → Warmup → Dropset → AMRAP">${setCount}</div>

    <div class="stepper">

      <button class="step-dn" type="button" onclick="stepInput(this,-1,'reps')">−</button>

      <input type="number" min="0" inputmode="numeric" placeholder="10" class="set-reps" value="${prevReps}">

      <button class="step-up" type="button" onclick="stepInput(this,1,'reps')">+</button>

    </div>

    <div class="stepper">

      <button class="step-dn" type="button" onclick="stepInput(this,-1,'weight')">−</button>

      <input type="number" min="0" step="0.5" inputmode="decimal" placeholder="60" class="set-weight" value="${prevWeight}">

      <button class="step-up" type="button" onclick="stepInput(this,1,'weight')">+</button>

    </div>

    <button type="button" class="set-unit-toggle" data-unit="${prevUnit}" onclick="toggleSetUnit(this)">${prevUnit}</button>

    <button class="set-rpe-btn" data-rpe="" onclick="cycleRPE(this)" title="RPE (Rate of Perceived Exertion)">—</button>

    <button class="btn-icon" onclick="removeSet(${setCount})">×</button>

  `;

  document.getElementById('sets-container').appendChild(row);

  // Apply ghost placeholder if no previous row value was copied

  if (!prevReps && !prevWeight) {

    _applyGhostToRow(row, setCount - 1);

  }

  if (!('ontouchstart' in window)) row.querySelector('.set-reps').focus();

  if (typeof sndSetLog === 'function') sndSetLog();

  if (typeof hapSetLog === 'function') hapSetLog();

  if (typeof _sessionActive !== 'undefined' && _sessionActive) {

    _incrementCombo();

    _addEnergy(5);

  }

  updateRepeatBtn();

}



function removeSet(id) {

  const el = document.getElementById('set-' + id);

  if (el) el.remove();

  const rows = document.querySelectorAll('.set-row');

  setCount = rows.length;

  rows.forEach((r,i) => r.querySelector('.set-num').textContent = i+1);

  _updateSetBadge(setCount);

  updateRepeatBtn();

}



function cycleSetType(el) {

  const types = ['normal','warmup','dropset','amrap'];

  const cur = el.getAttribute('data-type') || 'normal';

  const next = types[(types.indexOf(cur) + 1) % types.length];

  el.setAttribute('data-type', next);

}



function stepInput(btn, delta, type) {

  const input = btn.parentElement.querySelector('input');

  if (!input) return;

  const current = parseFloat(input.value) || 0;

  if (type === 'weight') {

    const row = btn.closest('.set-row');

    const unit = row?.querySelector('.set-unit-toggle')?.dataset?.unit || row?.querySelector('.set-unit')?.value || 'kg';

    delta = Math.sign(delta) * (unit === 'lbs' ? 5 : 2.5);

  }

  const min = parseFloat(input.min) ?? 0;

  input.value = Math.max(min, current + delta);

}



function toggleSetUnit(btn) {

  const newUnit = btn.dataset.unit === 'kg' ? 'lbs' : 'kg';

  btn.dataset.unit = newUnit;

  btn.textContent = newUnit;

}



// ─── Numpad Picker ────────────────────────────────────────────

let _wpTarget   = null;  // the <input> we'll write back to

let _wpValue    = '';    // current string being built

let _wpIsWeight = false;



function openWheelPicker(input) {

  // Only show on touch devices

  if (!('ontouchstart' in window)) return false;

  _wpTarget   = input;

  _wpIsWeight = input.classList.contains('set-weight');

  const isReps  = input.classList.contains('set-reps');

  const isBwVal = input.classList.contains('bw-val-input');

  if (!_wpIsWeight && !isReps && !isBwVal) return false;



  // Seed display with current input value (strip trailing zeroes)

  const raw = parseFloat(input.value);

  _wpValue = (raw > 0) ? String(raw) : '';



  const row  = input.closest('.set-row');

  const unit = row?.querySelector('.set-unit-toggle')?.dataset?.unit

             || row?.querySelector('.set-unit')?.value

             || (typeof settings !== 'undefined' && settings?.defaultUnit)

             || 'kg';



  const bwType = (typeof _currentBwType !== 'undefined') ? _currentBwType : 'reps';

  const isHold = isBwVal && bwType === 'hold';



  if (_wpIsWeight) {

    document.getElementById('wp-title').textContent        = 'WEIGHT';

    document.getElementById('wp-display-unit').textContent = unit.toUpperCase();

  } else if (isHold) {

    document.getElementById('wp-title').textContent        = 'SECONDS';

    document.getElementById('wp-display-unit').textContent = '';

  } else {

    document.getElementById('wp-title').textContent        = 'REPS';

    document.getElementById('wp-display-unit').textContent = '';

  }



  // Decimal key only visible for weight

  document.getElementById('wp-key-dec').style.visibility = _wpIsWeight ? 'visible' : 'hidden';



  // Build preset chips

  const presetsEl = document.getElementById('wp-presets');

  if (_wpIsWeight) {

    const cur = parseFloat(input.value) || 0;

    presetsEl.innerHTML = [2.5,5,10,20].map(d =>

      `<button class="wp-preset wp-preset-delta" onclick="wpPresetDelta(${d},${cur})">+${d}</button>`

    ).join('');

  } else if (isHold) {

    presetsEl.innerHTML = [10,15,20,30,45,60].map(v =>

      `<button class="wp-preset" onclick="wpPreset(${v})">${v}s</button>`

    ).join('');

  } else {

    presetsEl.innerHTML = [5,6,8,10,12,15,20,25,30].map(v =>

      `<button class="wp-preset" onclick="wpPreset(${v})">${v}</button>`

    ).join('');

  }



  _wpRefreshDisplay();

  // Dismiss any visible toast so it can't intercept button taps

  if (typeof dismissToast === 'function') dismissToast();

  document.getElementById('wheel-picker-overlay').classList.add('open');

  // Install nuclear capture listener — intercepts all touches at OS level

  _wpInstallCapture();

  return true;

}



function _wpRefreshDisplay() {

  const el = document.getElementById('wp-display-val');

  if (el) el.textContent = _wpValue || '0';

}



function wpKey(k) {

  if (k === 'del') {

    if (!_wpValue) return;

    _wpValue = _wpValue.slice(0, -1);

  } else if (k === '.') {

    if (!_wpIsWeight || _wpValue.includes('.')) return;

    _wpValue = (_wpValue || '0') + '.';

  } else {

    const [intPart] = (_wpValue || '').split('.');

    if (intPart.length >= 4) return;

    if (_wpValue === '0') _wpValue = k;

    else _wpValue += k;

  }

  _wpRefreshDisplay();

  // Haptic feedback

  if (typeof hapTap === 'function') hapTap();

  // Voice feedback — speak the current display value

  _wpSpeak(_wpValue || '0');

}



/* Speak via Web Speech API (respects soundOn) */

function _wpSpeak(text) {

  if (typeof soundOn !== 'undefined' && !soundOn) return;

  if (!('speechSynthesis' in window)) return;

  try {

    speechSynthesis.cancel();

    const utt = new SpeechSynthesisUtterance(text);

    utt.volume = 0.9;

    utt.rate   = 1.3;

    utt.pitch  = 1;

    speechSynthesis.speak(utt);

  } catch (e) {}

}



function wpPreset(v) {

  _wpValue = String(v);

  _wpRefreshDisplay();

}



function wpPresetDelta(delta, base) {

  const result = (parseFloat(base) || 0) + delta;

  // Round to 1 decimal to avoid float noise

  _wpValue = String(Math.round(result * 10) / 10);

  _wpRefreshDisplay();

}



// Document-level capture listener installed while picker is open.

// Fires before any other handler, preventing Android gesture detection

// and ensuring taps always reach the correct button regardless of z-index.

let _wpTouchCapture = null;



function _wpInstallCapture() {

  if (_wpTouchCapture) return; // already installed

  _wpTouchCapture = function(e) {

    const overlay = document.getElementById('wheel-picker-overlay');

    if (!overlay || !overlay.classList.contains('open')) return;

    const touch = e.touches[0];

    if (!touch) return;

    const tx = touch.clientX, ty = touch.clientY;



    // 1. Check if touch lands on a numpad key using exact bounding rects.

    //    getBoundingClientRect is reliable; elementFromPoint can miss due to

    //    z-index or stacking context ambiguity.

    const numpad = document.getElementById('wp-numpad');

    if (numpad) {

      const buttons = numpad.querySelectorAll('[data-key]');

      for (const btn of buttons) {

        const r = btn.getBoundingClientRect();

        if (tx >= r.left && tx <= r.right && ty >= r.top && ty <= r.bottom) {

          e.preventDefault();

          e.stopPropagation();

          wpKey(btn.dataset.key);

          btn.classList.add('wp-active');

          setTimeout(() => btn.classList.remove('wp-active'), 120);

          return;

        }

      }

    }



    // 2. Check if touch is anywhere inside the sheet (cancel, done, presets, etc.)

    //    — let those through to their own onclick handlers.

    const sheet = document.getElementById('wheel-picker-sheet');

    if (sheet) {

      const r = sheet.getBoundingClientRect();

      if (tx >= r.left && tx <= r.right && ty >= r.top && ty <= r.bottom) {

        return; // inside sheet, not a numpad key — handle normally

      }

    }



    // 3. Tap landed on the overlay background — block it completely.

    //    Prevents accidental picker dismissal and stops touch leaking to

    //    elements behind the overlay (rest timer, etc.).

    e.preventDefault();

    e.stopPropagation();

  };

  document.addEventListener('touchstart', _wpTouchCapture, { capture: true, passive: false });

}



function _wpRemoveCapture() {

  if (_wpTouchCapture) {

    document.removeEventListener('touchstart', _wpTouchCapture, { capture: true });

    _wpTouchCapture = null;

  }

}



function closeWheelPicker() {

  document.getElementById('wheel-picker-overlay').classList.remove('open');

  _wpRemoveCapture();

  _wpTarget = null;

}



function confirmWheelPicker() {

  if (!_wpTarget) { closeWheelPicker(); return; }

  const val = parseFloat(_wpValue) || 0;

  _wpTarget.value = _wpIsWeight ? val : Math.round(val);

  if (_wpTarget.classList && _wpTarget.classList.contains('bw-val-input') && typeof onBwNumpadConfirm === 'function') {

    onBwNumpadConfirm(_wpTarget.value);

  }

  if (typeof hapSetLog === 'function') hapSetLog();

  _wpSpeak('confirmed');

  closeWheelPicker();

}



// Hook inputs — tap-detection prevents picker opening during scroll gestures

document.addEventListener('DOMContentLoaded', () => {

  const container = document.getElementById('sets-container');

  if (!container) return;

  if (!('ontouchstart' in window)) return; // desktop: normal keyboard



  let _tapY = 0, _tapX = 0;



  // Record touch-start position

  container.addEventListener('touchstart', e => {

    if (e.touches.length === 1) {

      _tapY = e.touches[0].clientY;

      _tapX = e.touches[0].clientX;

    }

  }, { passive: true });



  // Only open picker when touch ended close to where it started (tap, not scroll)

  container.addEventListener('touchend', e => {

    const inp = e.target.closest('.set-weight, .set-reps');

    if (!inp) return;

    const dy = Math.abs(e.changedTouches[0].clientY - _tapY);

    const dx = Math.abs(e.changedTouches[0].clientX - _tapX);

    if (dy > 8 || dx > 8) return; // scroll/swipe — ignore

    e.preventDefault(); // block keyboard from appearing

    inp.blur();

    openWheelPicker(inp);

  }, { passive: false });

});



function updateRepeatBtn() {

  const btn = document.getElementById('btn-repeat-last');

  if (!btn) return;

  const hasSets = document.querySelectorAll('.set-row').length > 0;

  btn.style.display = (workouts.length > 0 && !hasSets) ? 'flex' : 'none';

}



function repeatLastWorkout() {

  if (!workouts.length) return;

  const last = workouts[workouts.length - 1];

  selectMuscle(last.muscle);

  document.getElementById('exercise-name').value = last.exercise;

  updateLastSessionHint();

  document.getElementById('sets-container').innerHTML = '';

  setCount = 0;

  _updateSetBadge(0);

  if (last.sets && last.sets.length) {

    last.sets.forEach(s => {

      addSet();

      const row = document.querySelector('.set-row:last-child');

      if (!row) return;

      row.querySelector('.set-reps').value = s.reps;

      row.querySelector('.set-weight').value = s.weight;

      const unitSel = row.querySelector('.set-unit');

      if (unitSel && s.unit) unitSel.value = s.unit;

      if (s.type && s.type !== 'normal') {

        const numEl = row.querySelector('.set-num');

        if (numEl) numEl.setAttribute('data-type', s.type);

      }

    });

  }

  showToast(typeof t==='function' && currentLang==='ar' ? 'تم تحميل آخر تمرين!' : 'Last workout loaded', 'success');

  updateRepeatBtn();

}



// saveWorkout() is defined in the BODYWEIGHT/STEPS block below — it dispatches

// to _saveWeightedWorkout() or saveBwWorkout() based on current mode.



// (updateStatBar defined later with full gamification support)



function calcStreak() {

  const wDates = (typeof workouts !== 'undefined' ? workouts : []).map(w => w && w.date);

  const bwDates = (typeof bwWorkouts !== 'undefined' ? bwWorkouts : []).map(w => w && w.date);

  const cardioDates = (typeof cardioLog !== 'undefined' ? cardioLog : []).map(c => c && c.date);



  const allDatesRaw = [...wDates, ...bwDates, ...cardioDates].filter(Boolean);

  if (!allDatesRaw.length) return 0;



  const days = [...new Set(allDatesRaw.map(d => new Date(d).toDateString()))]

    .sort((a, b) => new Date(b) - new Date(a));



  let streak = 0;

  let d = new Date();

  for (const day of days) {

    if (new Date(day).toDateString() === d.toDateString()) {

      streak++;

      d.setDate(d.getDate() - 1);

    } else {

      break;

    }

  }

  return streak;

}



// ═══════════════════════════════════════════

//  BODY WEIGHT

// ═══════════════════════════════════════════

function logBodyWeight() {

  const val  = parseFloat(document.getElementById('bw-input').value);

  const unit = document.getElementById('bw-unit').value;

  if (!val || val < 20 || val > 500) { showToast('Enter a valid weight!'); return; }

  bodyWeight.push({ date: new Date().toISOString(), weight: val, unit });

  save();

  document.getElementById('bw-input').value = '';

  showToast(typeof t==='function' && currentLang==='ar' ? 'تم تسجيل وزن الجسم!' : 'Body weight logged!');

  renderBWChart();

  renderBWHistory();

}



function renderBWChart() {

  if (bwChrt) bwChrt.destroy();

  const ctx  = document.getElementById('bw-chart').getContext('2d');

  const data = [...bodyWeight].slice(-30);

  if (!data.length) return;

  const grad = ctx.createLinearGradient(0,0,0,180);

  grad.addColorStop(0,'rgba(57,255,143,.25)'); grad.addColorStop(1,'rgba(57,255,143,0)');

  bwChrt = new Chart(ctx, {

    type:'line',

    data:{

      labels: data.map(d => new Date(d.date).toLocaleDateString('en-GB',{month:'short',day:'numeric'})),

      datasets:[{

        label:'Body Weight', data: data.map(d => d.weight),

        borderColor:'#39ff8f', borderWidth:2, backgroundColor:grad,

        fill:true, tension:.4, pointBackgroundColor:'#39ff8f', pointRadius:4, pointHoverRadius:7

      }]

    },

    options: mkChartOpts()

  });

}



function renderBWHistory() {

  const list = [...bodyWeight].reverse().slice(0, 15);

  const el = document.getElementById('bw-history-list');

  if (!el) return;

  const isAr = typeof currentLang !== 'undefined' && currentLang === 'ar';

  const toKg = (n, unit) => String(unit || 'kg').toLowerCase() === 'lbs' ? (+n * 0.453592) : +n;

  const fmt = (d) => new Date(d).toLocaleDateString(isAr ? 'ar-SA' : 'en-GB', { month: 'short', day: 'numeric' });

  const txt = {

    latest: isAr ? 'أحدث قياس' : 'Latest check-in',

    bodyFat: isAr ? 'دهون' : 'Body Fat',

    muscle: isAr ? 'عضلات' : 'Muscle'

  };

  if (!list.length) {

    el.innerHTML = `<div class="empty-state"><div class="empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div><div class="empty-title">${t('bcomp.noEntries')}</div></div>`;

    return;

  }

  el.innerHTML = '<div style="padding:4px 0;">' + list.map((e,i) => {

    const prev = list[i + 1];

    let dc = 'same', dt = '';

    if (prev) {

      const diffKg = toKg(e.weight, e.unit) - toKg(prev.weight, prev.unit);

      const diff = diffKg.toFixed(1);

      if (diffKg > 0) { dc = 'up'; dt = '+' + diff + ' kg'; }

      else if (diffKg < 0) { dc = 'down'; dt = diff + ' kg'; }

      else { dt = '—'; }

    }

    const bfStr = Number.isFinite(parseFloat(e.bodyFat))

      ? `<span class="bw-meta-chip bf">${txt.bodyFat}: ${(+e.bodyFat).toFixed(1).replace(/\.0$/, '')}%</span>`

      : '';

    const mmStr = Number.isFinite(parseFloat(e.muscleMass))

      ? `<span class="bw-meta-chip mm">${txt.muscle}: ${(+e.muscleMass).toFixed(1).replace(/\.0$/, '')} ${e.unit || 'kg'}</span>`

      : '';

    const latestChip = i === 0 ? `<span class="bw-meta-chip">${txt.latest}</span>` : '';

    return '<div class="bw-row">'

      + '<div class="bw-date">' + fmt(e.date) + '</div>'

      + '<div class="bw-val" style="flex:1;">' + (+e.weight).toFixed(1).replace(/\.0$/, '') + ' <span style="font-family:\'DM Mono\';font-size:10px;color:var(--text3);">' + (e.unit || 'kg') + '</span>'

      + ((bfStr || mmStr || latestChip) ? `<div class="bw-meta-row">${latestChip}${bfStr}${mmStr}</div>` : '')

      + '</div>'

      + (prev ? '<div class="bw-delta ' + dc + '">' + dt + '</div>' : '')

      + '</div>';

  }).join('') + '</div>';

}



// ═══════════════════════════════════════════

//  WATER TRACKER

// ═══════════════════════════════════════════

function initWater() {

  const grid = document.getElementById('water-grid');

  if (!grid) return;

  const goal = _waterGoalCups || 8;

  grid.innerHTML = '';

  // Adjust grid columns to match goal

  grid.style.gridTemplateColumns = `repeat(${Math.min(goal,8)},1fr)`;

  for (let i = 0; i < goal; i++) {

    const cup = document.createElement('div');

    cup.className = 'water-cup' + (waterToday.includes(i) ? ' filled' : '');

    cup.onclick = () => toggleWater(i);

    grid.appendChild(cup);

  }

  const waterL = (goal * 0.25).toFixed(1);

  const badge = document.getElementById('water-badge');

  if (badge) badge.textContent = waterToday.length + ' / ' + goal + ' cups  (' + waterL + 'L goal)';

}



function toggleWater(i) {

  const goal = _waterGoalCups || 8;

  const wasAtGoal = waterToday.length >= goal;

  if (waterToday.includes(i)) waterToday = waterToday.filter(x => x !== i);

  else waterToday.push(i);

  save(); initWater();

  if (typeof _updateHdrWater === 'function') _updateHdrWater();

  const isAr = typeof currentLang !== 'undefined' && currentLang === 'ar';

  const waterL = (goal * 0.25).toFixed(1);

  if (!wasAtGoal && waterToday.length >= goal) {

    _waterCelebration(waterL, isAr);

  }

}



// ═══════════════════════════════════════════

//  TEMPLATES

// ═══════════════════════════════════════════

// SVG icons that inherit currentColor (theme-aware)

const _SVG_PUSH = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v16M18 4v16M6 12h12"/><circle cx="6" cy="4" r="1.5"/><circle cx="18" cy="4" r="1.5"/><circle cx="6" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>`;

const _SVG_PULL = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7-7 7 7"/></svg>`;

const _SVG_LEGS = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3c0 0 1 2 1 5s-2 6-2 9c0 1.5.5 3 2 4"/><path d="M16 3c0 0-1 2-1 5s2 6 2 9c0 1.5-.5 3-2 4"/><path d="M9 16c1 1.5 3 2 5 1"/></svg>`;

const DEFAULT_TEMPLATES = [

  {id:'t1', name:'Push Day', muscle:'Chest', exercises:'Bench Press, Incline DB Press, Cable Fly', icon:_SVG_PUSH},

  {id:'t2', name:'Pull Day', muscle:'Back',  exercises:'Deadlift, Bent Row, Lat Pulldown',         icon:_SVG_PULL},

  {id:'t3', name:'Leg Day',  muscle:'Legs',  exercises:'Squat, Romanian DL, Leg Press',            icon:_SVG_LEGS}

];



function renderTemplates() {

  const all = [...DEFAULT_TEMPLATES, ...templates];

  const list = document.getElementById('template-list');

  if (!list) return;

  list.innerHTML = all.map(t => `

    <button class="template-btn" onclick="loadTemplate('${t.id}','${t.muscle}','${t.exercises.split(',')[0].trim()}')">

      <div class="template-icon">${t.icon}</div>

      <div>

        <div class="template-name">${t.name}</div>

        <div class="template-sub">${t.exercises}</div>

      </div>

    </button>`).join('');

  renderTemplateStrip();

}



function renderTemplateStrip() {

  const wrap = document.getElementById('template-strip-wrap');

  const strip = document.getElementById('template-strip');

  if (!wrap || !strip) return;

  const all = [...DEFAULT_TEMPLATES, ...templates];

  if (!all.length) { wrap.style.display = 'none'; return; }

  wrap.style.display = 'block';

  strip.innerHTML = all.map(t => {

    const firstEx = t.exercises.split(',')[0].trim();

    return `<button class="template-strip-pill" onclick="loadTemplate('${t.id}','${t.muscle}','${firstEx}')" title="${t.exercises}">

      <span class="template-strip-icon">${t.icon}</span>${t.name}

    </button>`;

  }).join('');

}



function loadTemplate(id, muscle, exercise) {

  const tmpl = [...DEFAULT_TEMPLATES, ...templates].find(t => t.id === id);

  if (!tmpl) return;

  selectMuscle(tmpl.muscle);

  document.getElementById('exercise-name').value = exercise;

  updateLastSessionHint();

  if (document.querySelectorAll('.set-row').length === 0) loadLastSessionSets(exercise);

  showToast(typeof t==='function' && currentLang==='ar' ? 'تم تحميل القالب!' : 'Template loaded!');

  window.scrollTo({ top: 0, behavior: 'smooth' });

}



// ═══════════════════════════════════════════

//  TRAINING PROGRAMS (PPL / 5/3/1 / 5×5)

// ═══════════════════════════════════════════

const TRAINING_PROGRAMS = [

  {

    id:'ppl', name:'Push / Pull / Legs', short:'PPL',

    desc:'6-day split · hypertrophy focus', color:'#e74c3c',

    days:[

      {label:'Push A',  muscle:'Chest',     exs:['Barbell Bench Press','Incline Barbell Press','Cable Fly'],        note:'3-4 × 8-12'},

      {label:'Pull A',  muscle:'Back',      exs:['Pull-Up','Barbell Row','Face Pull'],                             note:'3-4 × 8-12'},

      {label:'Legs A',  muscle:'Legs',      exs:['Barbell Back Squat','Leg Press','Leg Extension'],                note:'3-4 × 10-15'},

      {label:'Push B',  muscle:'Shoulders', exs:['Barbell Overhead Press','Lateral Raise','Dip (Chest)'],         note:'3-4 × 8-12'},

      {label:'Pull B',  muscle:'Back',      exs:['Barbell Deadlift','Lat Pulldown','Barbell Curl'],               note:'4 × 6-10'},

      {label:'Legs B',  muscle:'Legs',      exs:['Barbell Back Squat','Leg Curl (Lying)','Bulgarian Split Squat'],note:'3-4 × 10-15'},

      {label:'Rest',    muscle:null,        exs:[],                                                                note:'Active recovery'},

    ]

  },

  {

    id:'531', name:'Wendler 5/3/1', short:'5/3/1',

    desc:'4-day strength · progressive overload', color:'#e67e22',

    days:[

      {label:'Squat',    muscle:'Legs',      exs:['Barbell Back Squat','Leg Press','Leg Curl (Lying)'],          note:'5/3/1 + 5×10 FSL'},

      {label:'Bench',    muscle:'Chest',     exs:['Barbell Bench Press','Dumbbell Bench Press','Skull Crusher'],  note:'5/3/1 + 5×10 FSL'},

      {label:'Rest',     muscle:null,        exs:[],                                                              note:'Recovery'},

      {label:'Deadlift', muscle:'Back',      exs:['Barbell Deadlift','Barbell Row','Lat Pulldown'],             note:'5/3/1 (1×5 DL)'},

      {label:'OHP',      muscle:'Shoulders', exs:['Barbell Overhead Press','Lateral Raise','Barbell Curl'],     note:'5/3/1 + 5×10 FSL'},

      {label:'Rest',     muscle:null,        exs:[],                                                             note:'Recovery'},

      {label:'Rest',     muscle:null,        exs:[],                                                             note:'Recovery'},

    ]

  },

  {

    id:'sl5x5', name:'Stronglifts 5×5', short:'5×5',

    desc:'3-day full-body · beginner strength', color:'#2ecc71',

    days:[

      {label:'Workout A', muscle:'Chest', exs:['Barbell Back Squat','Barbell Bench Press','Barbell Row'],         note:'5 × 5 · +2.5kg/session'},

      {label:'Rest',      muscle:null,   exs:[],                                                                   note:'Rest'},

      {label:'Workout B', muscle:'Back', exs:['Barbell Back Squat','Barbell Overhead Press','Barbell Deadlift'], note:'5 × 5 · DL 1×5'},

      {label:'Rest',      muscle:null,   exs:[],                                                                   note:'Rest'},

      {label:'Workout A', muscle:'Chest',exs:['Barbell Back Squat','Barbell Bench Press','Barbell Row'],          note:'5 × 5 · +2.5kg/session'},

      {label:'Rest',      muscle:null,   exs:[],                                                                   note:'Rest'},

      {label:'Rest',      muscle:null,   exs:[],                                                                   note:'Rest'},

    ]

  },

  {

    tree: "Pull (Horizontal)", muscle: "Back", icon: "ًں‹",

    levels: [

      { l: 1, n: "Bodyweight Row",        t: "reps", target: 12 },

      { l: 2, n: "Elevated Row",          t: "reps", target: 10 },

      { l: 3, n: "Inverted Row",          t: "reps", target: 8 },

      { l: 4, n: "Archer Row",            t: "reps", target: 6 },

      { l: 5, n: "One-Arm Body Row",      t: "reps", target: 4 }

    ]

  },

  {

    tree: "Handstand", muscle: "Shoulders", icon: "ًں•",

    levels: [

      { l: 1, n: "Wall Plank",             t: "hold", target: 40 },

      { l: 2, n: "Wall Kick-Up",           t: "reps", target: 12 },

      { l: 3, n: "Wall Handstand",         t: "hold", target: 30 },

      { l: 4, n: "Freestanding Handstand", t: "hold", target: 15 },

      { l: 5, n: "Handstand Push-Up",      t: "reps", target: 6 }

    ]

  },

  {

    tree: "Core (Dynamic)", muscle: "Core", icon: "ًں¡",

    levels: [

      { l: 1, n: "Hollow Rock",          t: "reps", target: 20 },

      { l: 2, n: "Hanging Knee Raise",   t: "reps", target: 12 },

      { l: 3, n: "Tuck Dragon Flag",     t: "reps", target: 8 },

      { l: 4, n: "Dragon Flag",          t: "reps", target: 5 }

    ]

  },

  {

    tree: "Legs (Explosive)", muscle: "Legs", icon: "ًں«",

    levels: [

      { l: 1, n: "Jump Squat",             t: "reps", target: 15 },

      { l: 2, n: "Alternating Lunge Jump", t: "reps", target: 12 },

      { l: 3, n: "Tuck Jump",              t: "reps", target: 10 },

      { l: 4, n: "Single-Leg Box Jump",    t: "reps", target: 8 }

    ]

  }

];



// ── B1: RPE cycle function ──────────────────────────────────────

function cycleRPE(btn) {

  const vals = ['', '6', '7', '7.5', '8', '8.5', '9', '9.5', '10', 'F'];

  const cur = btn.dataset.rpe || '';

  const next = vals[(vals.indexOf(cur) + 1) % vals.length];

  btn.dataset.rpe = next;

  btn.textContent = next || '—';

  btn.classList.toggle('rpe-active', !!next);

}



// ── B2: Exercise swap alternatives ─────────────────────────────

const EXERCISE_SWAPS = {

  // CHEST

  'Barbell Bench Press':   ['Dumbbell Bench Press','Machine Chest Press','Push-Up','Dip (Chest)','Landmine Press'],

  'Dumbbell Bench Press':  ['Barbell Bench Press','Cable Fly','Pec Deck / Machine Fly','Push-Up'],

  'Incline Barbell Press': ['Incline Dumbbell Press','Cable Fly','Push-Up','Landmine Press'],

  'Incline Dumbbell Press':['Incline Barbell Press','Cable Fly','Pec Deck / Machine Fly'],

  'Push-Up':               ['Dumbbell Bench Press','Barbell Bench Press','Dip (Chest)','Cable Fly'],

  'Dip (Chest)':           ['Push-Up','Dumbbell Bench Press','Pec Deck / Machine Fly'],

  'Cable Fly':             ['Pec Deck / Machine Fly','Dumbbell Bench Press','Push-Up'],

  // BACK

  'Barbell Deadlift':      ['Romanian Deadlift','Trap Bar Deadlift','Dumbbell Row','Seated Cable Row'],

  'Pull-Up':               ['Lat Pulldown','Assisted Pull-Up','Chin-Up','Seated Cable Row'],

  'Chin-Up':               ['Pull-Up','Lat Pulldown','Dumbbell Row'],

  'Barbell Row':           ['Dumbbell Row','Seated Cable Row','T-Bar Row','Chest-Supported Row'],

  'Dumbbell Row':          ['Barbell Row','Seated Cable Row','T-Bar Row'],

  'Seated Cable Row':      ['Dumbbell Row','Barbell Row','Face Pull'],

  'Lat Pulldown':          ['Pull-Up','Chin-Up','Seated Cable Row'],

  // SHOULDERS

  'Barbell Overhead Press':['Dumbbell Shoulder Press','Seated Dumbbell Press','Arnold Press','Machine Shoulder Press'],

  'Dumbbell Shoulder Press':['Barbell Overhead Press','Arnold Press','Machine Shoulder Press'],

  'Lateral Raise':         ['Cable Lateral Raise','Machine Lateral Raise'],

  'Face Pull':             ['Rear Delt Fly','Reverse Cable Fly','Band Pull-Apart'],

  // LEGS

  'Barbell Back Squat':    ['Goblet Squat','Leg Press','Bulgarian Split Squat','Hack Squat'],

  'Barbell Front Squat':   ['Goblet Squat','Barbell Back Squat','Leg Press'],

  'Romanian Deadlift':     ['Dumbbell Romanian Deadlift','Barbell Deadlift','Leg Curl'],

  'Leg Press':             ['Barbell Back Squat','Hack Squat','Goblet Squat'],

  'Bulgarian Split Squat': ['Lunges','Leg Press','Goblet Squat'],

  'Barbell Hip Thrust':    ['Glute Bridge','Cable Kickback','Romanian Deadlift'],

  // ARMS

  'Barbell Curl':          ['Dumbbell Curl','EZ-Bar Curl','Cable Curl','Hammer Curl'],

  'Dumbbell Curl':         ['Barbell Curl','EZ-Bar Curl','Hammer Curl','Cable Curl'],

  'Skull Crusher':         ['Overhead Dumbbell Extension','Cable Tricep Pushdown','Dip (Tricep)','Close-Grip Bench Press'],

  'Cable Tricep Pushdown': ['Skull Crusher','Overhead Dumbbell Extension','Dip (Tricep)'],

  // CORE

  'Crunch':                ['Cable Crunch','Sit-Up','Leg Raise','Plank'],

  'Plank':                 ['Dead Bug','Hollow Body Hold','Ab Wheel Rollout'],

};



// ══════════════════════════════════════════

//  CALISTHENICS SKILL TREES

//  Progressive overload via leverage/variation

// ══════════════════════════════════════════

const CALISTHENICS_TREES = [

  {

    tree: "Push (Horizontal)", muscle: "Chest", icon: "🤸",

    levels: [

      { l: 1, n: "Wall Push-Up",    t: "reps", target: 20 },

      { l: 2, n: "Incline Push-Up", t: "reps", target: 15 },

      { l: 3, n: "Push-Up",         t: "reps", target: 20 },

      { l: 4, n: "Diamond Push-Up", t: "reps", target: 15 },

      { l: 5, n: "Archer Push-Up",  t: "reps", target: 10 },

      { l: 6, n: "One-Arm Push-Up", t: "reps", target: 5  }

    ]

  },

  {

    tree: "Pull (Vertical)", muscle: "Back", icon: "🏋️",

    levels: [

      { l: 1, n: "Dead Hang",       t: "hold", target: 30 },

      { l: 2, n: "Negative Pull-Up",t: "reps", target: 8  },

      { l: 3, n: "Pull-Up",         t: "reps", target: 12 },

      { l: 4, n: "L-Sit Pull-Up",   t: "reps", target: 8  },

      { l: 5, n: "Archer Pull-Up",  t: "reps", target: 6  },

      { l: 6, n: "Muscle-Up",       t: "reps", target: 3  }

    ]

  },

  {

    tree: "Dip (Vertical Push)", muscle: "Triceps", icon: "💪",

    levels: [

      { l: 1, n: "Bench Dip",          t: "reps", target: 20 },

      { l: 2, n: "Straight Bar Dip",   t: "reps", target: 15 },

      { l: 3, n: "Parallel Bar Dip",   t: "reps", target: 15 },

      { l: 4, n: "Ring Dip",           t: "reps", target: 10 }

    ]

  },

  {

    tree: "Front Lever", muscle: "Back", icon: "🦇",

    levels: [

      { l: 1, n: "Tuck Front Lever",       t: "hold", target: 20 },

      { l: 2, n: "Adv. Tuck Front Lever",  t: "hold", target: 15 },

      { l: 3, n: "Straddle Front Lever",   t: "hold", target: 10 },

      { l: 4, n: "Full Front Lever",       t: "hold", target: 5  }

    ]

  },

  {

    tree: "Planche", muscle: "Shoulders", icon: "🛸",

    levels: [

      { l: 1, n: "Plank Lean",         t: "hold", target: 30 },

      { l: 2, n: "Frog Stand",         t: "hold", target: 20 },

      { l: 3, n: "Tuck Planche",       t: "hold", target: 15 },

      { l: 4, n: "Adv. Tuck Planche",  t: "hold", target: 10 },

      { l: 5, n: "Straddle Planche",   t: "hold", target: 8  },

      { l: 6, n: "Full Planche",       t: "hold", target: 5  }

    ]

  },

  {

    tree: "Legs", muscle: "Legs", icon: "🦵",

    levels: [

      { l: 1, n: "Assisted Squat",       t: "reps", target: 20 },

      { l: 2, n: "Bodyweight Squat",     t: "reps", target: 30 },

      { l: 3, n: "Bulgarian Split Squat",t: "reps", target: 15 },

      { l: 4, n: "Assisted Pistol Squat",t: "reps", target: 10 },

      { l: 5, n: "Pistol Squat",         t: "reps", target: 5  }

    ]

  },

  {

    tree: "Core (Statics)", muscle: "Core", icon: "🔥",

    levels: [

      { l: 1, n: "Plank",        t: "hold", target: 60 },

      { l: 2, n: "Hollow Body",  t: "hold", target: 45 },

      { l: 3, n: "Tuck L-Sit",   t: "hold", target: 20 },

      { l: 4, n: "L-Sit",        t: "hold", target: 15 },

      { l: 5, n: "V-Sit",        t: "hold", target: 10 }

    ]

  },

  {

    tree: "Pull (Horizontal)", muscle: "Back", icon: "🪢",

    levels: [

      { l: 1, n: "Bodyweight Row",        t: "reps", target: 12 },

      { l: 2, n: "Elevated Row",          t: "reps", target: 10 },

      { l: 3, n: "Inverted Row",          t: "reps", target: 8 },

      { l: 4, n: "Archer Row",            t: "reps", target: 6 },

      { l: 5, n: "One-Arm Body Row",      t: "reps", target: 4 }

    ]

  },

  {

    tree: "Handstand", muscle: "Shoulders", icon: "🤸‍♂️",

    levels: [

      { l: 1, n: "Wall Plank",             t: "hold", target: 40 },

      { l: 2, n: "Wall Kick-Up",           t: "reps", target: 12 },

      { l: 3, n: "Wall Handstand",         t: "hold", target: 30 },

      { l: 4, n: "Freestanding Handstand", t: "hold", target: 15 },

      { l: 5, n: "Handstand Push-Up",      t: "reps", target: 6 }

    ]

  },

  {

    tree: "Core (Dynamic)", muscle: "Core", icon: "🌪️",

    levels: [

      { l: 1, n: "Hollow Rock",          t: "reps", target: 20 },

      { l: 2, n: "Hanging Knee Raise",   t: "reps", target: 12 },

      { l: 3, n: "Tuck Dragon Flag",     t: "reps", target: 8 },

      { l: 4, n: "Dragon Flag",          t: "reps", target: 5 }

    ]

  },

  {

    tree: "Legs (Explosive)", muscle: "Legs", icon: "💥",

    levels: [

      { l: 1, n: "Jump Squat",             t: "reps", target: 15 },

      { l: 2, n: "Alternating Lunge Jump", t: "reps", target: 12 },

      { l: 3, n: "Tuck Jump",              t: "reps", target: 10 },

      { l: 4, n: "Single-Leg Box Jump",    t: "reps", target: 8 }

    ]

  }

];



// Flat BW_EXERCISES array generated from trees — keeps history backward-compatible

const BW_EXERCISES = [];

function rebuildBwExercises() {
  BW_EXERCISES.length = 0;
  CALISTHENICS_TREES.forEach(tree => {
    tree.levels.forEach(lvl => {
      BW_EXERCISES.push({
        name: lvl.n,
        icon: tree.icon,
        muscle: tree.muscle,
        type: lvl.t,
        tree: tree.tree,
        level: lvl.l,
        target: lvl.target
      });
    });
  });
}

rebuildBwExercises();



// Tap detection for BW sets container (prevents picker opening mid-scroll)

document.addEventListener('DOMContentLoaded', () => {

  const bwContainer = document.getElementById('bw-sets-container');

  if (!bwContainer || !('ontouchstart' in window)) return;

  let _bwTapY = 0, _bwTapX = 0;

  bwContainer.addEventListener('touchstart', e => {

    if (e.touches.length === 1) { _bwTapY = e.touches[0].clientY; _bwTapX = e.touches[0].clientX; }

  }, { passive: true });

  bwContainer.addEventListener('touchend', e => {

    const inp = e.target.closest('.bw-val-input');

    if (!inp) return;

    const dy = Math.abs(e.changedTouches[0].clientY - _bwTapY);

    const dx = Math.abs(e.changedTouches[0].clientX - _bwTapX);

    if (dy > 8 || dx > 8) return;

    e.preventDefault();

    inp.blur();

    openWheelPicker(inp);

  }, { passive: false });

});



/* ── Session Start Ceremony ── */

var _ceremonyCancelled = false;



function _skipSessionCeremony() {

  _ceremonyCancelled = true;

  var overlay = document.getElementById('session-start-overlay');

  if (overlay) overlay.classList.remove('active');

  _initSessionArcade();

}



function _initSessionArcade() {

  var bar = document.getElementById('session-energy-bar');

  if (bar) bar.style.display = '';

  _resetEnergy();

  resetCombo();

}



function playSessionCeremony() {

  _ceremonyCancelled = false;

  var overlay = document.getElementById('session-start-overlay');

  var num     = document.getElementById('session-countdown-num');

  if (!overlay || !num) { _initSessionArcade(); return; }



  if (typeof sndSessionStart === 'function') sndSessionStart();

  if (typeof hapSessionStart === 'function') hapSessionStart();



  overlay.classList.add('active');

  var steps = ['3','2','1','FORGE!'];

  var i = 0;



  function _nextStep() {

    if (_ceremonyCancelled) return;

    if (i >= steps.length) {

      overlay.classList.remove('active');

      _initSessionArcade();

      return;

    }

    num.textContent = steps[i];

    num.classList.remove('pop');

    void num.offsetWidth;

    num.classList.add('pop');

    if (typeof hapTap === 'function') hapTap();

    i++;

    setTimeout(_nextStep, i < steps.length ? 380 : 500);

  }

  _nextStep();

}



