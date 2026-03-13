// FORGE Gym Tracker — i18n / Multilingual System
// Auto-extracted from index.html — edit here for future translation changes.

// ─────────────────────────────────────────────────────────
//  TRANSLATION DICTIONARY
// ─────────────────────────────────────────────────────────
const LANGS = {
  en: {
    // Header
    'app.title': 'FORGE',
    'app.subtitle': '// Gym OS',
    'header.edit': 'Edit',
    'header.done': 'DONE',
    'header.editLayout': 'EDIT LAYOUT',
    'header.editHint': '↑↓ reorder · toggle visibility',

    // Mode toggle
    'mode.weighted': 'Weighted',
    'mode.bodyweight': 'Bodyweight',

    // Sections
    'section.steps': 'Steps',
    'section.timer': 'Rest Timer',
    'section.indicators': 'Smart Stats',
    'section.mission': "Today's Mission",
    'section.templates': 'Templates',
    'section.bodymap': 'Body Map',
    'section.coach': 'AI Coach',

    // Steps panel
    'steps.title': 'Daily Steps',
    'steps.goal': 'Goal',
    'steps.add': '+ Add Steps',
    'steps.addBtn': 'Add',
    'steps.streak': 'Day Streak',
    'steps.today': 'Today',
    'steps.placeholder': 'Enter steps...',

    // Timer
    'timer.title': 'Rest Timer',
    'timer.start': '▶ Start',
    'timer.reset': '■ Reset',
    'timer.go': 'GO!',

    // Indicators
    'ind.volume': "Today's Volume",
    'ind.streak': 'Day Streak',
    'ind.prs': 'Total PRs',
    'ind.week': 'This Week',
    'ind.allTime': 'All time',
    'ind.sessions': 'Sessions',
    'ind.start': 'Start logging',
    'ind.keepGoing': 'Keep going!',

    // Mission
    'mission.title': "TODAY'S MISSION",
    'mission.complete': 'COMPLETE',
    'mission.locked': 'LOCKED',
    'mission.reward': 'Reward',

    // Workout form
    'form.muscle': 'Muscle Group',
    'form.exercise': 'Exercise Name',
    'form.exercisePlaceholder': 'e.g. Bench Press, Squat…',
    'form.set': 'SET',
    'form.sets': 'Sets',
    'form.weight': 'WEIGHT',
    'form.reps': 'REPS',
    'form.addSet': '+ Add Set',
    'form.save': 'Log Workout',
    'form.lastHint': 'Last Session',
    'form.unit': 'UNIT',
    'form.notes': 'Notes',
    'form.notesOptional': 'Notes (optional)',
    'form.notesPlaceholder': 'How did it feel? Any PRs?',
    'form.selectMuscle': 'Select Muscle',
    'form.selectExercise': 'Select Exercise',
    'form.quickSelect': 'Quick Select',
    'form.recent': 'Recent',
    'form.targeting': 'Targeting',

    // BW workout
    'bw.title': 'Bodyweight Workout',
    'bw.exercise': 'Exercise',
    'bw.effort': 'Effort',
    'bw.reps': 'Reps',
    'bw.sets': 'Sets',
    'bw.save': 'Save BW Workout',
    'bw.easy': 'Easy',
    'bw.medium': 'Medium',
    'bw.hard': 'Hard',
    'bw.max': 'MAX',
    'bw.addSet': '+ Add Set',
    'bw.selectExercise': 'Select Exercise',

    // History
    'history.title': 'WORKOUT LOG',
    'history.filter.muscle': 'All Muscles',
    'history.filter.exercise': 'Search exercise...',
    'history.filter.newest': 'Newest First',
    'history.filter.oldest': 'Oldest First',
    'history.filter.volume': 'Most Volume',
    'history.empty': 'No workouts yet',
    'history.emptyHint': 'Log your first session!',
    'history.set': 'set',
    'history.sets': 'sets',
    'history.reps': 'reps',
    'history.vol': 'vol',
    'history.pr': 'PR',
    'history.sessions': 'Sessions',
    'history.totalReps': 'Total Reps',
    'history.bestSet': 'Best Set',

    // PRs
    'prs.title': 'PERSONAL RECORDS',
    'prs.weighted': 'WEIGHTED PRs',
    'prs.bodyweight': 'BODYWEIGHT PRs',
    'prs.empty': 'No PRs yet',
    'prs.emptyHint': 'Start logging to set records!',
    'prs.best': 'Best',
    'prs.reps': 'reps',

    // Dashboard
    'dash.title': 'STATS',
    'dash.volume': 'Volume Split',
    'dash.frequency': 'Frequency',
    'dash.water': 'Water Tracker',
    'dash.body': 'Body Composition',
    'dash.today': 'Today',
    'dash.week': 'This Week',
    'dash.month': 'This Month',
    'dash.addWater': '+ Glass',
    'dash.waterGoal': 'Daily goal',
    'dash.glasses': 'glasses',

    // More view
    'more.profile': 'Profile',
    'more.settings': 'Settings',
    'more.templates': 'My Templates',
    'more.data': 'Data & Export',
    'more.install': 'Install on Phone',
    'more.bwHistory': 'Bodyweight History',
    'more.bodyComp': 'Body Composition',
    'more.guide': 'User Guide',

    // Guide
    'guide.title': 'User Guide',
    'guide.badge': 'COMPLETE',
    'guide.tab.start': 'Getting Started',
    'guide.tab.log': 'Logging',
    'guide.tab.score': 'Scoring',
    'guide.tab.features': 'Features',

    // Profile
    'profile.level': 'Level',
    'profile.xp': 'XP',
    'profile.workouts': 'Workouts',
    'profile.streak': 'Streak',
    'profile.prs': 'PRs',
    'profile.editName': 'Edit Name',

    // Settings
    'settings.title': 'Settings',
    'settings.unit': 'Weight Unit',
    'settings.sound': 'Rest Timer Sound',
    'settings.soundHint': 'Vibrate & beep when rest ends',
    'settings.hint': 'Show Last Session Hint',
    'settings.hintHint': 'Shows previous sets when logging',
    'settings.language': 'Language',
    'settings.theme': 'Theme',

    // Data
    'data.export': 'Export Workouts (CSV)',
    'data.backup': 'Backup All Data (JSON)',
    'data.restore': 'Restore from Backup',
    'data.forceUpdate': 'Force Update App',
    'data.clear': 'Clear All Data',

    // Install
    'install.android': 'Android (Chrome)',
    'install.androidText': 'Tap the three-dot menu → "Add to Home screen" → Install.',
    'install.ios': 'iPhone (Safari)',
    'install.iosText': 'Tap the Share button → "Add to Home Screen" → Add.',
    'install.apk': 'Get a Real APK',
    'install.apkText': 'Host on GitHub Pages, then use pwabuilder.com for an APK.',

    // Body map
    'bodymap.title': 'Body Map',
    'bodymap.front': 'Front',
    'bodymap.back': 'Back',
    'bodymap.tap': 'Tap a muscle to log',
    'bodymap.selected': 'Selected',
    'bodymap.train': 'Train This Muscle',
    'bodymap.muscleGroup': 'Muscle Group',
    'bodymap.tapBody': 'TAP BODY',

    // Muscle overlay
    'overlay.history': 'History',
    'overlay.tips': 'Tips',
    'overlay.exercises': 'Exercises',
    'overlay.sessions': 'sessions logged',
    'overlay.totalVol': 'Total Vol',
    'overlay.bestPR': 'Best PR',
    'overlay.lastTrained': 'Last Trained',
    'overlay.noWorkouts': 'No workouts yet',

    // Coach tabs & status
    'coach.tab.insights':  'Insights',
    'coach.tab.plan':      'Week Plan',
    'coach.tab.nutrition': 'Nutrition',
    'coach.tab.prs':       'PRs',
    'coach.status.init':   'Analysing your training…',

    // Smart Tips
    'section.tips': 'Smart Tips',
    'section.tipsbadge': 'HINTS',
    'tip.overload.title': 'Progressive Overload',
    'tip.overload.text': 'Aim to add 2.5–5 kg every 2 weeks. Small gains compound into massive results.',
    'tip.timer.title': 'Use the Rest Timer',
    'tip.timer.text': 'Consistent rest periods (60–120s) lead to better strength performance across sets.',

    // Dashboard stats bar
    'dash.statVol': 'Total Volume',
    'dash.statSessions': 'Sessions',
    'dash.statSets': 'Total Sets',
    'dash.statPR': 'Personal Best',
    'dash.allTime': 'All time',
    // Dashboard section headers
    'dash.wgtSection': 'Weight Lifting',
    'dash.bwSection': 'Bodyweight',
    // BW stat cards
    'dash.bwSessions': 'BW Sessions',
    'dash.bwSets': 'BW Sets',
    'dash.bwTopEx': 'Top Exercise',
    'dash.bwStreak': 'BW Streak',
    // Stats panel titles & badges
    'dash.muscleBalance': 'Muscle Balance Score',
    'dash.bodyComp': 'Body Composition',
    'dash.log': 'LOG',
    'dash.trainingVolume': 'Training Volume',
    'dash.weekly': 'WEEKLY',
    'dash.weightProgress': 'Weight Progress',
    'dash.exercise': 'EXERCISE',
    'dash.selectExercise': '— Select exercise —',
    'dash.volByMuscle': 'Volume by Muscle',
    'dash.muscleFreq': 'Muscle Frequency',
    'dash.sessions': 'SESSIONS',
    // History view
    'hist.title': 'Workout History',
    'hist.sub': 'All your sessions & personal records',
    'hist.prs': 'Personal Records',
    'hist.filter': 'Filter & Search',
    'hist.filterMuscle': 'Muscle',
    'hist.filterEx': 'Exercise',
    'hist.filterSort': 'Sort',
    'hist.log': 'Workout Log',
    // More/Settings view heroes
    'more.title': 'Settings & Tools',
    'more.sub': 'Profile, themes, data & more',
    // Settings toggles (new keys)
    'settings.lightMode': 'Light Mode',
    'settings.lightModeSub': 'Switch to SOLAR warm theme',
    'settings.unitSub': 'Sets will default to this unit',
    'settings.soundSub': 'Vibrate & beep when rest ends',
    'settings.hintSub': 'Shows previous sets when logging',

    // Toasts / messages
    'toast.saved': 'Workout saved!',
    'toast.deleted': 'Deleted',
    'toast.pr': 'New PR!',
    'toast.cleared': 'All data cleared',
    'toast.imported': 'Data imported!',
    'toast.exported': 'Exported!',
    'toast.stepsSaved': 'Steps saved!',
    'toast.noSteps': 'Enter steps first',

    // Achievements
    'ach.title': 'ACHIEVEMENT UNLOCKED',

    // Templates
    'tmpl.name': 'Template Name',
    'tmpl.muscle': 'Muscle Group',
    'tmpl.exercises': 'Exercises (comma-separated)',
    'tmpl.icon': 'Emoji Icon',
    'tmpl.save': 'Save Template',
    'tmpl.new': 'New Template',
    'tmpl.load': 'Load',
    'tmpl.delete': 'Delete',
    'tmpl.placeholder': 'e.g. Push Day A',
    'tmpl.exPlaceholder': 'Bench Press, Incline DB, Cable Fly',

    // Nav
    'nav.log': 'Log',
    'nav.stats': 'Stats',
    'nav.history': 'History',
    'nav.nutrition': 'Nutrition',
    'nav.more': 'More',

    // General
    'btn.save': 'Save',
    'btn.cancel': 'Cancel',
    'btn.confirm': 'Confirm',
    'btn.delete': 'Delete',
    'btn.edit': 'Edit',
    'btn.close': '✕',
    'lbl.kg': 'kg',
    'lbl.lbs': 'lbs',
    'lbl.days': 'd',

    // Header bio cards
    'hdr.weight': 'WEIGHT',
    'hdr.bodyfat': 'BODY FAT',
    'hdr.muscle': 'MUSCLE',
    'hdr.tapToLog': 'tap to log',

    // Bio log modal
    'bio.logWeight': 'LOG WEIGHT',
    'bio.logBodyFat': 'LOG BODY FAT',
    'bio.logMuscle': 'LOG MUSCLE MASS',
    'bio.last': 'Last',
    'bio.save': 'SAVE',

    // Header status bar pills
    'hdr.streak': 'STREAK',
    'hdr.water': 'WATER',
    'hdr.rest': 'REST',

    // Header coach ticker
    'hdr.coach': 'FORGE COACH',
    'hdr.score': 'SCORE',

    // Mission banner
    'mission.banner.title': "TODAY'S MISSION",
    'mission.banner.done': 'DONE',
    'mission.banner.allDone': 'ALL DONE! 🎉',

    // Muscle balance
    'balance.score': 'BALANCE SCORE',
    'balance.center': 'BALANCE',
    'balance.frequency': 'FREQUENCY',
    'balance.strength': 'MAX STRENGTH',
    'balance.trained': 'MUSCLE GROUPS TRAINED',
    'balance.notTrained': 'not trained',
    'balance.msg.excellent': 'Excellent balance! All muscle groups well trained.',
    'balance.msg.good': 'Good balance. Push the weaker muscles harder.',
    'balance.msg.some': 'Some muscles are being neglected. Diversify!',
    'balance.msg.focus': "Focus needed — you're overtraining some muscles.",
    'balance.empty': 'Log workouts to see muscle balance',

    // Muscle names (translated labels in radar)
    'muscle.Chest': 'CHEST',
    'muscle.Back': 'BACK',
    'muscle.Shoulders': 'SHOULDERS',
    'muscle.Legs': 'LEGS',
    'muscle.Core': 'CORE',
    'muscle.Biceps': 'BICEPS',
    'muscle.Triceps': 'TRICEPS',
    'muscle.Forearms': 'FOREARMS',
    'muscle.Glutes': 'GLUTES',
    'muscle.Calves': 'CALVES',

    // Body comp panel
    'bcomp.logToggle': '+ LOG NEW ENTRY',
    'bcomp.recentEntries': 'RECENT ENTRIES',
    'bcomp.bodyWeight': 'Body Weight',
    'bcomp.bodyFat': 'Body Fat %',
    'bcomp.muscleMass': 'Muscle Mass',
    'bcomp.logEntry': 'LOG ENTRY',
    'bcomp.noEntries': 'No entries yet',
    'bcomp.tab.weight': 'Weight',
    'bcomp.tab.bodyfat': 'Body Fat',
    'bcomp.tab.muscle': 'Muscle',

    // Mascot buddy suffix
    'mascot.buddy': 'BUDDY',

    // Last-hit relative times
    'time.today': 'today',
    'time.yesterday': 'yesterday',
    'time.dAgo': 'd ago',
    'time.wAgo': 'w ago',

    // Muscle chip extras (Traps + Lower Back missing from muscle.* group)
    'muscle.Traps':       'TRAPS',
    'muscle.LowerBack':   'LOWER BACK',
    'muscle.Lower Back':  'LOWER BACK',
    'muscle.All':         'All',
    'muscle.map':         '\u{1F5FA} Map',
    'muscle.mapHide':     '\u{1F5FA} Hide',

    // Form — missing orphan key
    'form.noSetsYet':     'Add your first set!',
    'form.browse':        '\uD83D\uDD0D Browse',
    'form.plates':        '\uD83C\uDFCB Plates',
    'form.effort':        'Session Effort',
    'form.easy':          '\uD83D\uDE0A EASY',
    'form.med':           '\uD83D\uDE24 MED',
    'form.hard':          '\uD83D\uDCAA HARD',
    'form.fail':          '\uD83D\uDE2B FAIL',
    'form.endSession':    '⚡ END SESSION',
    'form.endSessionHint': 'Tap twice to end your workout session',
    'form.selectMuscleBegin': 'select a muscle to begin',
    'form.liveSession':   'LIVE SESSION',
    'form.done':          '\u2714\uFE0F DONE',

    // Stats inner tabs (new — from plan Change 6)
    'dash.tab.overview':  'Overview',
    'dash.tab.progress':  'Progress',
    'dash.tab.muscles':   'Muscles',
    'dash.tab.body':      'Body',

    // Stats period selector (new — from plan Change 7)
    'dash.period.7d':     '7D',
    'dash.period.1m':     '1M',
    'dash.period.3m':     '3M',
    'dash.period.6m':     '6M',
    'dash.period.all':    'ALL',

    // Stats panel section headers
    'dash.heatmap':             'Muscle Heatmap',
    'dash.heatmap.last30':      'LAST 30 DAYS',
    'dash.heatmap.empty':       'Log your first workout',
    'dash.share':               '\u2B06\uFE0F SHARE',
    'dash.bcomp.hint':          'weight + body fat %',
    'dash.pbboard':             '\uD83C\uDFC6 Personal Best Board',
    'dash.pbboard.alltime':     'ALL TIME',
    'dash.strength':            '\uD83D\uDCAA Strength Standards',
    'dash.strength.level':      'YOUR LEVEL',
    'dash.velocity':            '\uD83D\uDCC8 Velocity of Progress',
    'dash.velocity.trend':      '1RM TREND',
    'dash.prroadmap':           '\uD83C\uDFAF PR Roadmap',
    'dash.prroadmap.weeks':     '12 WEEKS',
    'dash.recovery':            '\uD83D\uDCAA Muscle Recovery',
    'dash.freshness':           'FRESHNESS',
    'dash.weekcomp':            '\uD83D\uDCCA Week vs Last Week',
    'dash.weekcomp.loading':    'LOADING',
    'dash.weekcomp.vol':        'Volume',
    'dash.weekcomp.sess':       'Sessions',
    'dash.weekcomp.sets':       'Sets',
    'dash.weekcomp.thisWeek':   'This Week',
    'dash.weekcomp.lastWeek':   'Last Week',
    'dash.progHighlights':      '\u2B06\uFE0F Progress Highlights',
    'dash.progHighlights.week': 'THIS WEEK',
    'dash.progHighlights.top':  'TOP LIFT',
    'dash.new':                 'New',

    // Nav — Coach tab (new — from plan Change 1)
    'nav.coach':          'Coach',

    // History filter
    'hist.filterAll':         'All',
    'hist.sort.newest':       'Newest First',
    'hist.sort.oldest':       'Oldest First',
    'hist.sort.volume':       'Highest Volume',
    'hist.option.all':        'All muscles',
    'hist.option.neck':       'Neck',

    // Profile form labels
    'profile.gender':         'Gender',
    'profile.dob':            'Date of Birth',
    'profile.name':           'Name',
    'profile.height':         'Height',
    'profile.goal':           'Training Goal',
    'profile.targetWeight':   'Target Weight',
    'profile.targetFat':      'Target Body Fat',
    'profile.targetMuscle':   'Target Muscle',
    'profile.priority':       'Priority Muscle',
    'profile.age':            'Age',
    'profile.bmi':            'BMI',
    'profile.tdee':           'TDEE est.',
    'profile.title':          'My Profile',
    'profile.male':           '\u2642\uFE0F Male',
    'profile.female':         '\u2640\uFE0F Female',
    'profile.other':          '\u26A7\uFE0F Prefer not to say',
    'profile.cm':             'cm',
    'profile.ft':             'ft',
    'profile.goalMuscle':     'Build Muscle',
    'profile.goalStrength':   'Build Strength',
    'profile.goalFatLoss':    'Fat Loss',
    'profile.goalEndurance':  'Endurance',
    'profile.goalRecomp':     'Body Recomposition',
    'profile.noGoal':         '\uD83C\uDFAF Select goal',
    'profile.noPriority':     '\uD83C\uDFAF No priority set',

    // Settings new
    'settings.appTheme':      'App Theme',
    'settings.accentColor':   'Accent Color',
    'settings.bgColor':       'Background Color',

    // Data section
    'data.csv':               'CSV',
    'data.json':              'JSON',
    'data.load':              'LOAD',
    'data.xml':               'XML',
    'data.healthSync':        'Health Data Sync',
    'data.healthNone':        'No health data connected yet',
    'data.pedometer':         '\uD83D\uDEB6 Start Counting Steps',
    'data.pedometerOff':      'Pedometer inactive',
    'data.importStrong':      'Import Strong/Hevy CSV',
    'data.importApple':       'Import Apple Health XML',

    // Overlay / muscle modal
    'overlay.recovery':       '\uD83D\uDD25 RECOVERY',
    'overlay.trainBtn':       'Train This Muscle',

    // Set type badges
    'set.warmup':             'W',
    'set.warmup.label':       'Warm-up',
    'set.dropset':            'D',
    'set.dropset.label':      'Drop Set',
    'set.amrap':              'A',
    'set.amrap.label':        'AMRAP',
    'set.last':               '\u2190 LAST SESSION \u2014 type to overwrite',

    // Wellness check-in
    'wellness.energy':        '\u26A1 Energy',
    'wellness.sleep':         '\uD83D\uDE34 Sleep',
    'wellness.mood':          '\uD83C\uDFAF Mood',
    'wellness.train':         "Let's Train! \uD83D\uDD25",
    'wellness.skip':          'Skip for today',
    'wellness.beat':          "I'll Beat It! \uD83C\uDFC6",
    'wellness.saveAnyway':    'Save Anyway',

    // Toast new
    'toast.copiedLastSet':    'Last set copied',
    'toast.programStarted':   'Program activated!',
    'toast.programDeactivated': 'Program deactivated',
    'toast.setTypeChanged':   'Set type updated',

  // Program panel
  'program.activate':     'Activate',
  'program.restDay':      'Rest Day',
  'program.startSession': '\uD83C\uDFCB\uFE0F Start Today\'s Session',
  'program.change':       '\u21A9\uFE0F Change Program',
  'program.schedule':     'WEEKLY SCHEDULE',
  'program.noActive':     'No active program',

  // Bodyweight session stats
  'bw.stat.sessions':     'Sessions',
  'bw.stat.totalReps':    'Total Reps',
  'bw.stat.bestSet':      'Best Set',

  // Sets grid headers (overlay / muscle history)
  'mo.sets.num':          '#',
  'mo.sets.reps':         'REPS',
  'mo.sets.weight':       'WEIGHT',
  'mo.sets.vol':          'VOL',

  // Recovery / dash
  'dash.recoveryStatus':  'RECOVERY STATUS',

  // Session hero + repeat button
  'sh.brand':   'FORGE SESSION',
  'sh.start':   'START SESSION',
  'sh.repeat':  'Repeat last workout',

  // Chip recovery legend
  'chip.sore':       'Sore',
  'chip.recovering': 'Recovering',
  'chip.ready':      'Ready',
  'chip.fresh':      'Fresh',

  // Heatmap legend tiers
  'heat.tier1': 'Trained 0–1d',
  'heat.tier2': 'Recovering 2–3d',
  'heat.tier3': 'Ready 4–6d',
  'heat.tier4': 'Primed 7–13d',
  'heat.tier5': 'Rested 14+d / never',

  // Recovery detail badge
  'recovery.tier1': '🔴 Trained (0–1d)',
  'recovery.tier2': '🟠 Recovering (2–3d)',
  'recovery.tier3': '🟡 Ready (4–6d)',
  'recovery.tier4': '🟢 Primed (7–13d)',
  'recovery.tier5': '⚪ Rested (14+d)',

  // History / session
  'hist.noWorkouts':      'No workouts yet',
  'hist.emptyTitle':      'No workouts logged this session',

  // Onboarding
  'onb.back':              'Back',
  'onb.skip':              'Skip',
  'onb.next':              'Next →',
  'onb.step':              'STEP',
  'onb.of':                'OF',
  'onb.welcome.title':     'Welcome to FORGE',
  'onb.welcome.sub':       'Your gym. Your rules.',
  'onb.welcome.desc':      'Set up your profile in under a minute and get a personalised training experience.',
  'onb.welcome.cta':       'Get Started →',
  'onb.name.title':        "What's your name?",
  'onb.name.sub':          "We'll use this to personalise your experience.",
  'onb.name.placeholder':  'e.g. Alex',
  'onb.lbl.name':          'Name',
  'onb.about.title':       'About you',
  'onb.about.sub':         'Helps us calculate your stats accurately.',
  'onb.about.gender':      'I am',
  'onb.about.male':        'Male',
  'onb.about.female':      'Female',
  'onb.about.other':       'Other',
  'onb.about.dob':         'Date of birth',
  'onb.measure.title':     'Your measurements',
  'onb.measure.sub':       'Used to calculate BMI, TDEE and calorie targets.',
  'onb.measure.weight':    'Current weight',
  'onb.measure.height':    'Height',
  'onb.goal.title':        'Your main goal',
  'onb.goal.title2':       'Goal',
  'onb.goal.sub':          "We'll tailor coaching and missions around this.",
  'onb.goal.muscle':       'Build Muscle',
  'onb.goal.muscle.sub':   'Hypertrophy & size',
  'onb.goal.fat':          'Lose Fat',
  'onb.goal.fat.sub':      'Cutting & cardio',
  'onb.goal.strength':     'Get Strong',
  'onb.goal.strength.sub': 'Power & 1RM',
  'onb.goal.active':       'Stay Active',
  'onb.goal.active.sub':   'Health & wellness',
  'onb.done.title':        "You're all set!",
  'onb.done.sub':          "FORGE is personalised to you. Let's build something.",
  'onb.done.cta':          "Let's FORGE! 🔥",
  'onb.toast':             'Welcome to FORGE, {name}! 🔥',
  'onb.toast.athlete':     'athlete',

  // ── APP TOUR ──
  'tour.back':       'Back',
  'tour.skip':       'Skip',
  'tour.next':       'Next →',
  'tour.cta':        "Let's FORGE! 🔥",
  'tour.more.title': 'App Tour',
  'tour.more.sub':   'Replay the feature walkthrough · 60 sec',
  'tour.s0.tag':     'FORGE GYM OS',
  'tour.s0.title':   'Your Gym OS is Live',
  'tour.s0.sub':     'A 60-second tour of everything FORGE can do for you.',
  'tour.s1.tag':     'STEP 1 · LOG',
  'tour.s1.title':   'Log Every Rep',
  'tour.s1.sub':     'Pick a muscle group, find your exercise, track your sets.',
  'tour.s1.f0':      '100+ exercises built-in',
  'tour.s1.f0s':     'Across 9 muscle groups with smart search',
  'tour.s1.f1':      'Sets · Reps · Weight · Notes',
  'tour.s1.f1s':     'Plus dropset, warmup & AMRAP markers',
  'tour.s1.f2':      'Last session hint',
  'tour.s1.f2s':     'See what you lifted last time, inline',
  'tour.s2.tag':     'PERFORMANCE',
  'tour.s2.title':   'Chase Your PRs',
  'tour.s2.sub':     'Every time you beat a personal record, FORGE fires a PR alert.',
  'tour.s2.f0':      'Instant PR badge',
  'tour.s2.f0s':     'Flashes the moment you hit a new best',
  'tour.s2.f1':      'Volume & 1RM records',
  'tour.s2.f1s':     'Per exercise, tracked automatically',
  'tour.s2.f2':      'Full PR history in Stats',
  'tour.s2.f2s':     'Every exercise, every milestone',
  'tour.s3.tag':     'RECOVERY',
  'tour.s3.title':   'Rest Like a Pro',
  'tour.s3.sub':     'The floating ⏱ button sits bottom-right on every screen.',
  'tour.s3.f0':      'Tap after each set',
  'tour.s3.f0s':     'Start your rest countdown instantly',
  'tour.s3.f1':      'Vibration + audio alert',
  'tour.s3.f1s':     'Never miss your rest ending',
  'tour.s3.f2':      'Presets: 60 / 90 / 120 / 180s',
  'tour.s3.f2s':     'One tap to lock in your rest time',
  'tour.s4.tag':     'ANALYTICS',
  'tour.s4.title':   'See Your Growth',
  'tour.s4.sub':     'Charts, heatmaps and trends. Watch yourself transform.',
  'tour.s4.f0':      'Volume & strength charts',
  'tour.s4.f0s':     'Per exercise and per muscle group',
  'tour.s4.f1':      'Muscle balance radar',
  'tour.s4.f1s':     "See which muscles you're neglecting",
  'tour.s4.f2':      'Body weight & calendar',
  'tour.s4.f2s':     'Daily logs, weekly trends, heatmap',
  'tour.s5.tag':     'GAMIFICATION',
  'tour.s5.title':   'Level Up Daily',
  'tour.s5.sub':     'Every rep earns XP. Missions push you past your limits.',
  'tour.s5.f0':      'Rookie → Veteran → Legend',
  'tour.s5.f0s':     '10 ranks to climb, each one harder',
  'tour.s5.f1':      'Daily & weekly missions',
  'tour.s5.f1s':     'Fresh challenges every single day',
  'tour.s5.f2':      'Streak rewards & badges',
  'tour.s5.f2s':     "Don't break the chain",
  'tour.s6.tag':     'AI COACH',
  'tour.s6.title':   'Your Personal Coach',
  'tour.s6.sub':     'FORGE reads your training data and adapts to you daily.',
  'tour.s6.f0':      'Daily readiness score',
  'tour.s6.f0s':     'Know when to push hard or recover',
  'tour.s6.f1':      'PPL, 5/3/1, 5×5 programs',
  'tour.s6.f1s':     'Science-based templates, one tap to start',
  'tour.s6.f2':      'Nutrition & macro targets',
  'tour.s6.f2s':     'Calories & protein tailored to your goal',
  'tour.s7.tag':     "YOU'RE READY",
  'tour.s7.title':   'Now Go FORGE',
  'tour.s7.sub':     'The iron is waiting. Your first session starts right now.',
  'tour.s7.t0':      'Log',
  'tour.s7.t1':      'PRs',
  'tour.s7.t2':      'Stats',
  'tour.s7.t3':      'Level Up',

  // A2: Auto-rest
  'settings.autoRest':    'Auto-Start Rest Timer',
  'settings.autoRestSub': 'Starts rest after each logged set',

  // B1: RPE
  'settings.rpe':    'Show RPE per Set',
  'settings.rpeSub': 'Rate of Perceived Exertion (1–10)',
  'form.rpe':        'RPE',

  // B2: Swap
  'form.swap':       '↔ Swap',
  'swap.sub':        'Pick an alternative for the same muscle:',
  'swap.cancel':     'Cancel',

  // C2: Photos
  'photos.title':    'Progress Photos',
  'photos.add':      '+ ADD',
  'photos.empty':    'No photos yet. Add your first progress pic!',

  },

  ar: {
    // Header
    'app.title': 'فورج',
    'app.subtitle': '// تتبع التمارين',
    'header.edit': 'تعديل',
    'header.done': 'تم',
    'header.editLayout': 'تعديل التخطيط',
    'header.editHint': '↑↓ إعادة ترتيب · إخفاء/إظهار',

    // Mode toggle
    'mode.weighted': 'أوزان',
    'mode.bodyweight': 'وزن الجسم',

    // Sections
    'section.steps': 'الخطوات',
    'section.timer': 'مؤقت الراحة',
    'section.indicators': 'الإحصائيات',
    'section.mission': 'مهمة اليوم',
    'section.templates': 'القوالب',
    'section.bodymap': 'خريطة الجسم',
    'section.coach': 'المدرب الذكي',

    // Steps panel
    'steps.title': 'خطوات اليوم',
    'steps.goal': 'الهدف',
    'steps.add': '+ إضافة خطوات',
    'steps.addBtn': 'إضافة',
    'steps.streak': 'أيام متتالية',
    'steps.today': 'اليوم',
    'steps.placeholder': 'أدخل عدد الخطوات...',

    // Timer
    'timer.title': 'مؤقت الراحة',
    'timer.start': '▶ بدء',
    'timer.reset': '■ إعادة',
    'timer.go': 'انطلق!',

    // Indicators
    'ind.volume': 'حجم تمارين اليوم',
    'ind.streak': 'أيام متتالية',
    'ind.prs': 'إجمالي الأرقام القياسية',
    'ind.week': 'هذا الأسبوع',
    'ind.allTime': 'كل الوقت',
    'ind.sessions': 'جلسات',
    'ind.start': 'ابدأ التسجيل',
    'ind.keepGoing': 'استمر!',

    // Mission
    'mission.title': 'مهمة اليوم',
    'mission.complete': 'مكتملة',
    'mission.locked': 'مقفلة',
    'mission.reward': 'المكافأة',

    // Workout form
    'form.muscle': 'مجموعة العضلات',
    'form.exercise': 'اسم التمرين',
    'form.exercisePlaceholder': 'مثال: ضغط الصدر، القرفصاء…',
    'form.set': 'مجموعة',
    'form.sets': 'المجموعات',
    'form.weight': 'الوزن',
    'form.reps': 'التكرارات',
    'form.addSet': '+ إضافة مجموعة',
    'form.save': 'تسجيل التمرين',
    'form.lastHint': 'الجلسة السابقة',
    'form.unit': 'الوحدة',
    'form.notes': 'ملاحظات',
    'form.notesOptional': 'ملاحظات (اختياري)',
    'form.notesPlaceholder': 'كيف شعرت؟ أي أرقام قياسية؟',
    'form.selectMuscle': 'اختر العضلة',
    'form.selectExercise': 'اختر التمرين',
    'form.quickSelect': 'اختيار سريع',
    'form.recent': 'الأخيرة',
    'form.targeting': 'استهداف',

    // BW workout
    'bw.title': 'تمرين وزن الجسم',
    'bw.exercise': 'التمرين',
    'bw.effort': 'الجهد',
    'bw.reps': 'تكرارات',
    'bw.sets': 'مجموعات',
    'bw.save': 'حفظ التمرين',
    'bw.easy': 'سهل',
    'bw.medium': 'متوسط',
    'bw.hard': 'صعب',
    'bw.max': 'أقصى',
    'bw.addSet': '+ إضافة مجموعة',
    'bw.selectExercise': 'اختر التمرين',

    // History
    'history.title': 'سجل التمارين',
    'history.filter.muscle': 'كل العضلات',
    'history.filter.exercise': 'ابحث عن تمرين...',
    'history.filter.newest': 'الأحدث أولاً',
    'history.filter.oldest': 'الأقدم أولاً',
    'history.filter.volume': 'الأعلى حجماً',
    'history.empty': 'لا توجد تمارين بعد',
    'history.emptyHint': 'سجّل جلستك الأولى!',
    'history.set': 'مجموعة',
    'history.sets': 'مجموعات',
    'history.reps': 'تكرار',
    'history.vol': 'حجم',
    'history.pr': 'رقم قياسي',
    'history.sessions': 'جلسات',
    'history.totalReps': 'إجمالي التكرارات',
    'history.bestSet': 'أفضل مجموعة',

    // PRs
    'prs.title': 'الأرقام القياسية',
    'prs.weighted': 'أرقام الأوزان',
    'prs.bodyweight': 'أرقام وزن الجسم',
    'prs.empty': 'لا توجد أرقام قياسية بعد',
    'prs.emptyHint': 'ابدأ التسجيل لتسجيل الأرقام!',
    'prs.best': 'الأفضل',
    'prs.reps': 'تكرار',

    // Dashboard
    'dash.title': 'الإحصائيات',
    'dash.volume': 'توزيع الحجم',
    'dash.frequency': 'التكرار',
    'dash.water': 'متتبع الماء',
    'dash.body': 'تكوين الجسم',
    'dash.today': 'اليوم',
    'dash.week': 'هذا الأسبوع',
    'dash.month': 'هذا الشهر',
    'dash.addWater': '+ كوب',
    'dash.waterGoal': 'الهدف اليومي',
    'dash.glasses': 'أكواب',

    // More view
    'more.profile': 'الملف الشخصي',
    'more.settings': 'الإعدادات',
    'more.templates': 'قوالبي',
    'more.data': 'البيانات والتصدير',
    'more.install': 'التثبيت على الهاتف',
    'more.bwHistory': 'سجل وزن الجسم',
    'more.bodyComp': 'تكوين الجسم',
    'more.guide': 'دليل المستخدم',

    // Guide
    'guide.title': 'دليل المستخدم',
    'guide.badge': 'شامل',
    'guide.tab.start': 'البداية',
    'guide.tab.log': 'التسجيل',
    'guide.tab.score': 'التقييم',
    'guide.tab.features': 'المميزات',

    // Profile
    'profile.level': 'المستوى',
    'profile.xp': 'نقاط الخبرة',
    'profile.workouts': 'التمارين',
    'profile.streak': 'التتالي',
    'profile.prs': 'الأرقام القياسية',
    'profile.editName': 'تعديل الاسم',

    // Settings
    'settings.title': 'الإعدادات',
    'settings.unit': 'وحدة الوزن',
    'settings.sound': 'صوت مؤقت الراحة',
    'settings.soundHint': 'اهتزاز وصوت تنبيه عند انتهاء الراحة',
    'settings.hint': 'عرض تلميح الجلسة السابقة',
    'settings.hintHint': 'يعرض المجموعات السابقة عند التسجيل',
    'settings.language': 'اللغة',
    'settings.theme': 'المظهر',

    // Data
    'data.export': 'تصدير التمارين (CSV)',
    'data.backup': 'نسخ احتياطي للبيانات (JSON)',
    'data.restore': 'استعادة من النسخة الاحتياطية',
    'data.clear': 'مسح جميع البيانات',

    // Install
    'install.android': 'أندرويد (Chrome)',
    'install.androidText': 'اضغط القائمة ← "إضافة إلى الشاشة الرئيسية" ← تثبيت.',
    'install.ios': 'آيفون (Safari)',
    'install.iosText': 'اضغط مشاركة ← "إضافة إلى الشاشة الرئيسية" ← إضافة.',
    'install.apk': 'الحصول على APK',
    'install.apkText': 'استضف التطبيق على GitHub Pages ثم استخدم pwabuilder.com للحصول على APK.',

    // Body map
    'bodymap.title': 'خريطة الجسم',
    'bodymap.front': 'أمامي',
    'bodymap.back': 'خلفي',
    'bodymap.tap': 'اضغط على عضلة للتسجيل',
    'bodymap.selected': 'المختار',
    'bodymap.train': 'تدريب هذه العضلة',
    'bodymap.muscleGroup': 'مجموعة العضلات',
    'bodymap.tapBody': 'اضغط الجسم',

    // Muscle overlay
    'overlay.history': 'السجل',
    'overlay.tips': 'نصائح',
    'overlay.exercises': 'التمارين',
    'overlay.sessions': 'جلسات مسجلة',
    'overlay.totalVol': 'إجمالي الحجم',
    'overlay.bestPR': 'أفضل رقم',
    'overlay.lastTrained': 'آخر تدريب',
    'overlay.noWorkouts': 'لا توجد تمارين بعد',

    // Coach tabs & status
    'coach.tab.insights':  'التحليلات',
    'coach.tab.plan':      'الخطة الأسبوعية',
    'coach.tab.nutrition': 'التغذية',
    'coach.tab.prs':       'الأرقام القياسية',
    'coach.status.init':   'جارٍ تحليل تدريبك…',

    // Smart Tips
    'section.tips': 'نصائح ذكية',
    'section.tipsbadge': 'تلميحات',
    'tip.overload.title': 'التحميل التدريجي',
    'tip.overload.text': 'استهدف إضافة 2.5–5 كغ كل أسبوعين. المكاسب الصغيرة تتراكم لنتائج ضخمة.',
    'tip.timer.title': 'استخدم مؤقت الراحة',
    'tip.timer.text': 'فترات راحة منتظمة (60–120 ثانية) تؤدي إلى أداء قوة أفضل عبر المجموعات.',

    // Dashboard stats bar
    'dash.statVol': 'إجمالي الحجم',
    'dash.statSessions': 'الجلسات',
    'dash.statSets': 'إجمالي المجموعات',
    'dash.statPR': 'أفضل رقم قياسي',
    'dash.allTime': 'كل الوقت',
    // Dashboard section headers
    'dash.wgtSection': 'رفع الأثقال',
    'dash.bwSection': 'تمارين الجسم',
    // BW stat cards
    'dash.bwSessions': 'جلسات الجسم',
    'dash.bwSets': 'مجموعات الجسم',
    'dash.bwTopEx': 'أفضل تمرين',
    'dash.bwStreak': 'التسلسل',
    // Stats panel titles & badges
    'dash.muscleBalance': 'نقاط توازن العضلات',
    'dash.bodyComp': 'تكوين الجسم',
    'dash.log': 'سجّل',
    'dash.trainingVolume': 'حجم التدريب',
    'dash.weekly': 'أسبوعي',
    'dash.weightProgress': 'تقدم الوزن',
    'dash.exercise': 'تمرين',
    'dash.selectExercise': '— اختر التمرين —',
    'dash.volByMuscle': 'الحجم حسب العضلة',
    'dash.muscleFreq': 'تكرار العضلات',
    'dash.sessions': 'الجلسات',
    // History view
    'hist.title': 'سجل التمارين',
    'hist.sub': 'جميع الجلسات والأرقام القياسية',
    'hist.prs': 'الأرقام القياسية',
    'hist.filter': 'تصفية وبحث',
    'hist.filterMuscle': 'العضلة',
    'hist.filterEx': 'التمرين',
    'hist.filterSort': 'ترتيب',
    'hist.log': 'سجل التمارين',
    // More/Settings view
    'more.title': 'الإعدادات والأدوات',
    'more.sub': 'الملف الشخصي والسمات والبيانات',
    'more.profile': 'ملفي الشخصي',
    'more.templates': 'القوالب',
    'more.bodyComp': 'تكوين الجسم',
    'more.settings': 'الإعدادات',
    'more.data': 'البيانات والتصدير',
    // Settings toggles
    'settings.lightMode': 'الوضع النهاري',
    'settings.lightModeSub': 'التبديل إلى سمة SOLAR الدافئة',
    'settings.unit': 'وحدة الوزن الافتراضية',
    'settings.unitSub': 'ستكون هذه الوحدة افتراضية للمجموعات',
    'settings.sound': 'صوت مؤقت الراحة',
    'settings.soundSub': 'اهتزاز وصوت تنبيه عند انتهاء الراحة',
    'settings.hint': 'إظهار تلميح الجلسة الأخيرة',
    'settings.hintSub': 'يعرض المجموعات السابقة عند التسجيل',

    // Toasts
    'toast.saved': 'تم حفظ التمرين!',
    'toast.deleted': 'تم الحذف',
    'toast.pr': 'رقم قياسي جديد!',
    'toast.cleared': 'تم مسح جميع البيانات',
    'toast.imported': 'تم استيراد البيانات!',
    'toast.exported': 'تم التصدير!',
    'toast.stepsSaved': 'تم حفظ الخطوات!',
    'toast.noSteps': 'أدخل عدد الخطوات أولاً',

    // Achievements
    'ach.title': 'إنجاز جديد!',

    // Templates
    'tmpl.name': 'اسم القالب',
    'tmpl.muscle': 'مجموعة العضلات',
    'tmpl.exercises': 'التمارين (مفصولة بفاصلة)',
    'tmpl.icon': 'أيقونة',
    'tmpl.save': 'حفظ القالب',
    'tmpl.new': 'قالب جديد',
    'tmpl.load': 'تحميل',
    'tmpl.delete': 'حذف',
    'tmpl.placeholder': 'مثال: يوم الدفع A',
    'tmpl.exPlaceholder': 'ضغط صدر، دمبل مائل، كيبل',

    // Nav
    'nav.log': 'تسجيل',
    'nav.stats': 'إحصاء',
    'nav.history': 'السجل',
    'nav.nutrition': 'التغذية',
    'nav.more': 'المزيد',

    // General
    'btn.save': 'حفظ',
    'btn.cancel': 'إلغاء',
    'btn.confirm': 'تأكيد',
    'btn.delete': 'حذف',
    'btn.edit': 'تعديل',
    'btn.close': '✕',
    'lbl.kg': 'كغ',
    'lbl.lbs': 'رطل',
    'lbl.days': 'ي',

    // Header bio cards
    'hdr.weight': 'الوزن',
    'hdr.bodyfat': 'دهون الجسم',
    'hdr.muscle': 'كتلة عضلية',
    'hdr.tapToLog': 'اضغط للتسجيل',

    // Bio log modal
    'bio.logWeight': 'تسجيل الوزن',
    'bio.logBodyFat': 'تسجيل دهون الجسم',
    'bio.logMuscle': 'تسجيل الكتلة العضلية',
    'bio.last': 'آخر',
    'bio.save': 'حفظ',

    // Header status bar pills
    'hdr.streak': 'التسلسل',
    'hdr.water': 'ماء',
    'hdr.rest': 'راحة',

    // Header coach ticker
    'hdr.coach': 'المدرب',
    'hdr.score': 'النقاط',

    // Mission banner
    'mission.banner.title': 'مهمة اليوم',
    'mission.banner.done': 'تم',
    'mission.banner.allDone': 'أحسنت! 🎉',

    // Muscle balance
    'balance.score': 'نقاط التوازن',
    'balance.center': 'توازن',
    'balance.frequency': 'التكرار',
    'balance.strength': 'أقصى قوة',
    'balance.trained': 'مجموعات عضلية مدربة',
    'balance.notTrained': 'لم يُدرَّب',
    'balance.msg.excellent': 'توازن ممتاز! جميع العضلات مدربة جيداً.',
    'balance.msg.good': 'توازن جيد. اضغط على العضلات الأضعف.',
    'balance.msg.some': 'بعض العضلات مهملة. نوّع تمارينك!',
    'balance.msg.focus': 'تحتاج تركيزاً — تدرب على عضلات أخرى.',
    'balance.empty': 'سجّل تمارين لرؤية التوازن العضلي',

    // Muscle names
    'muscle.Chest': 'الصدر',
    'muscle.Back': 'الظهر',
    'muscle.Shoulders': 'الأكتاف',
    'muscle.Legs': 'الأرجل',
    'muscle.Core': 'الجذع',
    'muscle.Biceps': 'العضلة ذات الرأسين',
    'muscle.Triceps': 'خلفية الذراع',
    'muscle.Forearms': 'عضلة الساعد',
    'muscle.Glutes': 'الأرداف',
    'muscle.Calves': 'الساق',

    // Body comp panel
    'bcomp.logToggle': '+ تسجيل إدخال جديد',
    'bcomp.recentEntries': 'الإدخالات الأخيرة',
    'bcomp.bodyWeight': 'وزن الجسم',
    'bcomp.bodyFat': 'نسبة الدهون %',
    'bcomp.muscleMass': 'الكتلة العضلية',
    'bcomp.logEntry': 'تسجيل',
    'bcomp.noEntries': 'لا توجد إدخالات بعد',
    'bcomp.tab.weight': 'الوزن',
    'bcomp.tab.bodyfat': 'الدهون',
    'bcomp.tab.muscle': 'العضلات',

    // Mascot buddy suffix
    'mascot.buddy': 'صديقي',

    // Last-hit relative times
    'time.today': 'اليوم',
    'time.yesterday': 'أمس',
    'time.dAgo': 'ي مضت',
    'time.wAgo': 'أسابيع',

    // Muscle chip extras
    'muscle.Traps':       '\u0627\u0644\u062A\u0631\u0627\u0628\u064A\u0632',
    'muscle.LowerBack':   '\u0623\u0633\u0641\u0644 \u0627\u0644\u0638\u0647\u0631',
    'muscle.Lower Back':  '\u0623\u0633\u0641\u0644 \u0627\u0644\u0638\u0647\u0631',
    'muscle.All':         '\u0627\u0644\u0643\u0644',
    'muscle.map':         '\uD83D\uDDFA \u0627\u0644\u062E\u0631\u064A\u0637\u0629',
    'muscle.mapHide':     '\uD83D\uDDFA \u0625\u062E\u0641\u0627\u0621',

    // Form
    'form.noSetsYet':     '\u0623\u0636\u0641 \u0645\u062C\u0645\u0648\u0639\u062A\u0643 \u0627\u0644\u0623\u0648\u0644\u0649!',
    'form.browse':        '\uD83D\uDD0D \u062A\u0635\u0641\u062D',
    'form.plates':        '\uD83C\uDFCB \u0627\u0644\u0623\u0648\u0632\u0627\u0646',
    'form.effort':        '\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u062C\u0647\u062F',
    'form.easy':          '\uD83D\uDE0A \u0633\u0647\u0644',
    'form.med':           '\uD83D\uDE24 \u0645\u062A\u0648\u0633\u0637',
    'form.hard':          '\uD83D\uDCAA \u0635\u0639\u0628',
    'form.fail':          '\uD83D\uDE2B \u0641\u0634\u0644\u062A',
    'form.endSession':    '⚡ إنهاء الجلسة',
    'form.endSessionHint': 'انقر مرتين لإنهاء جلسة التمرين',
    'form.selectMuscleBegin': '\u0627\u062E\u062A\u0631 \u0639\u0636\u0644\u0629 \u0644\u0644\u0628\u062F\u0621',
    'form.liveSession':   '\u062C\u0644\u0633\u0629 \u0645\u0628\u0627\u0634\u0631\u0629',
    'form.done':          '\u2714\uFE0F \u062A\u0645',

    // Stats tabs
    'dash.tab.overview':  '\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629',
    'dash.tab.progress':  '\u0627\u0644\u062A\u0642\u062F\u0645',
    'dash.tab.muscles':   '\u0627\u0644\u0639\u0636\u0644\u0627\u062A',
    'dash.tab.body':      '\u0627\u0644\u062C\u0633\u0645',

    // Stats period
    'dash.period.7d':     '7 \u0623\u064A\u0627\u0645',
    'dash.period.1m':     '\u0634\u0647\u0631',
    'dash.period.3m':     '3 \u0623\u0634\u0647\u0631',
    'dash.period.6m':     '6 \u0623\u0634\u0647\u0631',
    'dash.period.all':    '\u0627\u0644\u0643\u0644',

    // Stats panel headers
    'dash.heatmap':             '\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u0639\u0636\u0644\u0627\u062A',
    'dash.heatmap.last30':      '\u0622\u062E\u0631 30 \u064A\u0648\u0645',
    'dash.heatmap.empty':       '\u0633\u062C\u0651\u0644 \u0623\u0648\u0644 \u062A\u0645\u0631\u064A\u0646',
    'dash.share':               '\u2B06\uFE0F \u0645\u0634\u0627\u0631\u0643\u0629',
    'dash.bcomp.hint':          '\u0627\u0644\u0648\u0632\u0646 + \u0646\u0633\u0628\u0629 \u0627\u0644\u062F\u0647\u0648\u0646',
    'dash.pbboard':             '\uD83C\uDFC6 \u0644\u0648\u062D\u0629 \u0627\u0644\u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0642\u064A\u0627\u0633\u064A\u0629',
    'dash.pbboard.alltime':     '\u0643\u0644 \u0627\u0644\u0623\u0648\u0642\u0627\u062A',
    'dash.strength':            '\uD83D\uDCAA \u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u0642\u0648\u0629',
    'dash.strength.level':      '\u0645\u0633\u062A\u0648\u0627\u0643',
    'dash.velocity':            '\uD83D\uDCC8 \u0645\u0639\u062F\u0644 \u0627\u0644\u062A\u0642\u062F\u0645',
    'dash.velocity.trend':      '\u0627\u062A\u062C\u0627\u0647 1RM',
    'dash.prroadmap':           '\uD83C\uDFAF \u062E\u0627\u0631\u0637\u0629 \u0627\u0644\u0623\u0631\u0642\u0627\u0645',
    'dash.prroadmap.weeks':     '12 \u0623\u0633\u0628\u0648\u0639',
    'dash.recovery':            '\uD83D\uDCAA \u062A\u0639\u0627\u0641\u064A \u0627\u0644\u0639\u0636\u0644\u0627\u062A',
    'dash.freshness':           '\u0627\u0644\u0646\u0636\u0627\u0631\u0629',
    'dash.weekcomp':            '\uD83D\uDCCA \u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0645\u0642\u0627\u0628\u0644 \u0627\u0644\u0645\u0627\u0636\u064A',
    'dash.weekcomp.loading':    '\u062A\u062D\u0645\u064A\u0644',
    'dash.weekcomp.vol':        '\u0627\u0644\u062D\u062C\u0645',
    'dash.weekcomp.sess':       '\u062C\u0644\u0633\u0627\u062A',
    'dash.weekcomp.sets':       '\u0645\u062C\u0645\u0648\u0639\u0627\u062A',
    'dash.weekcomp.thisWeek':   '\u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639',
    'dash.weekcomp.lastWeek':   '\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0645\u0627\u0636\u064A',
    'dash.progHighlights':      '\u2B06\uFE0F \u0623\u0628\u0631\u0632 \u0627\u0644\u062A\u0642\u062F\u0645',
    'dash.progHighlights.week': '\u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639',
    'dash.progHighlights.top':  '\u0623\u0641\u0636\u0644 \u0631\u0641\u0639\u0629',
    'dash.new':                 '\u062C\u062F\u064A\u062F',

    // Nav Coach
    'nav.coach':          '\u0627\u0644\u0645\u062F\u0631\u0628',

    // History filter
    'hist.filterAll':         '\u0627\u0644\u0643\u0644',
    'hist.sort.newest':       '\u0627\u0644\u0623\u062D\u062F\u062B \u0623\u0648\u0644\u0627\u064B',
    'hist.sort.oldest':       '\u0627\u0644\u0623\u0642\u062F\u0645 \u0623\u0648\u0644\u0627\u064B',
    'hist.sort.volume':       '\u0627\u0644\u0623\u0639\u0644\u0649 \u062D\u062C\u0645\u0627\u064B',
    'hist.option.all':        '\u0643\u0644 \u0627\u0644\u0639\u0636\u0644\u0627\u062A',
    'hist.option.neck':       '\u0627\u0644\u0631\u0642\u0628\u0629',

    // Profile
    'profile.gender':         '\u0627\u0644\u062C\u0646\u0633',
    'profile.dob':            '\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0645\u064A\u0644\u0627\u062F',
    'profile.name':           '\u0627\u0644\u0627\u0633\u0645',
    'profile.height':         '\u0627\u0644\u0637\u0648\u0644',
    'profile.goal':           '\u0627\u0644\u0647\u062F\u0641 \u0627\u0644\u062A\u062F\u0631\u064A\u0628\u064A',
    'profile.targetWeight':   '\u0627\u0644\u0648\u0632\u0646 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641',
    'profile.targetFat':      '\u0646\u0633\u0628\u0629 \u0627\u0644\u062F\u0647\u0648\u0646 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641\u0629',
    'profile.targetMuscle':   '\u0627\u0644\u0639\u0636\u0644 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641',
    'profile.priority':       '\u0627\u0644\u0639\u0636\u0644\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629',
    'profile.age':            '\u0627\u0644\u0639\u0645\u0631',
    'profile.bmi':            '\u0645\u0624\u0634\u0631 \u0627\u0644\u0643\u062A\u0644\u0629',
    'profile.tdee':           '\u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0627\u0644\u0637\u0627\u0642\u0629',
    'profile.title':          '\u0645\u0644\u0641\u064A \u0627\u0644\u0634\u062E\u0635\u064A',
    'profile.male':           '\u2642\uFE0F \u0630\u0643\u0631',
    'profile.female':         '\u2640\uFE0F \u0623\u0646\u062B\u0649',
    'profile.other':          '\u26A7\uFE0F \u0623\u0641\u0636\u0644 \u0639\u062F\u0645 \u0627\u0644\u0625\u0641\u0635\u0627\u062D',
    'profile.cm':             '\u0633\u0645',
    'profile.ft':             '\u0642\u062F\u0645',
    'profile.goalMuscle':     '\u0628\u0646\u0627\u0621 \u0627\u0644\u0639\u0636\u0644',
    'profile.goalStrength':   '\u0628\u0646\u0627\u0621 \u0627\u0644\u0642\u0648\u0629',
    'profile.goalFatLoss':    '\u062D\u0631\u0642 \u0627\u0644\u062F\u0647\u0648\u0646',
    'profile.goalEndurance':  '\u0627\u0644\u062A\u062D\u0645\u0644',
    'profile.goalRecomp':     '\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0643\u0648\u064A\u0646',
    'profile.noGoal':         '\uD83C\uDFAF \u0627\u062E\u062A\u0631 \u0647\u062F\u0641\u0627\u064B',
    'profile.noPriority':     '\uD83C\uDFAF \u0644\u0627 \u0623\u0648\u0644\u0648\u064A\u0629',

    // Settings
    'settings.appTheme':      '\u0633\u0645\u0629 \u0627\u0644\u062A\u0637\u0628\u064A\u0642',
    'settings.accentColor':   '\u0644\u0648\u0646 \u0627\u0644\u062A\u0645\u064A\u064A\u0632',
    'settings.bgColor':       '\u0644\u0648\u0646 \u0627\u0644\u062E\u0644\u0641\u064A\u0629',

    // Data
    'data.csv':               'CSV',
    'data.json':              'JSON',
    'data.load':              '\u062A\u062D\u0645\u064A\u0644',
    'data.xml':               'XML',
    'data.healthSync':        '\u0645\u0632\u0627\u0645\u0646\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0635\u062D\u0629',
    'data.healthNone':        '\u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u064A\u0627\u0646\u0627\u062A \u0635\u062D\u064A\u0629 \u0645\u062A\u0635\u0644\u0629',
    'data.pedometer':         '\uD83D\uDEB6 \u0628\u062F\u0621 \u0639\u062F \u0627\u0644\u062E\u0637\u0648\u0627\u062A',
    'data.pedometerOff':      '\u0639\u062F\u0627\u062F \u0627\u0644\u062E\u0637\u0648\u0627\u062A \u063A\u064A\u0631 \u0646\u0634\u0637',
    'data.importStrong':      '\u0627\u0633\u062A\u064A\u0631\u0627\u062F Strong/Hevy CSV',
    'data.importApple':       '\u0627\u0633\u062A\u064A\u0631\u0627\u062F Apple Health XML',

    // Overlay
    'overlay.recovery':       '\uD83D\uDD25 \u0627\u0644\u062A\u0639\u0627\u0641\u064A',
    'overlay.trainBtn':       '\u062A\u062F\u0631\u0651\u0628 \u0647\u0630\u0647 \u0627\u0644\u0639\u0636\u0644\u0629',

    // Set types
    'set.warmup':             '\u0625\u062D',
    'set.warmup.label':       '\u0625\u062D\u0645\u0627\u0621',
    'set.dropset':            '\u0645',
    'set.dropset.label':      '\u0645\u062A\u0646\u0627\u0642\u0635\u0629',
    'set.amrap':              '\u0642',
    'set.amrap.label':        '\u0642\u0635\u0648\u0649',
    'set.last':               '\u2190 \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u0633\u0627\u0628\u0642\u0629 \u2014 \u0627\u0643\u062A\u0628 \u0644\u0644\u062A\u0639\u062F\u064A\u0644',

    // Wellness
    'wellness.energy':        '\u26A1 \u0627\u0644\u0637\u0627\u0642\u0629',
    'wellness.sleep':         '\uD83D\uDE34 \u0627\u0644\u0646\u0648\u0645',
    'wellness.mood':          '\uD83C\uDFAF \u0627\u0644\u0645\u0632\u0627\u062C',
    'wellness.train':         '\u0647\u064A\u0627 \u0646\u062A\u062F\u0631\u0628! \uD83D\uDD25',
    'wellness.skip':          '\u062A\u062E\u0637\u064A \u0627\u0644\u064A\u0648\u0645',
    'wellness.beat':          '\u0633\u0623\u062A\u063A\u0644\u0628 \u0639\u0644\u064A\u0647! \uD83C\uDFC6',
    'wellness.saveAnyway':    '\u062D\u0641\u0638 \u0639\u0644\u0649 \u0623\u064A \u062D\u0627\u0644',

    // Toast
    'toast.copiedLastSet':    '\u062A\u0645 \u0646\u0633\u062E \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629 \u0627\u0644\u0633\u0627\u0628\u0642\u0629',
    'toast.programStarted':   '\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C!',
    'toast.programDeactivated': '\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C',
    'toast.setTypeChanged':   '\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0646\u0648\u0639 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629',

    // Program panel
    'program.activate':     '\u062A\u0641\u0639\u064A\u0644',
    'program.restDay':      '\u064A\u0648\u0645 \u0631\u0627\u062D\u0629',
    'program.startSession': '\uD83C\uDFCB\uFE0F \u0627\u0628\u062F\u0623 \u062A\u0645\u0631\u064A\u0646 \u0627\u0644\u064A\u0648\u0645',
    'program.change':       '\u21A9\uFE0F \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C',
    'program.schedule':     '\u0627\u0644\u062C\u062F\u0648\u0644 \u0627\u0644\u0623\u0633\u0628\u0648\u0639\u064A',
    'program.noActive':     '\u0644\u0627 \u064A\u0648\u062C\u062F \u0628\u0631\u0646\u0627\u0645\u062C \u0646\u0634\u0637',

    // Bodyweight session stats
    'bw.stat.sessions':     '\u0627\u0644\u062C\u0644\u0633\u0627\u062A',
    'bw.stat.totalReps':    '\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u062A\u0643\u0631\u0627\u0631\u0627\u062A',
    'bw.stat.bestSet':      '\u0623\u0641\u0636\u0644 \u0645\u062C\u0645\u0648\u0639\u0629',

    // Sets grid headers
    'mo.sets.num':          '#',
    'mo.sets.reps':         '\u062A\u0643\u0631\u0627\u0631',
    'mo.sets.weight':       '\u0648\u0632\u0646',
    'mo.sets.vol':          '\u062D\u062C\u0645',

    // Recovery / dash
    'dash.recoveryStatus':  'حالة التعافي',

    // Session hero + repeat button
    'sh.brand':   'جلسة فورج',
    'sh.start':   'ابدأ الجلسة',
    'sh.repeat':  'كرّر آخر تمرين',

    // Chip recovery legend
    'chip.sore':       'مؤلم',
    'chip.recovering': 'يتعافى',
    'chip.ready':      'جاهز',
    'chip.fresh':      'نشيط',

    // Heatmap legend tiers
    'heat.tier1': 'مُدرَّب 0–1 يوم',
    'heat.tier2': 'يتعافى 2–3 أيام',
    'heat.tier3': 'جاهز 4–6 أيام',
    'heat.tier4': 'مستعد 7–13 يوم',
    'heat.tier5': 'راحة 14+ يوم / غير مُدرَّب',

    // Recovery detail badge
    'recovery.tier1': '🔴 مُدرَّب (0–1 يوم)',
    'recovery.tier2': '🟠 يتعافى (2–3 أيام)',
    'recovery.tier3': '🟡 جاهز (4–6 أيام)',
    'recovery.tier4': '🟢 مستعد (7–13 يوم)',
    'recovery.tier5': '⚪ راحة (14+ يوم)',

    // History / session
    'hist.noWorkouts':      'لا تمارين بعد',
    'hist.emptyTitle':      'لم تُسجَّل أي تمارين في هذه الجلسة',

    // Onboarding
    'onb.back':              'رجوع',
    'onb.skip':              'تخطّي',
    'onb.next':              'التالي ←',
    'onb.step':              'خطوة',
    'onb.of':                'من',
    'onb.welcome.title':     'مرحباً بك في فورج',
    'onb.welcome.sub':       'صالتك. قواعدك.',
    'onb.welcome.desc':      'أعدّ ملفك الشخصي في أقل من دقيقة واحصل على تجربة تدريب مخصصة.',
    'onb.welcome.cta':       'ابدأ الآن ←',
    'onb.name.title':        'ما اسمك؟',
    'onb.name.sub':          'سنستخدمه لتخصيص تجربتك.',
    'onb.name.placeholder':  'مثال: أحمد',
    'onb.lbl.name':          'الاسم',
    'onb.about.title':       'عنك',
    'onb.about.sub':         'يساعدنا في حساب إحصائياتك بدقة.',
    'onb.about.gender':      'أنا',
    'onb.about.male':        'ذكر',
    'onb.about.female':      'أنثى',
    'onb.about.other':       'أفضّل عدم الإفصاح',
    'onb.about.dob':         'تاريخ الميلاد',
    'onb.measure.title':     'مقاساتك',
    'onb.measure.sub':       'تُستخدم لحساب مؤشر كتلة الجسم واستهلاك الطاقة.',
    'onb.measure.weight':    'الوزن الحالي',
    'onb.measure.height':    'الطول',
    'onb.goal.title':        'هدفك الرئيسي',
    'onb.goal.title2':       'الهدف',
    'onb.goal.sub':          'سنضبط التدريب والمهام حول هذا الهدف.',
    'onb.goal.muscle':       'بناء العضلات',
    'onb.goal.muscle.sub':   'ضخامة وحجم',
    'onb.goal.fat':          'حرق الدهون',
    'onb.goal.fat.sub':      'تنشيف وكارديو',
    'onb.goal.strength':     'بناء القوة',
    'onb.goal.strength.sub': 'قوة أقصى وأوزان',
    'onb.goal.active':       'البقاء نشيطاً',
    'onb.goal.active.sub':   'صحة وعافية',
    'onb.done.title':        'أنت جاهز!',
    'onb.done.sub':          'فورج مخصص لك. لنبنِ شيئاً معاً.',
    'onb.done.cta':          'هيا نبدأ! 🔥',
    'onb.toast':             'مرحباً بك في فورج، {name}! 🔥',
    'onb.toast.athlete':     'رياضي',

    // ── APP TOUR ──
    'tour.back':       'رجوع',
    'tour.skip':       'تخطي',
    'tour.next':       'التالي →',
    'tour.cta':        'هيا نبدأ! 🔥',
    'tour.more.title': 'جولة التطبيق',
    'tour.more.sub':   'إعادة جولة الميزات · 60 ثانية',
    'tour.s0.tag':     'فورج جيم',
    'tour.s0.title':   'نظام الجيم الخاص بك جاهز',
    'tour.s0.sub':     'جولة 60 ثانية لكل ما يمكن لفورج فعله من أجلك.',
    'tour.s1.tag':     'الخطوة 1 · التسجيل',
    'tour.s1.title':   'سجّل كل تكرار',
    'tour.s1.sub':     'اختر مجموعة عضلية، ابحث عن تمرينك، وتتبع مجموعاتك.',
    'tour.s1.f0':      'أكثر من 100 تمرين مدمج',
    'tour.s1.f0s':     'عبر 9 مجموعات عضلية مع بحث ذكي',
    'tour.s1.f1':      'مجموعات · تكرارات · وزن · ملاحظات',
    'tour.s1.f1s':     'بالإضافة إلى علامات الدروب ست والإحماء و AMRAP',
    'tour.s1.f2':      'تلميح الجلسة الأخيرة',
    'tour.s1.f2s':     'شاهد ما رفعته في المرة الأخيرة، مباشرةً',
    'tour.s2.tag':     'الأداء',
    'tour.s2.title':   'اطرد أرقامك القياسية',
    'tour.s2.sub':     'في كل مرة تتجاوز رقمك القياسي، يُطلق فورج تنبيه الإنجاز.',
    'tour.s2.f0':      'شارة الرقم القياسي الفوري',
    'tour.s2.f0s':     'تضيء لحظة تحقيق رقم قياسي جديد',
    'tour.s2.f1':      'سجلات الحجم و 1RM',
    'tour.s2.f1s':     'لكل تمرين، يتتبعها تلقائياً',
    'tour.s2.f2':      'سجل الأرقام القياسية في الإحصائيات',
    'tour.s2.f2s':     'كل تمرين، كل إنجاز',
    'tour.s3.tag':     'الاسترداد',
    'tour.s3.title':   'ارتَح كالمحترفين',
    'tour.s3.sub':     'زر ⏱ العائم موجود في الزاوية اليمنى السفلى على كل شاشة.',
    'tour.s3.f0':      'اضغط بعد كل مجموعة',
    'tour.s3.f0s':     'ابدأ العد التنازلي للراحة فوراً',
    'tour.s3.f1':      'اهتزاز + تنبيه صوتي',
    'tour.s3.f1s':     'لا تفوّت نهاية الراحة أبداً',
    'tour.s3.f2':      'ضبط مسبق: 60 / 90 / 120 / 180 ثانية',
    'tour.s3.f2s':     'ضغطة واحدة لتحديد وقت راحتك',
    'tour.s4.tag':     'التحليلات',
    'tour.s4.title':   'شاهد تقدمك',
    'tour.s4.sub':     'مخططات وخرائط حرارة واتجاهات. شاهد نفسك تتحول.',
    'tour.s4.f0':      'مخططات الحجم والقوة',
    'tour.s4.f0s':     'لكل تمرين ولكل مجموعة عضلية',
    'tour.s4.f1':      'رادار توازن العضلات',
    'tour.s4.f1s':     'اكتشف العضلات التي تهملها',
    'tour.s4.f2':      'وزن الجسم والتقويم',
    'tour.s4.f2s':     'سجلات يومية، اتجاهات أسبوعية، خريطة حرارية',
    'tour.s5.tag':     'التحدي',
    'tour.s5.title':   'ارفع مستواك يومياً',
    'tour.s5.sub':     'كل تكرار يكسبك XP. المهام تدفعك لتجاوز حدودك.',
    'tour.s5.f0':      'مبتدئ → محترف → أسطورة',
    'tour.s5.f0s':     '10 رتب لتتسلقها، كل رتبة أصعب',
    'tour.s5.f1':      'مهام يومية وأسبوعية',
    'tour.s5.f1s':     'تحديات جديدة كل يوم',
    'tour.s5.f2':      'مكافآت التسلسل والشارات',
    'tour.s5.f2s':     'لا تكسر السلسلة',
    'tour.s6.tag':     'المدرب الذكي',
    'tour.s6.title':   'مدربك الشخصي',
    'tour.s6.sub':     'يقرأ فورج بياناتك التدريبية ويتكيف معك يومياً.',
    'tour.s6.f0':      'درجة الاستعداد اليومية',
    'tour.s6.f0s':     'اعرف متى تدفع بقوة أو تتعافى',
    'tour.s6.f1':      'برامج PPL و 5/3/1 و 5×5',
    'tour.s6.f1s':     'قوالب علمية، ضغطة واحدة للبدء',
    'tour.s6.f2':      'أهداف التغذية والماكرو',
    'tour.s6.f2s':     'سعرات حرارية وبروتين مخصصة لهدفك',
    'tour.s7.tag':     'أنت مستعد',
    'tour.s7.title':   'هيا فورج',
    'tour.s7.sub':     'الحديد ينتظر. جلستك الأولى تبدأ الآن.',
    'tour.s7.t0':      'سجّل',
    'tour.s7.t1':      'الأرقام',
    'tour.s7.t2':      'إحصائيات',
    'tour.s7.t3':      'ارتقِ',

    // A2: Auto-rest
    'settings.autoRest':    'بدء مؤقت الراحة تلقائياً',
    'settings.autoRestSub': 'يبدأ مؤقت الراحة بعد كل مجموعة مسجّلة',

    // B1: RPE
    'settings.rpe':    'عرض RPE لكل مجموعة',
    'settings.rpeSub': 'معدل الجهد المبذول (1–10)',
    'form.rpe':        'RPE',

    // B2: Swap
    'form.swap':       '↔ بديل',
    'swap.sub':        'اختر بديلاً لنفس المجموعة العضلية:',
    'swap.cancel':     'إلغاء',

    // C2: Photos
    'photos.title':    'صور التقدم',
    'photos.add':      '+ إضافة',
    'photos.empty':    'لا توجد صور بعد. أضف أولى صور تقدمك!',

  }
};

// ─────────────────────────────────────────────────────────
//  TRANSLATION ENGINE
// ─────────────────────────────────────────────────────────
let currentLang = localStorage.getItem('forge_lang') || 'en';

/** Translate a key — falls back to English if key missing in Arabic */
function t(key) {
  return (LANGS[currentLang] && LANGS[currentLang][key]) || LANGS.en[key] || key;
}

function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'ar' : 'en';
  localStorage.setItem('forge_lang', currentLang);
  applyLanguage(); // applyLanguage handles all label updates including lang buttons
}

function applyLanguage() {
  const isAr = currentLang === 'ar';
  const html = document.documentElement;

  // Set dir and lang attributes
  html.setAttribute('dir', isAr ? 'rtl' : 'ltr');
  html.setAttribute('lang', isAr ? 'ar' : 'en');

  // Update language buttons (header + floating)
  const btn = document.getElementById('lang-toggle-btn');
  const floatBtn = document.getElementById('lang-toggle-float');
  const langLabel = isAr ? 'EN' : 'ع';
  if (btn) btn.textContent = langLabel;
  if (floatBtn) floatBtn.textContent = langLabel;

  // Translate all static data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');
    if (attr) {
      el.setAttribute(attr, t(key));
    } else {
      el.textContent = t(key);
    }
  });

  // Translate placeholder attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });

  // Translate specific dynamic elements by ID
  translateDynamicElements();

  // Re-render dynamic panels (they use JS-generated HTML)
  if (typeof renderStepsPanel === 'function') renderStepsPanel();
  if (typeof renderMissions === 'function') renderMissions();
  // Re-render XP bar so rank name updates in the correct language
  if (typeof updateXPBar === 'function') updateXPBar();
  if (typeof renderProfile === 'function') renderProfile();
  // Always refresh stat bar and coach on language switch so text updates immediately
  if (typeof updateStatBar === 'function') updateStatBar();
  if (typeof renderCoach === 'function') renderCoach();
  if (typeof renderCoachPlan === 'function') renderCoachPlan();
  if (typeof renderCoachNutrition === 'function') renderCoachNutrition();
  if (typeof renderCoachTrain === 'function') renderCoachTrain();
  const vHistory = document.getElementById('view-history');
  if (typeof renderHistory === 'function' && vHistory && vHistory.classList.contains('active')) {
    renderHistory(); if (typeof renderPRs === 'function') renderPRs();
  }
  // Always re-render the stats page content so language is correct.
  // Each call is wrapped individually so an error in one never blocks the others.
  if (typeof renderBodyHeatmap   === 'function') try { renderBodyHeatmap();   } catch(e) { console.warn('renderBodyHeatmap:', e); }
  if (typeof renderMuscleBalance === 'function') try { renderMuscleBalance(); } catch(e) { console.warn('renderMuscleBalance:', e); }
  if (typeof renderMuscleVol     === 'function') try { renderMuscleVol();     } catch(e) { console.warn('renderMuscleVol:', e); }
  if (typeof populateExerciseSelect === 'function') try { populateExerciseSelect(); } catch(e) { console.warn('populateExerciseSelect:', e); }
  // Only rebuild heavy chart renders when the stats tab is visible
  const vDash = document.getElementById('view-dashboard');
  if (typeof renderDashboard === 'function' && vDash && vDash.classList.contains('active')) {
    try { renderDashboard(); } catch(e) { console.warn('renderDashboard on lang switch:', e); }
    // After renderDashboard (which rebuilds charts + muscle balance), do a final guaranteed
    // re-render of the text-only panels so the correct language is always shown.
    // Use setTimeout so it fires AFTER any chart rendering that renderDashboard triggers.
    const _langSnap = currentLang;
    setTimeout(() => {
      if (currentLang !== _langSnap) return; // user switched again, skip
      if (typeof renderMuscleBalance === 'function') try { renderMuscleBalance(); } catch(e) {}
      if (typeof renderMuscleVol     === 'function') try { renderMuscleVol();     } catch(e) {}
      if (typeof populateExerciseSelect === 'function') try { populateExerciseSelect(); } catch(e) {}
      // Re-scan data-i18n to catch any static elements re-rendered by renderDashboard
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const attr = el.getAttribute('data-i18n-attr');
        if (key && typeof t === 'function') {
          if (attr) el.setAttribute(attr, t(key));
          else el.textContent = t(key);
        }
      });
    }, 80);
  }
  const vMore = document.getElementById('view-more');
  if (typeof renderMyTemplates === 'function' && vMore && vMore.classList.contains('active')) {
    renderMyTemplates();
  }

  // Update nav labels
  updateNavLabels();
  // Re-render guide if visible
  if (typeof renderGuide === 'function' && document.getElementById('guide-content')) renderGuide();
  // Update mascot name (BUDDY suffix translates)
  if (typeof _updateMascot === 'function') _updateMascot();
  // Update coach ticker with new language messages
  if (typeof _updateHdrCoach === 'function') _updateHdrCoach();
  // Refresh header status pills in correct language
  if (typeof _updateHdrStats  === 'function') _updateHdrStats();
  if (typeof _updateHdrWater  === 'function') _updateHdrWater();
  if (typeof _updateHdrSteps  === 'function') _updateHdrSteps();
  if (typeof _updateHdrStreak === 'function') _updateHdrStreak();
  // Re-set muscle badge: show translated muscle name if selected, else "TAP BODY"
  const _smBadge = document.getElementById('selected-muscle-badge');
  if (_smBadge) {
    if (typeof selectedMuscle !== 'undefined' && selectedMuscle) {
      _smBadge.textContent = t('muscle.' + selectedMuscle);
    } else {
      _smBadge.textContent = t('bodymap.tapBody');
    }
  }
  // Refresh set-count badge in correct language
  if (typeof _updateSetBadge === 'function') {
    const _curSets = (typeof bwSetCount !== 'undefined' && bwSetCount > 0) ? bwSetCount
                   : (typeof setCount !== 'undefined' ? setCount : 0);
    _updateSetBadge(_curSets);
  }
  // Update mode buttons
  updateModeButtons();
  // Update form labels
  updateFormLabels();
  // Update static section labels
  updateStaticLabels();
  // Re-render program panel in Log view so its text immediately updates on language switch
  if (typeof renderProgramPanel === "function") renderProgramPanel();
  // Refresh onboarding overlay if visible
  const _onbEl = document.getElementById('forge-onboarding');
  if (_onbEl && _onbEl.style.display !== 'none') {
    const _onbBtn = document.getElementById('onb-next-btn');
    if (_onbBtn) {
      if (typeof _onbStep !== 'undefined') {
        if (_onbStep === 0) _onbBtn.textContent = t('onb.welcome.cta');
        else if (_onbStep === 5) _onbBtn.textContent = t('onb.done.cta');
        else _onbBtn.textContent = t('onb.next');
      }
    }
    // Refresh step number labels
    for (let _oi = 1; _oi <= 4; _oi++) {
      const _oEl = document.getElementById('onb-step-num-' + _oi);
      if (_oEl) _oEl.textContent = t('onb.step') + ' ' + _oi + ' ' + t('onb.of') + ' 4';
    }
    // Refresh summary if on done screen
    if (typeof _onbStep !== 'undefined' && _onbStep === 5 && typeof _onbRenderSummary === 'function') {
      _onbRenderSummary();
    }
  }
}

function translateDynamicElements() {
  // Edit mode bar
  const eml = document.querySelector('.edit-mode-label');
  if (eml) eml.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' + t('header.editLayout');
  const emh = document.querySelector('.edit-hint');
  if (emh) emh.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:4px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' + t('header.editHint');
  const editBtn = document.getElementById('edit-layout-btn');
  if (editBtn && !editBtn.classList.contains('active')) editBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:4px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' + t('header.edit');
  const doneBtn = document.querySelector('.edit-done-btn');
  if (doneBtn) doneBtn.textContent = t('header.done');

  // App subtitle
  const tag = document.getElementById('header-greeting');
  // only update if it still shows the default subtitle (don't overwrite greeting)
  if (tag && (tag.textContent === '// Gym OS' || tag.textContent === '// تتبع التمارين')) {
    tag.textContent = t('app.subtitle');
  }

  // Timer section
  const timerLabel = document.querySelector('.timer-widget .section-label');
  if (timerLabel) timerLabel.textContent = t('timer.title');
  const startBtn = document.querySelector('.timer-controls .btn-ghost:first-child');
  const resetBtn = document.querySelector('.timer-controls .btn-ghost:last-child');
  // Use querySelectorAll for timer buttons
  const timerBtns = document.querySelectorAll('.timer-controls .btn.btn-ghost.btn-sm');
  if (timerBtns[0]) timerBtns[0].textContent = t('timer.start');
  if (timerBtns[1]) timerBtns[1].textContent = t('timer.reset');

  // Stat indicator labels
  const labels = {
    'stat-vol': { label: 'ind.volume', sub: 'stat-vol-delta' },
    'stat-streak': { label: 'ind.streak', sub: 'stat-streak-delta' },
    'stat-prs': { label: 'ind.prs', sub: 'stat-prs-delta' },
    'stat-week': { label: 'ind.week', sub: 'stat-week-delta' },
  };
  document.querySelectorAll('.ind-card').forEach((card, i) => {
    const labelEl = card.querySelector('.ind-label');
    const subEl   = card.querySelector('.ind-sub');
    const keys = [
      { label: 'ind.volume', sub: null },
      { label: 'ind.streak', sub: null },
      { label: 'ind.prs',    sub: null },
      { label: 'ind.week',   sub: 'ind.sessions' },
    ];
    if (keys[i] && labelEl) labelEl.textContent = t(keys[i].label);
    if (keys[i] && keys[i].sub && subEl && subEl.textContent === 'Sessions') {
      subEl.textContent = t('ind.sessions');
    }
  });

  // History filter options
  const fm = document.getElementById('filter-muscle');
  if (fm && fm.options[0]) fm.options[0].text = t('history.filter.muscle');
  const fsort = document.getElementById('filter-sort');
  if (fsort) {
    const sortMap = ['history.filter.newest', 'history.filter.oldest', 'history.filter.volume'];
    Array.from(fsort.options).forEach((opt, i) => {
      if (sortMap[i]) opt.text = t(sortMap[i]);
    });
  }
  const fex = document.getElementById('filter-exercise');
  if (fex) fex.placeholder = t('history.filter.exercise');

  // Modal - template
  const tmplTitle = document.querySelector('#template-modal .modal-sheet > div:first-of-type');
  if (tmplTitle) tmplTitle.textContent = t('tmpl.new');
  const tmplLabels = document.querySelectorAll('#template-modal .form-group label');
  const tmplLabelKeys = ['tmpl.name', 'tmpl.muscle', 'tmpl.exercises', 'tmpl.icon'];
  tmplLabels.forEach((el, i) => { if (tmplLabelKeys[i]) el.textContent = t(tmplLabelKeys[i]); });
  const tmplSaveBtn = document.querySelector('#template-modal .btn-primary');
  if (tmplSaveBtn) tmplSaveBtn.textContent = t('tmpl.save');

  // Achievement popup title
  const achTitle = document.querySelector('.ach-title');
  if (achTitle) achTitle.textContent = t('ach.title');

  // Muscle overlay tabs
  const moTabs = document.querySelectorAll('.mo-tab');
  const moTabKeys = ['overlay.history', 'overlay.tips', 'overlay.exercises'];
  moTabs.forEach((tab, i) => { if (moTabKeys[i]) tab.textContent = t(moTabKeys[i]); });

  // Muscle overlay stat labels
  const moStatLbls = document.querySelectorAll('.mo-stat-lbl');
  const moStatKeys = ['overlay.sessions', 'overlay.totalVol', 'overlay.bestPR', 'overlay.lastTrained'];
  moStatLbls.forEach((el, i) => { if (moStatKeys[i]) el.textContent = t(moStatKeys[i]); });

  // Muscle overlay CTA
  const moCta = document.getElementById('mo-cta-btn');
  if (moCta) moCta.querySelector('span').textContent = t('bodymap.train');

  // Muscle overlay sub line (sessions count text)
  const moSub = document.getElementById('mo-sub');
  if (moSub) {
    const count = moSub.textContent.split(' ')[0];
    moSub.textContent = count + ' ' + t('overlay.sessions');
  }

  // Body map front/back buttons
  const bodyBtns = document.querySelectorAll('.body-map-controls button, .body-view-btn');
  if (bodyBtns[0]) bodyBtns[0].textContent = t('bodymap.front');
  if (bodyBtns[1]) bodyBtns[1].textContent = t('bodymap.back');

  // History panel title
  const histTitle = document.querySelector('#view-history .section-label:first-child, .history-title');
  if (histTitle) histTitle.textContent = t('history.title');

  // PRs title
  const prsTitle = document.querySelector('.prs-title, #prs-panel .section-label');
  if (prsTitle) prsTitle.textContent = t('prs.title');

  // More view section labels
  translateMoreView();

  // Settings panel
  translateSettings();

  // Data panel buttons
  translateDataPanel();

  // Install guide
  translateInstallGuide();

  // PWA install banner
  const pwaBannerTitle = document.getElementById('pwa-banner-title');
  const pwaBannerSub   = document.getElementById('pwa-banner-sub');
  const pwaInstallBtn  = document.getElementById('pwa-install-btn');
  const isAr = (typeof currentLang !== 'undefined') && currentLang === 'ar';
  if (pwaBannerTitle) pwaBannerTitle.textContent = isAr ? 'تثبيت فورج' : 'Install FORGE';
  if (pwaBannerSub)   pwaBannerSub.textContent   = isAr ? 'أضف إلى الشاشة الرئيسية للحصول على تجربة التطبيق الكاملة' : 'Add to home screen for the full app experience';
  if (pwaInstallBtn)  pwaInstallBtn.textContent   = isAr ? 'تثبيت' : 'INSTALL';
}

function updateNavLabels() {
  // Nav labels now use data-i18n spans — handled by the main applyLanguage scan.
  // This function is kept for legacy compatibility but the spans are the source of truth.
  const navMap = {
    'bnav-log': 'nav.log',
    'bnav-dashboard': 'nav.stats',
    'bnav-history': 'nav.history',
    'bnav-nutrition': 'nav.nutrition',
    'bnav-more': 'nav.more',
  };
  Object.entries(navMap).forEach(([id, key]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    // Try data-i18n span first (new approach)
    const span = btn.querySelector('[data-i18n]');
    if (span) { span.textContent = t(key); return; }
    // Fallback: raw text node (old approach)
    const textNodes = Array.from(btn.childNodes).filter(n => n.nodeType === 3);
    if (textNodes.length) {
      textNodes[textNodes.length - 1].textContent = t(key);
    }
  });
}

function updateModeButtons() {
  const wb = document.getElementById('mode-btn-weighted');
  const bb = document.getElementById('mode-btn-bodyweight');
  if (wb) wb.innerHTML = '<svg class="mode-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;"><line x1="6" y1="5" x2="6" y2="19"/><line x1="18" y1="5" x2="18" y2="19"/><line x1="2" y1="12" x2="22" y2="12"/><rect x="1" y="9" width="5" height="6" rx="1"/><rect x="18" y="9" width="5" height="6" rx="1"/><rect x="9" y="7" width="6" height="10" rx="1"/></svg>' + t('mode.weighted');
  if (bb) bb.innerHTML = '<svg class="mode-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;"><circle cx="12" cy="5" r="2"/><path d="M12 7v8"/><path d="M8 17l4 4 4-4"/><path d="M9 12l-2 2"/><path d="M15 12l2 2"/></svg>' + t('mode.bodyweight');
}

function updateFormLabels() {
  // Main workout form labels
  const formLabelMap = [
    { sel: '#muscle-select', prev: true, key: 'form.muscle' },
    { sel: '#exercise-select', prev: true, key: 'form.exercise' },
  ];
  // Muscle group select in main form
  const muscleLabel = document.querySelector('label[for="muscle-select"]');
  if (muscleLabel) muscleLabel.textContent = t('form.muscle');
  const exerciseLabel = document.querySelector('label[for="exercise-select"]');
  if (exerciseLabel) exerciseLabel.textContent = t('form.exercise');

  // Save button — update only the text span, not the SVG icon
  const saveBtnSpan = document.querySelector('[onclick="saveWorkout()"] span[data-i18n="form.save"]');
  if (saveBtnSpan) saveBtnSpan.textContent = t('form.save');
  const saveBwBtn = document.querySelector('[onclick="saveBwWorkout()"]');
  if (saveBwBtn) saveBwBtn.textContent = t('bw.save');

  // Add set buttons — use data-i18n so applyLanguage handles them, but also update here for instant refresh
  document.querySelectorAll('[onclick="addSet()"][data-i18n]').forEach(btn => btn.textContent = t('form.addSet'));
  document.querySelectorAll('[onclick="addBwSet()"][data-i18n]').forEach(btn => btn.textContent = t('bw.addSet'));

  // "Recent —" heading (has a child span — update text node only)
  const recentHeading = document.getElementById('wgt-muscle-history-heading');
  if (recentHeading) {
    const _fAr2 = (typeof currentLang !== 'undefined') && currentLang === 'ar';
    const span = recentHeading.querySelector('#wgt-muscle-history-label');
    recentHeading.childNodes.forEach(n => { if (n.nodeType === 3) n.textContent = _fAr2 ? 'الأخيرة — ' : 'Recent — '; });
    if (span && !recentHeading.contains(span)) recentHeading.appendChild(span);
  }

  // Exercise entry panel title (changes based on weighted/bodyweight mode)
  const exPanelTitle = document.getElementById('exercise-panel-title');
  if (exPanelTitle) {
    const _fAr = (typeof currentLang !== 'undefined') && currentLang === 'ar';
    const _isWgt = (typeof workoutMode === 'undefined') || workoutMode === 'weighted';
    exPanelTitle.textContent = _isWgt
      ? (_fAr ? 'إدخال التمرين' : 'Exercise Entry')
      : (_fAr ? 'تمرين وزن الجسم' : 'Bodyweight Exercise');
  }

  // Exercise name placeholder
  const exInput = document.getElementById('exercise-name');
  if (exInput) {
    const _fAr = (typeof currentLang !== 'undefined') && currentLang === 'ar';
    const _isWgt = (typeof workoutMode === 'undefined') || workoutMode === 'weighted';
    exInput.placeholder = _isWgt
      ? (_fAr ? 'مثال: ضغط الصدر، القرفصاء…' : 'e.g. Bench Press, Squat…')
      : (_fAr ? 'مثال: ضغط، بيربي…' : 'e.g. Push-Ups, Burpees…');
  }

  // Notes placeholder
  const notesInput = document.getElementById('session-notes');
  if (notesInput) {
    const _fAr = (typeof currentLang !== 'undefined') && currentLang === 'ar';
    notesInput.placeholder = _fAr ? 'كيف شعرت؟ أي أرقام قياسية؟' : 'How did it feel? Any PRs?';
  }
}

function updateStaticLabels() {
  // Section labels (Rest Timer title, etc.)
  document.querySelectorAll('.section-label').forEach(el => {
    const txt = el.textContent.trim();
    if (txt === 'Rest Timer' || txt === 'مؤقت الراحة') el.textContent = t('timer.title');
    if (txt === 'EDIT LAYOUT' || txt === 'تعديل التخطيط') return; // handled elsewhere
  });
}

function translateMoreView() {
  // Panel titles in More view - use text content matching
  document.querySelectorAll('#view-more .panel-title').forEach(el => {
    const txt = el.textContent.trim();
    const map = {
      'My Profile': t('more.profile'),
      'الملف الشخصي': t('more.profile'),
      'Settings': t('more.settings'),
      'الإعدادات': t('more.settings'),
      'My Templates': t('more.templates'),
      'قوالبي': t('more.templates'),
      'Data & Export': t('more.data'),
      'البيانات والتصدير': t('more.data'),
      'Install on Phone': t('more.install'),
      'التثبيت على الهاتف': t('more.install'),
      'Bodyweight History': t('more.bwHistory'),
      'سجل وزن الجسم': t('more.bwHistory'),
      'Body Composition': t('more.bodyComp'),
      'تكوين الجسم': t('more.bodyComp'),
    };
    if (map[txt]) el.textContent = map[txt];
  });
  // Profile edit button
  const profEdit = document.querySelector('[onclick="editName()"]');
  if (profEdit) profEdit.textContent = t('profile.editName');
}

function translateSettings() {
  document.querySelectorAll('.toggle-label').forEach(el => {
    const txt = el.textContent.trim();
    const map = {
      'Rest Timer Sound': t('settings.sound'),
      'صوت مؤقت الراحة': t('settings.sound'),
      'Show Last Session Hint': t('settings.hint'),
      'عرض تلميح الجلسة السابقة': t('settings.hint'),
    };
    if (map[txt]) el.textContent = map[txt];
  });
  // Hint text under toggles
  document.querySelectorAll('.toggle-row > div > div:nth-child(2)').forEach(el => {
    const txt = el.textContent.trim();
    const map = {
      'Vibrate & beep when rest ends': t('settings.soundHint'),
      'اهتزاز وصوت تنبيه عند انتهاء الراحة': t('settings.soundHint'),
      'Shows previous sets when logging': t('settings.hintHint'),
      'يعرض المجموعات السابقة عند التسجيل': t('settings.hintHint'),
    };
    if (map[txt]) el.textContent = map[txt];
  });
}

function translateDataPanel() {
  document.querySelectorAll('#view-more .panel-body .btn').forEach(el => {
    // Preserve SVG child node, only replace text nodes
    const svgEl = el.querySelector('svg');
    const txt = el.textContent.trim();
    const replaceText = (newTxt) => {
      // Remove all text nodes, keep child elements (SVG)
      Array.from(el.childNodes).forEach(n => { if (n.nodeType === 3) n.remove(); });
      el.appendChild(document.createTextNode(newTxt));
    };
    if (txt.includes('Export') || txt.includes('تصدير')) {
      replaceText(t('data.export'));
    } else if (txt.includes('Backup') || txt.includes('نسخ احتياطي')) {
      replaceText(t('data.backup'));
    } else if (txt.includes('Clear') || txt.includes('مسح')) {
      replaceText(t('data.clear'));
    } else if (txt.includes('Restore') || txt.includes('استعادة')) {
      // label has hidden file input — preserve it
      const input = el.querySelector('input');
      Array.from(el.childNodes).forEach(n => { if (n.nodeType === 3) n.remove(); });
      el.appendChild(document.createTextNode(t('data.restore')));
      if (input) el.appendChild(input);
    }
  });
}

function translateInstallGuide() {
  const tipCards = document.querySelectorAll('#view-more .tip-card');
  tipCards.forEach(card => {
    const titleEl = card.querySelector('.tip-title');
    const textEl  = card.querySelector('.tip-text');
    if (!titleEl || !textEl) return;
    const title = titleEl.textContent.trim();
    const map = {
      'Android (Chrome)':   { title: t('install.android'), text: t('install.androidText') },
      'أندرويد (Chrome)':   { title: t('install.android'), text: t('install.androidText') },
      'iPhone (Safari)':    { title: t('install.ios'),     text: t('install.iosText') },
      'آيفون (Safari)':     { title: t('install.ios'),     text: t('install.iosText') },
      'Get a Real APK':     { title: t('install.apk'),     text: t('install.apkText') },
      'الحصول على APK':     { title: t('install.apk'),     text: t('install.apkText') },
    };
    if (map[title]) {
      titleEl.textContent = map[title].title;
      textEl.textContent  = map[title].text;
    }
  });
}

// renderStepsPanel already handles Arabic internally — no patch needed.

// showToast is defined in the main script — no override needed.
// Use the global t() function to translate strings before passing to showToast().

// ─────────────────────────────────────────────────────────
//  ANDROID / MOBILE FIXES
// ─────────────────────────────────────────────────────────

// 1. Fast tap on buttons (removes 300ms delay on Android)
// Only preventDefault on non-scrollable button elements to avoid scroll interference
let _lastTouchTime = 0;
document.addEventListener('touchend', function(e) {
  const tgt = e.target.closest('button:not([data-scroll]), .bnav-btn, .mode-toggle-btn');
  if (!tgt) return;
  const now = Date.now();
  if (now - _lastTouchTime < 350) { e.preventDefault(); } // prevent double-tap zoom only
  _lastTouchTime = now;
}, { passive: false });

// 2. Fix viewport height on Android (address bar changes vh)
function setVh() {
  document.documentElement.style.setProperty('--real-vh', window.innerHeight * 0.01 + 'px');
}
setVh();
window.addEventListener('resize', setVh, { passive: true });
window.addEventListener('orientationchange', () => setTimeout(setVh, 300), { passive: true });

// 3. Prevent body scroll when modal is open (Android scroll lock)
function lockBodyScroll()   { document.body.style.overflow = 'hidden'; }
function unlockBodyScroll() { document.body.style.overflow = ''; }

// 4. Fix input zoom on Android — ensure all number inputs have inputmode
function fixMobileInputs() {
  document.querySelectorAll('input[type="number"]').forEach(inp => {
    if (!inp.getAttribute('inputmode')) inp.setAttribute('inputmode', 'numeric');
  });
  document.querySelectorAll('input[type="text"]').forEach(inp => {
    if (!inp.getAttribute('inputmode')) inp.setAttribute('inputmode', 'text');
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', fixMobileInputs, { once: true });
} else {
  fixMobileInputs();
}
// Re-run after dynamic content renders
setTimeout(fixMobileInputs, 1500);

// 5. Smooth scroll: webkit momentum for elements that already need to scroll
// NOTE: do NOT set overflowY='auto' here — it traps touch-scroll on iOS/Android
// for elements that don't have a height constraint, blocking page scroll.

// 6. Add active state visual feedback for touch (Android doesn't show :hover)
document.addEventListener('touchstart', function(e) {
  const tgt = e.target.closest('button, .btn, .bnav-btn, .ind-card, .wk-entry');
  if (tgt) tgt.classList.add('touch-active');
}, { passive: true });
document.addEventListener('touchend', function(e) {
  document.querySelectorAll('.touch-active').forEach(el => el.classList.remove('touch-active'));
}, { passive: true });

// Prevent scroll from accidentally changing number input values (desktop wheel + mobile blur-on-scroll)
document.addEventListener('wheel', function(e) {
  if (document.activeElement && document.activeElement.type === 'number') {
    document.activeElement.blur();
  }
}, { passive: true });

// Add touch-active CSS + comprehensive Android fixes via JS
(function() {
  const style = document.createElement('style');
  style.textContent = `
    /* Touch feedback */
    .touch-active { opacity: 0.75 !important; transform: scale(0.97) !important; transition: none !important; }

    /* Android safe-area & layout */
    @media (max-width: 767px) {
      .bottom-nav { height: calc(64px + env(safe-area-inset-bottom, 0px)); }
      body {
        padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 72px);
        -webkit-text-size-adjust: 100%;
        text-size-adjust: 100%;
      }
      /* Larger touch targets */
      .bnav-btn { min-height: 56px; padding-bottom: env(safe-area-inset-bottom, 0px); }
      .btn { min-height: 44px; }
      /* All inputs at 16px to prevent auto-zoom on Android & iOS */
      input, select, textarea { font-size: 16px !important; }
      /* Smooth scrolling only for elements that actually scroll internally */
      .ex-lib-list, .bw-history-inner, .mdc-card, .wend-card, .mo-content {
        -webkit-overflow-scrolling: touch;
      }
      /* Prevent accidental text selection on tap */
      button, .btn, .bnav-btn, .mode-toggle-btn, .tip-card, .ind-card {
        -webkit-user-select: none;
        user-select: none;
      }
    }

    /* PWA Install Banner */
    #pwa-install-banner {
      display: none;
      position: fixed;
      bottom: calc(72px + env(safe-area-inset-bottom, 0px));
      left: 12px; right: 12px;
      background: var(--panel);
      border: 1px solid var(--green);
      border-radius: 14px;
      padding: 14px 16px;
      z-index: 9999;
      box-shadow: 0 4px 24px #0008;
      animation: slideUp .3s ease;
    }
    #pwa-install-banner.show { display: flex; align-items: center; gap: 12px; }
    #pwa-install-banner .pwa-icon { font-size: 28px; flex-shrink: 0; }
    #pwa-install-banner .pwa-text { flex: 1; }
    #pwa-install-banner .pwa-title { font-family: 'Bebas Neue', sans-serif; font-size: 16px; color: var(--green); letter-spacing: 1px; }
    #pwa-install-banner .pwa-sub { font-size: 11px; color: var(--text2); margin-top: 2px; }
    #pwa-install-banner .pwa-btn { background: var(--green); color: #000; border: none; border-radius: 8px; padding: 8px 14px; font-family: 'Bebas Neue', sans-serif; font-size: 14px; letter-spacing: 1px; cursor: pointer; flex-shrink: 0; }
    #pwa-install-banner .pwa-dismiss { background: none; border: none; color: var(--text3); font-size: 18px; cursor: pointer; padding: 4px 8px; flex-shrink: 0; }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `;
  document.head.appendChild(style);
})();

// PWA Install Banner (Android Chrome "beforeinstallprompt")
(function() {
  let _deferredPrompt = null;
  const BANNER_DISMISSED_KEY = 'forge_install_dismissed';

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredPrompt = e;

    // Don't show if user already dismissed or app is already installed
    if (localStorage.getItem(BANNER_DISMISSED_KEY)) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Show banner after 3 seconds
    setTimeout(() => {
      const banner = document.getElementById('pwa-install-banner');
      if (banner) banner.classList.add('show');
    }, 3000);
  });

  // Install button click
  document.addEventListener('click', function(e) {
    if (e.target.closest('#pwa-install-btn')) {
      if (_deferredPrompt) {
        _deferredPrompt.prompt();
        _deferredPrompt.userChoice.then(choice => {
          _deferredPrompt = null;
          const banner = document.getElementById('pwa-install-banner');
          if (banner) banner.classList.remove('show');
          if (choice.outcome === 'accepted') localStorage.setItem(BANNER_DISMISSED_KEY, '1');
        });
      }
    }
    if (e.target.closest('#pwa-dismiss-btn')) {
      const banner = document.getElementById('pwa-install-banner');
      if (banner) banner.classList.remove('show');
      localStorage.setItem(BANNER_DISMISSED_KEY, '1');
    }
  });

  // Hide banner if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.classList.remove('show');
  }
})();

// ─────────────────────────────────────────────────────────
//  INIT — Apply saved language on page load
// ─────────────────────────────────────────────────────────
(function initLanguage() {
  // Always apply language on load (for both Arabic and English)
  // so all JS-rendered content (muscle balance, vol list, etc.) uses the correct language
  function doApply() { setTimeout(applyLanguage, 400); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', doApply);
  } else {
    doApply();
  }
})();
