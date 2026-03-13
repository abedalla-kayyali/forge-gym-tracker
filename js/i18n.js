// FORGE Gym Tracker â€” i18n / Multilingual System
// Auto-extracted from index.html â€” edit here for future translation changes.

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  TRANSLATION DICTIONARY
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const LANGS = {
  en: {
    // Header
    'app.title': 'FORGE',
    'app.subtitle': '// Gym OS',
    'header.edit': 'Edit',
    'header.done': 'DONE',
    'header.editLayout': 'EDIT LAYOUT',
    'header.editHint': 'â†‘â†“ reorder آ· toggle visibility',

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
    'timer.start': 'â–¶ Start',
    'timer.reset': 'â–  Reset',
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
    'form.exercisePlaceholder': 'e.g. Bench Press, Squatâ€¦',
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
    'history.entries': 'entries',
    'history.gamify.currentStreak': 'Current Streak',
    'history.gamify.days': 'days',
    'history.gamify.best': 'Best',
    'history.gamify.prHits': 'PR Hits',
    'history.gamify.records': 'records',
    'history.gamify.visibleSessions': 'of all visible sessions',
    'history.gamify.level': 'History Level',
    'history.gamify.volumeBank': 'Volume Bank',
    'history.gamify.activeDays': 'active days',

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
    'install.androidText': 'Tap the three-dot menu â†’ "Add to Home screen" â†’ Install.',
    'install.ios': 'iPhone (Safari)',
    'install.iosText': 'Tap the Share button â†’ "Add to Home Screen" â†’ Add.',
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
    'coach.status.init':   'Analysing your trainingâ€¦',

    // Smart Tips
    'section.tips': 'Smart Tips',
    'section.tipsbadge': 'HINTS',
    'tip.overload.title': 'Progressive Overload',
    'tip.overload.text': 'Aim to add 2.5â€“5 kg every 2 weeks. Small gains compound into massive results.',
    'tip.timer.title': 'Use the Rest Timer',
    'tip.timer.text': 'Consistent rest periods (60â€“120s) lead to better strength performance across sets.',

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
    'dash.selectExercise': 'â€” Select exercise â€”',
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
    'btn.close': 'âœ•',
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
    'mission.banner.allDone': 'ALL DONE! ًںژ‰',

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
    'balance.msg.focus': "Focus needed â€” you're overtraining some muscles.",
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

    // Form â€” missing orphan key
    'form.noSetsYet':     'Add your first set!',
    'form.browse':        '\uD83D\uDD0D Browse',
    'form.plates':        '\uD83C\uDFCB Plates',
    'form.effort':        'Session Effort',
    'form.easy':          '\uD83D\uDE0A EASY',
    'form.med':           '\uD83D\uDE24 MED',
    'form.hard':          '\uD83D\uDCAA HARD',
    'form.fail':          '\uD83D\uDE2B FAIL',
    'form.endSession':    'âڑ، END SESSION',
    'form.endSessionHint': 'Tap twice to end your workout session',
    'form.selectMuscleBegin': 'select a muscle to begin',
    'form.liveSession':   'LIVE SESSION',
    'form.done':          '\u2714\uFE0F DONE',

    // Stats inner tabs (new â€” from plan Change 6)
    'dash.tab.overview':  'Overview',
    'dash.tab.progress':  'Progress',
    'dash.tab.muscles':   'Muscles',
    'dash.tab.body':      'Body',

    // Stats period selector (new â€” from plan Change 7)
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

    // Nav â€” Coach tab (new â€” from plan Change 1)
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
  'heat.tier1': 'Trained 0â€“1d',
  'heat.tier2': 'Recovering 2â€“3d',
  'heat.tier3': 'Ready 4â€“6d',
  'heat.tier4': 'Primed 7â€“13d',
  'heat.tier5': 'Rested 14+d / never',

  // Recovery detail badge
  'recovery.tier1': '\uD83D\uDD25 Trained (0-1d)',
  'recovery.tier2': '\uD83D\uDFE0 Recovering (2-3d)',
  'recovery.tier3': '\uD83D\uDFE1 Ready (4-6d)',
  'recovery.tier4': '\uD83D\uDFE2 Primed (7-13d)',
  'recovery.tier5': '\u26AA Rested (14+d)',

  // History / session
  'hist.noWorkouts':      'No workouts yet',
  'hist.emptyTitle':      'No workouts logged this session',

  // Onboarding
  'onb.back':              'Back',
  'onb.skip':              'Skip',
  'onb.next':              'Next â†’',
  'onb.step':              'STEP',
  'onb.of':                'OF',
  'onb.welcome.title':     'Welcome to FORGE',
  'onb.welcome.sub':       'Your gym. Your rules.',
  'onb.welcome.desc':      'Set up your profile in under a minute and get a personalised training experience.',
  'onb.welcome.cta':       'Get Started â†’',
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
  'onb.done.cta':          "Let's FORGE! ًں”¥",
  'onb.toast':             'Welcome to FORGE, {name}! ًں”¥',
  'onb.toast.athlete':     'athlete',

  // â”€â”€ APP TOUR â”€â”€
  'tour.back':       'Back',
  'tour.skip':       'Skip',
  'tour.next':       'Next â†’',
  'tour.cta':        "Let's FORGE! ًں”¥",
  'tour.more.title': 'App Tour',
  'tour.more.sub':   'Replay the feature walkthrough آ· 60 sec',
  'tour.s0.tag':     'FORGE GYM OS',
  'tour.s0.title':   'Your Gym OS is Live',
  'tour.s0.sub':     'A 60-second tour of everything FORGE can do for you.',
  'tour.s1.tag':     'STEP 1 آ· LOG',
  'tour.s1.title':   'Log Every Rep',
  'tour.s1.sub':     'Pick a muscle group, find your exercise, track your sets.',
  'tour.s1.f0':      '100+ exercises built-in',
  'tour.s1.f0s':     'Across 9 muscle groups with smart search',
  'tour.s1.f1':      'Sets آ· Reps آ· Weight آ· Notes',
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
  'tour.s3.sub':     'The floating âڈ± button sits bottom-right on every screen.',
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
  'tour.s5.f0':      'Rookie â†’ Veteran â†’ Legend',
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
  'tour.s6.f1':      'PPL, 5/3/1, 5أ—5 programs',
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
  'settings.rpeSub': 'Rate of Perceived Exertion (1â€“10)',
  'form.rpe':        'RPE',

  // B2: Swap
  'form.swap':       'â†” Swap',
  'swap.sub':        'Pick an alternative for the same muscle:',
  'swap.cancel':     'Cancel',

  // C2: Photos
  'photos.title':    'Progress Photos',
  'photos.add':      '+ ADD',
  'photos.empty':    'No photos yet. Add your first progress pic!',

  },

  ar: {
    // Header
    'app.title': 'ظپظˆط±ط¬',
    'app.subtitle': '// طھطھط¨ط¹ ط§ظ„طھظ…ط§ط±ظٹظ†',
    'header.edit': 'طھط¹ط¯ظٹظ„',
    'header.done': 'طھظ…',
    'header.editLayout': 'طھط¹ط¯ظٹظ„ ط§ظ„طھط®ط·ظٹط·',
    'header.editHint': 'â†‘â†“ ط¥ط¹ط§ط¯ط© طھط±طھظٹط¨ آ· ط¥ط®ظپط§ط،/ط¥ط¸ظ‡ط§ط±',

    // Mode toggle
    'mode.weighted': 'ط£ظˆط²ط§ظ†',
    'mode.bodyweight': 'ظˆط²ظ† ط§ظ„ط¬ط³ظ…',

    // Sections
    'section.steps': 'ط§ظ„ط®ط·ظˆط§طھ',
    'section.timer': 'ظ…ط¤ظ‚طھ ط§ظ„ط±ط§ط­ط©',
    'section.indicators': 'ط§ظ„ط¥ط­طµط§ط¦ظٹط§طھ',
    'section.mission': 'ظ…ظ‡ظ…ط© ط§ظ„ظٹظˆظ…',
    'section.templates': 'ط§ظ„ظ‚ظˆط§ظ„ط¨',
    'section.bodymap': 'ط®ط±ظٹط·ط© ط§ظ„ط¬ط³ظ…',
    'section.coach': 'ط§ظ„ظ…ط¯ط±ط¨ ط§ظ„ط°ظƒظٹ',

    // Steps panel
    'steps.title': 'ط®ط·ظˆط§طھ ط§ظ„ظٹظˆظ…',
    'steps.goal': 'ط§ظ„ظ‡ط¯ظپ',
    'steps.add': '+ ط¥ط¶ط§ظپط© ط®ط·ظˆط§طھ',
    'steps.addBtn': 'ط¥ط¶ط§ظپط©',
    'steps.streak': 'ط£ظٹط§ظ… ظ…طھطھط§ظ„ظٹط©',
    'steps.today': 'ط§ظ„ظٹظˆظ…',
    'steps.placeholder': 'ط£ط¯ط®ظ„ ط¹ط¯ط¯ ط§ظ„ط®ط·ظˆط§طھ...',

    // Timer
    'timer.title': 'ظ…ط¤ظ‚طھ ط§ظ„ط±ط§ط­ط©',
    'timer.start': 'â–¶ ط¨ط¯ط،',
    'timer.reset': 'â–  ط¥ط¹ط§ط¯ط©',
    'timer.go': 'ط§ظ†ط·ظ„ظ‚!',

    // Indicators
    'ind.volume': 'ط­ط¬ظ… طھظ…ط§ط±ظٹظ† ط§ظ„ظٹظˆظ…',
    'ind.streak': 'ط£ظٹط§ظ… ظ…طھطھط§ظ„ظٹط©',
    'ind.prs': 'ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط£ط±ظ‚ط§ظ… ط§ظ„ظ‚ظٹط§ط³ظٹط©',
    'ind.week': 'ظ‡ط°ط§ ط§ظ„ط£ط³ط¨ظˆط¹',
    'ind.allTime': 'ظƒظ„ ط§ظ„ظˆظ‚طھ',
    'ind.sessions': 'ط¬ظ„ط³ط§طھ',
    'ind.start': 'ط§ط¨ط¯ط£ ط§ظ„طھط³ط¬ظٹظ„',
    'ind.keepGoing': 'ط§ط³طھظ…ط±!',

    // Mission
    'mission.title': 'ظ…ظ‡ظ…ط© ط§ظ„ظٹظˆظ…',
    'mission.complete': 'ظ…ظƒطھظ…ظ„ط©',
    'mission.locked': 'ظ…ظ‚ظپظ„ط©',
    'mission.reward': 'ط§ظ„ظ…ظƒط§ظپط£ط©',

    // Workout form
    'form.muscle': 'ظ…ط¬ظ…ظˆط¹ط© ط§ظ„ط¹ط¶ظ„ط§طھ',
    'form.exercise': 'ط§ط³ظ… ط§ظ„طھظ…ط±ظٹظ†',
    'form.exercisePlaceholder': 'ظ…ط«ط§ظ„: ط¶ط؛ط· ط§ظ„طµط¯ط±طŒ ط§ظ„ظ‚ط±ظپطµط§ط،â€¦',
    'form.set': 'ظ…ط¬ظ…ظˆط¹ط©',
    'form.sets': 'ط§ظ„ظ…ط¬ظ…ظˆط¹ط§طھ',
    'form.weight': 'ط§ظ„ظˆط²ظ†',
    'form.reps': 'ط§ظ„طھظƒط±ط§ط±ط§طھ',
    'form.addSet': '+ ط¥ط¶ط§ظپط© ظ…ط¬ظ…ظˆط¹ط©',
    'form.save': 'طھط³ط¬ظٹظ„ ط§ظ„طھظ…ط±ظٹظ†',
    'form.lastHint': 'ط§ظ„ط¬ظ„ط³ط© ط§ظ„ط³ط§ط¨ظ‚ط©',
    'form.unit': 'ط§ظ„ظˆط­ط¯ط©',
    'form.notes': 'ظ…ظ„ط§ط­ط¸ط§طھ',
    'form.notesOptional': 'ظ…ظ„ط§ط­ط¸ط§طھ (ط§ط®طھظٹط§ط±ظٹ)',
    'form.notesPlaceholder': 'ظƒظٹظپ ط´ط¹ط±طھطں ط£ظٹ ط£ط±ظ‚ط§ظ… ظ‚ظٹط§ط³ظٹط©طں',
    'form.selectMuscle': 'ط§ط®طھط± ط§ظ„ط¹ط¶ظ„ط©',
    'form.selectExercise': 'ط§ط®طھط± ط§ظ„طھظ…ط±ظٹظ†',
    'form.quickSelect': 'ط§ط®طھظٹط§ط± ط³ط±ظٹط¹',
    'form.recent': 'ط§ظ„ط£ط®ظٹط±ط©',
    'form.targeting': 'ط§ط³طھظ‡ط¯ط§ظپ',

    // BW workout
    'bw.title': 'طھظ…ط±ظٹظ† ظˆط²ظ† ط§ظ„ط¬ط³ظ…',
    'bw.exercise': 'ط§ظ„طھظ…ط±ظٹظ†',
    'bw.effort': 'ط§ظ„ط¬ظ‡ط¯',
    'bw.reps': 'طھظƒط±ط§ط±ط§طھ',
    'bw.sets': 'ظ…ط¬ظ…ظˆط¹ط§طھ',
    'bw.save': 'ط­ظپط¸ ط§ظ„طھظ…ط±ظٹظ†',
    'bw.easy': 'ط³ظ‡ظ„',
    'bw.medium': 'ظ…طھظˆط³ط·',
    'bw.hard': 'طµط¹ط¨',
    'bw.max': 'ط£ظ‚طµظ‰',
    'bw.addSet': '+ ط¥ط¶ط§ظپط© ظ…ط¬ظ…ظˆط¹ط©',
    'bw.selectExercise': 'ط§ط®طھط± ط§ظ„طھظ…ط±ظٹظ†',

    // History
    'history.title': 'ط³ط¬ظ„ ط§ظ„طھظ…ط§ط±ظٹظ†',
    'history.filter.muscle': 'ظƒظ„ ط§ظ„ط¹ط¶ظ„ط§طھ',
    'history.filter.exercise': 'ط§ط¨ط­ط« ط¹ظ† طھظ…ط±ظٹظ†...',
    'history.filter.newest': 'ط§ظ„ط£ط­ط¯ط« ط£ظˆظ„ط§ظ‹',
    'history.filter.oldest': 'ط§ظ„ط£ظ‚ط¯ظ… ط£ظˆظ„ط§ظ‹',
    'history.filter.volume': 'ط§ظ„ط£ط¹ظ„ظ‰ ط­ط¬ظ…ط§ظ‹',
    'history.empty': 'ظ„ط§ طھظˆط¬ط¯ طھظ…ط§ط±ظٹظ† ط¨ط¹ط¯',
    'history.emptyHint': 'ط³ط¬ظ‘ظ„ ط¬ظ„ط³طھظƒ ط§ظ„ط£ظˆظ„ظ‰!',
    'history.set': 'ظ…ط¬ظ…ظˆط¹ط©',
    'history.sets': 'ظ…ط¬ظ…ظˆط¹ط§طھ',
    'history.reps': 'طھظƒط±ط§ط±',
    'history.vol': 'ط­ط¬ظ…',
    'history.pr': 'ط±ظ‚ظ… ظ‚ظٹط§ط³ظٹ',
    'history.sessions': 'ط¬ظ„ط³ط§طھ',
    'history.totalReps': 'ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„طھظƒط±ط§ط±ط§طھ',
    'history.bestSet': 'ط£ظپط¶ظ„ ظ…ط¬ظ…ظˆط¹ط©',
    'history.entries': 'ط¥ط¯ط®ط§ظ„',
    'history.gamify.currentStreak': 'ط§ظ„طھطھط§ظ„ظٹ ط§ظ„ط­ط§ظ„ظٹ',
    'history.gamify.days': 'ظٹظˆظ…',
    'history.gamify.best': 'ط§ظ„ط£ظپط¶ظ„',
    'history.gamify.prHits': 'ط¥ظ†ط¬ط§ط²ط§طھ PR',
    'history.gamify.records': 'ط¥ظ†ط¬ط§ط²',
    'history.gamify.visibleSessions': 'ظ…ظ† ظƒظ„ ط§ظ„ط¬ظ„ط³ط§طھ ط§ظ„ظ…ط¹ط±ظˆط¶ط©',
    'history.gamify.level': 'ظ…ط³طھظˆظ‰ ط§ظ„ط³ط¬ظ„',
    'history.gamify.volumeBank': 'ظ…ط®ط²ظˆظ† ط§ظ„ط­ط¬ظ…',
    'history.gamify.activeDays': 'ط£ظٹط§ظ… ظ†ط´ط·ط©',

    // PRs
    'prs.title': 'ط§ظ„ط£ط±ظ‚ط§ظ… ط§ظ„ظ‚ظٹط§ط³ظٹط©',
    'prs.weighted': 'ط£ط±ظ‚ط§ظ… ط§ظ„ط£ظˆط²ط§ظ†',
    'prs.bodyweight': 'ط£ط±ظ‚ط§ظ… ظˆط²ظ† ط§ظ„ط¬ط³ظ…',
    'prs.empty': 'ظ„ط§ طھظˆط¬ط¯ ط£ط±ظ‚ط§ظ… ظ‚ظٹط§ط³ظٹط© ط¨ط¹ط¯',
    'prs.emptyHint': 'ط§ط¨ط¯ط£ ط§ظ„طھط³ط¬ظٹظ„ ظ„طھط³ط¬ظٹظ„ ط§ظ„ط£ط±ظ‚ط§ظ…!',
    'prs.best': 'ط§ظ„ط£ظپط¶ظ„',
    'prs.reps': 'طھظƒط±ط§ط±',

    // Dashboard
    'dash.title': 'ط§ظ„ط¥ط­طµط§ط¦ظٹط§طھ',
    'dash.volume': 'طھظˆط²ظٹط¹ ط§ظ„ط­ط¬ظ…',
    'dash.frequency': 'ط§ظ„طھظƒط±ط§ط±',
    'dash.water': 'ظ…طھطھط¨ط¹ ط§ظ„ظ…ط§ط،',
    'dash.body': 'طھظƒظˆظٹظ† ط§ظ„ط¬ط³ظ…',
    'dash.today': 'ط§ظ„ظٹظˆظ…',
    'dash.week': 'ظ‡ط°ط§ ط§ظ„ط£ط³ط¨ظˆط¹',
    'dash.month': 'ظ‡ط°ط§ ط§ظ„ط´ظ‡ط±',
    'dash.addWater': '+ ظƒظˆط¨',
    'dash.waterGoal': 'ط§ظ„ظ‡ط¯ظپ ط§ظ„ظٹظˆظ…ظٹ',
    'dash.glasses': 'ط£ظƒظˆط§ط¨',

    // More view
    'more.profile': 'ط§ظ„ظ…ظ„ظپ ط§ظ„ط´ط®طµظٹ',
    'more.settings': 'ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ',
    'more.templates': 'ظ‚ظˆط§ظ„ط¨ظٹ',
    'more.data': 'ط§ظ„ط¨ظٹط§ظ†ط§طھ ظˆط§ظ„طھطµط¯ظٹط±',
    'more.install': 'ط§ظ„طھط«ط¨ظٹطھ ط¹ظ„ظ‰ ط§ظ„ظ‡ط§طھظپ',
    'more.bwHistory': 'ط³ط¬ظ„ ظˆط²ظ† ط§ظ„ط¬ط³ظ…',
    'more.bodyComp': 'طھظƒظˆظٹظ† ط§ظ„ط¬ط³ظ…',
    'more.guide': 'ط¯ظ„ظٹظ„ ط§ظ„ظ…ط³طھط®ط¯ظ…',

    // Guide
    'guide.title': 'ط¯ظ„ظٹظ„ ط§ظ„ظ…ط³طھط®ط¯ظ…',
    'guide.badge': 'ط´ط§ظ…ظ„',
    'guide.tab.start': 'ط§ظ„ط¨ط¯ط§ظٹط©',
    'guide.tab.log': 'ط§ظ„طھط³ط¬ظٹظ„',
    'guide.tab.score': 'ط§ظ„طھظ‚ظٹظٹظ…',
    'guide.tab.features': 'ط§ظ„ظ…ظ…ظٹط²ط§طھ',

    // Profile
    'profile.level': 'ط§ظ„ظ…ط³طھظˆظ‰',
    'profile.xp': 'ظ†ظ‚ط§ط· ط§ظ„ط®ط¨ط±ط©',
    'profile.workouts': 'ط§ظ„طھظ…ط§ط±ظٹظ†',
    'profile.streak': 'ط§ظ„طھطھط§ظ„ظٹ',
    'profile.prs': 'ط§ظ„ط£ط±ظ‚ط§ظ… ط§ظ„ظ‚ظٹط§ط³ظٹط©',
    'profile.editName': 'طھط¹ط¯ظٹظ„ ط§ظ„ط§ط³ظ…',

    // Settings
    'settings.title': 'ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ',
    'settings.unit': 'ظˆط­ط¯ط© ط§ظ„ظˆط²ظ†',
    'settings.sound': 'طµظˆطھ ظ…ط¤ظ‚طھ ط§ظ„ط±ط§ط­ط©',
    'settings.soundHint': 'ط§ظ‡طھط²ط§ط² ظˆطµظˆطھ طھظ†ط¨ظٹظ‡ ط¹ظ†ط¯ ط§ظ†طھظ‡ط§ط، ط§ظ„ط±ط§ط­ط©',
    'settings.hint': 'ط¹ط±ط¶ طھظ„ظ…ظٹط­ ط§ظ„ط¬ظ„ط³ط© ط§ظ„ط³ط§ط¨ظ‚ط©',
    'settings.hintHint': 'ظٹط¹ط±ط¶ ط§ظ„ظ…ط¬ظ…ظˆط¹ط§طھ ط§ظ„ط³ط§ط¨ظ‚ط© ط¹ظ†ط¯ ط§ظ„طھط³ط¬ظٹظ„',
    'settings.language': 'ط§ظ„ظ„ط؛ط©',
    'settings.theme': 'ط§ظ„ظ…ط¸ظ‡ط±',

    // Data
    'data.export': 'طھطµط¯ظٹط± ط§ظ„طھظ…ط§ط±ظٹظ† (CSV)',
    'data.backup': 'ظ†ط³ط® ط§ط­طھظٹط§ط·ظٹ ظ„ظ„ط¨ظٹط§ظ†ط§طھ (JSON)',
    'data.restore': 'ط§ط³طھط¹ط§ط¯ط© ظ…ظ† ط§ظ„ظ†ط³ط®ط© ط§ظ„ط§ط­طھظٹط§ط·ظٹط©',
    'data.clear': 'ظ…ط³ط­ ط¬ظ…ظٹط¹ ط§ظ„ط¨ظٹط§ظ†ط§طھ',

    // Install
    'install.android': 'ط£ظ†ط¯ط±ظˆظٹط¯ (Chrome)',
    'install.androidText': 'ط§ط¶ط؛ط· ط§ظ„ظ‚ط§ط¦ظ…ط© â†گ "ط¥ط¶ط§ظپط© ط¥ظ„ظ‰ ط§ظ„ط´ط§ط´ط© ط§ظ„ط±ط¦ظٹط³ظٹط©" â†گ طھط«ط¨ظٹطھ.',
    'install.ios': 'ط¢ظٹظپظˆظ† (Safari)',
    'install.iosText': 'ط§ط¶ط؛ط· ظ…ط´ط§ط±ظƒط© â†گ "ط¥ط¶ط§ظپط© ط¥ظ„ظ‰ ط§ظ„ط´ط§ط´ط© ط§ظ„ط±ط¦ظٹط³ظٹط©" â†گ ط¥ط¶ط§ظپط©.',
    'install.apk': 'ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ APK',
    'install.apkText': 'ط§ط³طھط¶ظپ ط§ظ„طھط·ط¨ظٹظ‚ ط¹ظ„ظ‰ GitHub Pages ط«ظ… ط§ط³طھط®ط¯ظ… pwabuilder.com ظ„ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ APK.',

    // Body map
    'bodymap.title': 'ط®ط±ظٹط·ط© ط§ظ„ط¬ط³ظ…',
    'bodymap.front': 'ط£ظ…ط§ظ…ظٹ',
    'bodymap.back': 'ط®ظ„ظپظٹ',
    'bodymap.tap': 'ط§ط¶ط؛ط· ط¹ظ„ظ‰ ط¹ط¶ظ„ط© ظ„ظ„طھط³ط¬ظٹظ„',
    'bodymap.selected': 'ط§ظ„ظ…ط®طھط§ط±',
    'bodymap.train': 'طھط¯ط±ظٹط¨ ظ‡ط°ظ‡ ط§ظ„ط¹ط¶ظ„ط©',
    'bodymap.muscleGroup': 'ظ…ط¬ظ…ظˆط¹ط© ط§ظ„ط¹ط¶ظ„ط§طھ',
    'bodymap.tapBody': 'ط§ط¶ط؛ط· ط§ظ„ط¬ط³ظ…',

    // Muscle overlay
    'overlay.history': 'ط§ظ„ط³ط¬ظ„',
    'overlay.tips': 'ظ†طµط§ط¦ط­',
    'overlay.exercises': 'ط§ظ„طھظ…ط§ط±ظٹظ†',
    'overlay.sessions': 'ط¬ظ„ط³ط§طھ ظ…ط³ط¬ظ„ط©',
    'overlay.totalVol': 'ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط­ط¬ظ…',
    'overlay.bestPR': 'ط£ظپط¶ظ„ ط±ظ‚ظ…',
    'overlay.lastTrained': 'ط¢ط®ط± طھط¯ط±ظٹط¨',
    'overlay.noWorkouts': 'ظ„ط§ طھظˆط¬ط¯ طھظ…ط§ط±ظٹظ† ط¨ط¹ط¯',

    // Coach tabs & status
    'coach.tab.insights':  'ط§ظ„طھط­ظ„ظٹظ„ط§طھ',
    'coach.tab.plan':      'ط§ظ„ط®ط·ط© ط§ظ„ط£ط³ط¨ظˆط¹ظٹط©',
    'coach.tab.nutrition': 'ط§ظ„طھط؛ط°ظٹط©',
    'coach.tab.prs':       'ط§ظ„ط£ط±ظ‚ط§ظ… ط§ظ„ظ‚ظٹط§ط³ظٹط©',
    'coach.status.init':   'ط¬ط§ط±ظچ طھط­ظ„ظٹظ„ طھط¯ط±ظٹط¨ظƒâ€¦',

    // Smart Tips
    'section.tips': 'ظ†طµط§ط¦ط­ ط°ظƒظٹط©',
    'section.tipsbadge': 'طھظ„ظ…ظٹط­ط§طھ',
    'tip.overload.title': 'ط§ظ„طھط­ظ…ظٹظ„ ط§ظ„طھط¯ط±ظٹط¬ظٹ',
    'tip.overload.text': 'ط§ط³طھظ‡ط¯ظپ ط¥ط¶ط§ظپط© 2.5â€“5 ظƒط؛ ظƒظ„ ط£ط³ط¨ظˆط¹ظٹظ†. ط§ظ„ظ…ظƒط§ط³ط¨ ط§ظ„طµط؛ظٹط±ط© طھطھط±ط§ظƒظ… ظ„ظ†طھط§ط¦ط¬ ط¶ط®ظ…ط©.',
    'tip.timer.title': 'ط§ط³طھط®ط¯ظ… ظ…ط¤ظ‚طھ ط§ظ„ط±ط§ط­ط©',
    'tip.timer.text': 'ظپطھط±ط§طھ ط±ط§ط­ط© ظ…ظ†طھط¸ظ…ط© (60â€“120 ط«ط§ظ†ظٹط©) طھط¤ط¯ظٹ ط¥ظ„ظ‰ ط£ط¯ط§ط، ظ‚ظˆط© ط£ظپط¶ظ„ ط¹ط¨ط± ط§ظ„ظ…ط¬ظ…ظˆط¹ط§طھ.',

    // Dashboard stats bar
    'dash.statVol': 'ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط­ط¬ظ…',
    'dash.statSessions': 'ط§ظ„ط¬ظ„ط³ط§طھ',
    'dash.statSets': 'ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط¬ظ…ظˆط¹ط§طھ',
    'dash.statPR': 'ط£ظپط¶ظ„ ط±ظ‚ظ… ظ‚ظٹط§ط³ظٹ',
    'dash.allTime': 'ظƒظ„ ط§ظ„ظˆظ‚طھ',
    // Dashboard section headers
    'dash.wgtSection': 'ط±ظپط¹ ط§ظ„ط£ط«ظ‚ط§ظ„',
    'dash.bwSection': 'طھظ…ط§ط±ظٹظ† ط§ظ„ط¬ط³ظ…',
    // BW stat cards
    'dash.bwSessions': 'ط¬ظ„ط³ط§طھ ط§ظ„ط¬ط³ظ…',
    'dash.bwSets': 'ظ…ط¬ظ…ظˆط¹ط§طھ ط§ظ„ط¬ط³ظ…',
    'dash.bwTopEx': 'ط£ظپط¶ظ„ طھظ…ط±ظٹظ†',
    'dash.bwStreak': 'ط§ظ„طھط³ظ„ط³ظ„',
    // Stats panel titles & badges
    'dash.muscleBalance': 'ظ†ظ‚ط§ط· طھظˆط§ط²ظ† ط§ظ„ط¹ط¶ظ„ط§طھ',
    'dash.bodyComp': 'طھظƒظˆظٹظ† ط§ظ„ط¬ط³ظ…',
    'dash.log': 'ط³ط¬ظ‘ظ„',
    'dash.trainingVolume': 'ط­ط¬ظ… ط§ظ„طھط¯ط±ظٹط¨',
    'dash.weekly': 'ط£ط³ط¨ظˆط¹ظٹ',
    'dash.weightProgress': 'طھظ‚ط¯ظ… ط§ظ„ظˆط²ظ†',
    'dash.exercise': 'طھظ…ط±ظٹظ†',
    'dash.selectExercise': 'â€” ط§ط®طھط± ط§ظ„طھظ…ط±ظٹظ† â€”',
    'dash.volByMuscle': 'ط§ظ„ط­ط¬ظ… ط­ط³ط¨ ط§ظ„ط¹ط¶ظ„ط©',
    'dash.muscleFreq': 'طھظƒط±ط§ط± ط§ظ„ط¹ط¶ظ„ط§طھ',
    'dash.sessions': 'ط§ظ„ط¬ظ„ط³ط§طھ',
    // History view
    'hist.title': 'ط³ط¬ظ„ ط§ظ„طھظ…ط§ط±ظٹظ†',
    'hist.sub': 'ط¬ظ…ظٹط¹ ط§ظ„ط¬ظ„ط³ط§طھ ظˆط§ظ„ط£ط±ظ‚ط§ظ… ط§ظ„ظ‚ظٹط§ط³ظٹط©',
    'hist.prs': 'ط§ظ„ط£ط±ظ‚ط§ظ… ط§ظ„ظ‚ظٹط§ط³ظٹط©',
    'hist.filter': 'طھطµظپظٹط© ظˆط¨ط­ط«',
    'hist.filterMuscle': 'ط§ظ„ط¹ط¶ظ„ط©',
    'hist.filterEx': 'ط§ظ„طھظ…ط±ظٹظ†',
    'hist.filterSort': 'طھط±طھظٹط¨',
    'hist.log': 'ط³ط¬ظ„ ط§ظ„طھظ…ط§ط±ظٹظ†',
    // More/Settings view
    'more.title': 'ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ظˆط§ظ„ط£ط¯ظˆط§طھ',
    'more.sub': 'ط§ظ„ظ…ظ„ظپ ط§ظ„ط´ط®طµظٹ ظˆط§ظ„ط³ظ…ط§طھ ظˆط§ظ„ط¨ظٹط§ظ†ط§طھ',
    'more.profile': 'ظ…ظ„ظپظٹ ط§ظ„ط´ط®طµظٹ',
    'more.templates': 'ط§ظ„ظ‚ظˆط§ظ„ط¨',
    'more.bodyComp': 'طھظƒظˆظٹظ† ط§ظ„ط¬ط³ظ…',
    'more.settings': 'ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ',
    'more.data': 'ط§ظ„ط¨ظٹط§ظ†ط§طھ ظˆط§ظ„طھطµط¯ظٹط±',
    // Settings toggles
    'settings.lightMode': 'ط§ظ„ظˆط¶ط¹ ط§ظ„ظ†ظ‡ط§ط±ظٹ',
    'settings.lightModeSub': 'ط§ظ„طھط¨ط¯ظٹظ„ ط¥ظ„ظ‰ ط³ظ…ط© SOLAR ط§ظ„ط¯ط§ظپط¦ط©',
    'settings.unit': 'ظˆط­ط¯ط© ط§ظ„ظˆط²ظ† ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©',
    'settings.unitSub': 'ط³طھظƒظˆظ† ظ‡ط°ظ‡ ط§ظ„ظˆط­ط¯ط© ط§ظپطھط±ط§ط¶ظٹط© ظ„ظ„ظ…ط¬ظ…ظˆط¹ط§طھ',
    'settings.sound': 'طµظˆطھ ظ…ط¤ظ‚طھ ط§ظ„ط±ط§ط­ط©',
    'settings.soundSub': 'ط§ظ‡طھط²ط§ط² ظˆطµظˆطھ طھظ†ط¨ظٹظ‡ ط¹ظ†ط¯ ط§ظ†طھظ‡ط§ط، ط§ظ„ط±ط§ط­ط©',
    'settings.hint': 'ط¥ط¸ظ‡ط§ط± طھظ„ظ…ظٹط­ ط§ظ„ط¬ظ„ط³ط© ط§ظ„ط£ط®ظٹط±ط©',
    'settings.hintSub': 'ظٹط¹ط±ط¶ ط§ظ„ظ…ط¬ظ…ظˆط¹ط§طھ ط§ظ„ط³ط§ط¨ظ‚ط© ط¹ظ†ط¯ ط§ظ„طھط³ط¬ظٹظ„',

    // Toasts
    'toast.saved': 'طھظ… ط­ظپط¸ ط§ظ„طھظ…ط±ظٹظ†!',
    'toast.deleted': 'طھظ… ط§ظ„ط­ط°ظپ',
    'toast.pr': 'ط±ظ‚ظ… ظ‚ظٹط§ط³ظٹ ط¬ط¯ظٹط¯!',
    'toast.cleared': 'طھظ… ظ…ط³ط­ ط¬ظ…ظٹط¹ ط§ظ„ط¨ظٹط§ظ†ط§طھ',
    'toast.imported': 'طھظ… ط§ط³طھظٹط±ط§ط¯ ط§ظ„ط¨ظٹط§ظ†ط§طھ!',
    'toast.exported': 'طھظ… ط§ظ„طھطµط¯ظٹط±!',
    'toast.stepsSaved': 'طھظ… ط­ظپط¸ ط§ظ„ط®ط·ظˆط§طھ!',
    'toast.noSteps': 'ط£ط¯ط®ظ„ ط¹ط¯ط¯ ط§ظ„ط®ط·ظˆط§طھ ط£ظˆظ„ط§ظ‹',

    // Achievements
    'ach.title': 'ط¥ظ†ط¬ط§ط² ط¬ط¯ظٹط¯!',

    // Templates
    'tmpl.name': 'ط§ط³ظ… ط§ظ„ظ‚ط§ظ„ط¨',
    'tmpl.muscle': 'ظ…ط¬ظ…ظˆط¹ط© ط§ظ„ط¹ط¶ظ„ط§طھ',
    'tmpl.exercises': 'ط§ظ„طھظ…ط§ط±ظٹظ† (ظ…ظپطµظˆظ„ط© ط¨ظپط§طµظ„ط©)',
    'tmpl.icon': 'ط£ظٹظ‚ظˆظ†ط©',
    'tmpl.save': 'ط­ظپط¸ ط§ظ„ظ‚ط§ظ„ط¨',
    'tmpl.new': 'ظ‚ط§ظ„ط¨ ط¬ط¯ظٹط¯',
    'tmpl.load': 'طھط­ظ…ظٹظ„',
    'tmpl.delete': 'ط­ط°ظپ',
    'tmpl.placeholder': 'ظ…ط«ط§ظ„: ظٹظˆظ… ط§ظ„ط¯ظپط¹ A',
    'tmpl.exPlaceholder': 'ط¶ط؛ط· طµط¯ط±طŒ ط¯ظ…ط¨ظ„ ظ…ط§ط¦ظ„طŒ ظƒظٹط¨ظ„',

    // Nav
    'nav.log': 'طھط³ط¬ظٹظ„',
    'nav.stats': 'ط¥ط­طµط§ط،',
    'nav.history': 'ط§ظ„ط³ط¬ظ„',
    'nav.nutrition': 'ط§ظ„طھط؛ط°ظٹط©',
    'nav.more': 'ط§ظ„ظ…ط²ظٹط¯',

    // General
    'btn.save': 'ط­ظپط¸',
    'btn.cancel': 'ط¥ظ„ط؛ط§ط،',
    'btn.confirm': 'طھط£ظƒظٹط¯',
    'btn.delete': 'ط­ط°ظپ',
    'btn.edit': 'طھط¹ط¯ظٹظ„',
    'btn.close': 'âœ•',
    'lbl.kg': 'ظƒط؛',
    'lbl.lbs': 'ط±ط·ظ„',
    'lbl.days': 'ظٹ',

    // Header bio cards
    'hdr.weight': 'ط§ظ„ظˆط²ظ†',
    'hdr.bodyfat': 'ط¯ظ‡ظˆظ† ط§ظ„ط¬ط³ظ…',
    'hdr.muscle': 'ظƒطھظ„ط© ط¹ط¶ظ„ظٹط©',
    'hdr.tapToLog': 'ط§ط¶ط؛ط· ظ„ظ„طھط³ط¬ظٹظ„',

    // Bio log modal
    'bio.logWeight': 'طھط³ط¬ظٹظ„ ط§ظ„ظˆط²ظ†',
    'bio.logBodyFat': 'طھط³ط¬ظٹظ„ ط¯ظ‡ظˆظ† ط§ظ„ط¬ط³ظ…',
    'bio.logMuscle': 'طھط³ط¬ظٹظ„ ط§ظ„ظƒطھظ„ط© ط§ظ„ط¹ط¶ظ„ظٹط©',
    'bio.last': 'ط¢ط®ط±',
    'bio.save': 'ط­ظپط¸',

    // Header status bar pills
    'hdr.streak': 'ط§ظ„طھط³ظ„ط³ظ„',
    'hdr.water': 'ظ…ط§ط،',
    'hdr.rest': 'ط±ط§ط­ط©',

    // Header coach ticker
    'hdr.coach': 'ط§ظ„ظ…ط¯ط±ط¨',
    'hdr.score': 'ط§ظ„ظ†ظ‚ط§ط·',

    // Mission banner
    'mission.banner.title': 'ظ…ظ‡ظ…ط© ط§ظ„ظٹظˆظ…',
    'mission.banner.done': 'طھظ…',
    'mission.banner.allDone': 'ط£ط­ط³ظ†طھ! ًںژ‰',

    // Muscle balance
    'balance.score': 'ظ†ظ‚ط§ط· ط§ظ„طھظˆط§ط²ظ†',
    'balance.center': 'طھظˆط§ط²ظ†',
    'balance.frequency': 'ط§ظ„طھظƒط±ط§ط±',
    'balance.strength': 'ط£ظ‚طµظ‰ ظ‚ظˆط©',
    'balance.trained': 'ظ…ط¬ظ…ظˆط¹ط§طھ ط¹ط¶ظ„ظٹط© ظ…ط¯ط±ط¨ط©',
    'balance.notTrained': 'ظ„ظ… ظٹظڈط¯ط±ظژظ‘ط¨',
    'balance.msg.excellent': 'طھظˆط§ط²ظ† ظ…ظ…طھط§ط²! ط¬ظ…ظٹط¹ ط§ظ„ط¹ط¶ظ„ط§طھ ظ…ط¯ط±ط¨ط© ط¬ظٹط¯ط§ظ‹.',
    'balance.msg.good': 'طھظˆط§ط²ظ† ط¬ظٹط¯. ط§ط¶ط؛ط· ط¹ظ„ظ‰ ط§ظ„ط¹ط¶ظ„ط§طھ ط§ظ„ط£ط¶ط¹ظپ.',
    'balance.msg.some': 'ط¨ط¹ط¶ ط§ظ„ط¹ط¶ظ„ط§طھ ظ…ظ‡ظ…ظ„ط©. ظ†ظˆظ‘ط¹ طھظ…ط§ط±ظٹظ†ظƒ!',
    'balance.msg.focus': 'طھط­طھط§ط¬ طھط±ظƒظٹط²ط§ظ‹ â€” طھط¯ط±ط¨ ط¹ظ„ظ‰ ط¹ط¶ظ„ط§طھ ط£ط®ط±ظ‰.',
    'balance.empty': 'ط³ط¬ظ‘ظ„ طھظ…ط§ط±ظٹظ† ظ„ط±ط¤ظٹط© ط§ظ„طھظˆط§ط²ظ† ط§ظ„ط¹ط¶ظ„ظٹ',

    // Muscle names
    'muscle.Chest': 'ط§ظ„طµط¯ط±',
    'muscle.Back': 'ط§ظ„ط¸ظ‡ط±',
    'muscle.Shoulders': 'ط§ظ„ط£ظƒطھط§ظپ',
    'muscle.Legs': 'ط§ظ„ط£ط±ط¬ظ„',
    'muscle.Core': 'ط§ظ„ط¬ط°ط¹',
    'muscle.Biceps': 'ط§ظ„ط¹ط¶ظ„ط© ط°ط§طھ ط§ظ„ط±ط£ط³ظٹظ†',
    'muscle.Triceps': 'ط®ظ„ظپظٹط© ط§ظ„ط°ط±ط§ط¹',
    'muscle.Forearms': 'ط¹ط¶ظ„ط© ط§ظ„ط³ط§ط¹ط¯',
    'muscle.Glutes': 'ط§ظ„ط£ط±ط¯ط§ظپ',
    'muscle.Calves': 'ط§ظ„ط³ط§ظ‚',

    // Body comp panel
    'bcomp.logToggle': '+ طھط³ط¬ظٹظ„ ط¥ط¯ط®ط§ظ„ ط¬ط¯ظٹط¯',
    'bcomp.recentEntries': 'ط§ظ„ط¥ط¯ط®ط§ظ„ط§طھ ط§ظ„ط£ط®ظٹط±ط©',
    'bcomp.bodyWeight': 'ظˆط²ظ† ط§ظ„ط¬ط³ظ…',
    'bcomp.bodyFat': 'ظ†ط³ط¨ط© ط§ظ„ط¯ظ‡ظˆظ† %',
    'bcomp.muscleMass': 'ط§ظ„ظƒطھظ„ط© ط§ظ„ط¹ط¶ظ„ظٹط©',
    'bcomp.logEntry': 'طھط³ط¬ظٹظ„',
    'bcomp.noEntries': 'ظ„ط§ طھظˆط¬ط¯ ط¥ط¯ط®ط§ظ„ط§طھ ط¨ط¹ط¯',
    'bcomp.tab.weight': 'ط§ظ„ظˆط²ظ†',
    'bcomp.tab.bodyfat': 'ط§ظ„ط¯ظ‡ظˆظ†',
    'bcomp.tab.muscle': 'ط§ظ„ط¹ط¶ظ„ط§طھ',

    // Mascot buddy suffix
    'mascot.buddy': 'طµط¯ظٹظ‚ظٹ',

    // Last-hit relative times
    'time.today': 'ط§ظ„ظٹظˆظ…',
    'time.yesterday': 'ط£ظ…ط³',
    'time.dAgo': 'ظٹ ظ…ط¶طھ',
    'time.wAgo': 'ط£ط³ط§ط¨ظٹط¹',

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
    'form.endSession':    'âڑ، ط¥ظ†ظ‡ط§ط، ط§ظ„ط¬ظ„ط³ط©',
    'form.endSessionHint': 'ط§ظ†ظ‚ط± ظ…ط±طھظٹظ† ظ„ط¥ظ†ظ‡ط§ط، ط¬ظ„ط³ط© ط§ظ„طھظ…ط±ظٹظ†',
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
    'dash.recoveryStatus':  'ط­ط§ظ„ط© ط§ظ„طھط¹ط§ظپظٹ',

    // Session hero + repeat button
    'sh.brand':   'ط¬ظ„ط³ط© ظپظˆط±ط¬',
    'sh.start':   'ط§ط¨ط¯ط£ ط§ظ„ط¬ظ„ط³ط©',
    'sh.repeat':  'ظƒط±ظ‘ط± ط¢ط®ط± طھظ…ط±ظٹظ†',

    // Chip recovery legend
    'chip.sore':       'ظ…ط¤ظ„ظ…',
    'chip.recovering': 'ظٹطھط¹ط§ظپظ‰',
    'chip.ready':      'ط¬ط§ظ‡ط²',
    'chip.fresh':      'ظ†ط´ظٹط·',

    // Heatmap legend tiers
    'heat.tier1': 'ظ…ظڈط¯ط±ظژظ‘ط¨ 0â€“1 ظٹظˆظ…',
    'heat.tier2': 'ظٹطھط¹ط§ظپظ‰ 2â€“3 ط£ظٹط§ظ…',
    'heat.tier3': 'ط¬ط§ظ‡ط² 4â€“6 ط£ظٹط§ظ…',
    'heat.tier4': 'ظ…ط³طھط¹ط¯ 7â€“13 ظٹظˆظ…',
    'heat.tier5': 'ط±ط§ط­ط© 14+ ظٹظˆظ… / ط؛ظٹط± ظ…ظڈط¯ط±ظژظ‘ط¨',

    // Recovery detail badge
    'recovery.tier1': '\uD83D\uDD25 \u0645\u062A\u0645\u0631\u0651\u0646 (0-1 \u064A\u0648\u0645)',
    'recovery.tier2': '\uD83D\uDFE0 \u064A\u062A\u0639\u0627\u0641\u0649 (2-3 \u0623\u064A\u0627\u0645)',
    'recovery.tier3': '\uD83D\uDFE1 \u062C\u0627\u0647\u0632 (4-6 \u0623\u064A\u0627\u0645)',
    'recovery.tier4': '\uD83D\uDFE2 \u0645\u0633\u062A\u0639\u062F (7-13 \u064A\u0648\u0645)',
    'recovery.tier5': '\u26AA \u0645\u0631\u062A\u0627\u062D (14+ \u064A\u0648\u0645)',

    // History / session
    'hist.noWorkouts':      'ظ„ط§ طھظ…ط§ط±ظٹظ† ط¨ط¹ط¯',
    'hist.emptyTitle':      'ظ„ظ… طھظڈط³ط¬ظژظ‘ظ„ ط£ظٹ طھظ…ط§ط±ظٹظ† ظپظٹ ظ‡ط°ظ‡ ط§ظ„ط¬ظ„ط³ط©',

    // Onboarding
    'onb.back':              'ط±ط¬ظˆط¹',
    'onb.skip':              'طھط®ط·ظ‘ظٹ',
    'onb.next':              'ط§ظ„طھط§ظ„ظٹ â†گ',
    'onb.step':              'ط®ط·ظˆط©',
    'onb.of':                'ظ…ظ†',
    'onb.welcome.title':     'ظ…ط±ط­ط¨ط§ظ‹ ط¨ظƒ ظپظٹ ظپظˆط±ط¬',
    'onb.welcome.sub':       'طµط§ظ„طھظƒ. ظ‚ظˆط§ط¹ط¯ظƒ.',
    'onb.welcome.desc':      'ط£ط¹ط¯ظ‘ ظ…ظ„ظپظƒ ط§ظ„ط´ط®طµظٹ ظپظٹ ط£ظ‚ظ„ ظ…ظ† ط¯ظ‚ظٹظ‚ط© ظˆط§ط­طµظ„ ط¹ظ„ظ‰ طھط¬ط±ط¨ط© طھط¯ط±ظٹط¨ ظ…ط®طµطµط©.',
    'onb.welcome.cta':       'ط§ط¨ط¯ط£ ط§ظ„ط¢ظ† â†گ',
    'onb.name.title':        'ظ…ط§ ط§ط³ظ…ظƒطں',
    'onb.name.sub':          'ط³ظ†ط³طھط®ط¯ظ…ظ‡ ظ„طھط®طµظٹطµ طھط¬ط±ط¨طھظƒ.',
    'onb.name.placeholder':  'ظ…ط«ط§ظ„: ط£ط­ظ…ط¯',
    'onb.lbl.name':          'ط§ظ„ط§ط³ظ…',
    'onb.about.title':       'ط¹ظ†ظƒ',
    'onb.about.sub':         'ظٹط³ط§ط¹ط¯ظ†ط§ ظپظٹ ط­ط³ط§ط¨ ط¥ط­طµط§ط¦ظٹط§طھظƒ ط¨ط¯ظ‚ط©.',
    'onb.about.gender':      'ط£ظ†ط§',
    'onb.about.male':        'ط°ظƒط±',
    'onb.about.female':      'ط£ظ†ط«ظ‰',
    'onb.about.other':       'ط£ظپط¶ظ‘ظ„ ط¹ط¯ظ… ط§ظ„ط¥ظپطµط§ط­',
    'onb.about.dob':         'طھط§ط±ظٹط® ط§ظ„ظ…ظٹظ„ط§ط¯',
    'onb.measure.title':     'ظ…ظ‚ط§ط³ط§طھظƒ',
    'onb.measure.sub':       'طھظڈط³طھط®ط¯ظ… ظ„ط­ط³ط§ط¨ ظ…ط¤ط´ط± ظƒطھظ„ط© ط§ظ„ط¬ط³ظ… ظˆط§ط³طھظ‡ظ„ط§ظƒ ط§ظ„ط·ط§ظ‚ط©.',
    'onb.measure.weight':    'ط§ظ„ظˆط²ظ† ط§ظ„ط­ط§ظ„ظٹ',
    'onb.measure.height':    'ط§ظ„ط·ظˆظ„',
    'onb.goal.title':        'ظ‡ط¯ظپظƒ ط§ظ„ط±ط¦ظٹط³ظٹ',
    'onb.goal.title2':       'ط§ظ„ظ‡ط¯ظپ',
    'onb.goal.sub':          'ط³ظ†ط¶ط¨ط· ط§ظ„طھط¯ط±ظٹط¨ ظˆط§ظ„ظ…ظ‡ط§ظ… ط­ظˆظ„ ظ‡ط°ط§ ط§ظ„ظ‡ط¯ظپ.',
    'onb.goal.muscle':       'ط¨ظ†ط§ط، ط§ظ„ط¹ط¶ظ„ط§طھ',
    'onb.goal.muscle.sub':   'ط¶ط®ط§ظ…ط© ظˆط­ط¬ظ…',
    'onb.goal.fat':          'ط­ط±ظ‚ ط§ظ„ط¯ظ‡ظˆظ†',
    'onb.goal.fat.sub':      'طھظ†ط´ظٹظپ ظˆظƒط§ط±ط¯ظٹظˆ',
    'onb.goal.strength':     'ط¨ظ†ط§ط، ط§ظ„ظ‚ظˆط©',
    'onb.goal.strength.sub': 'ظ‚ظˆط© ط£ظ‚طµظ‰ ظˆط£ظˆط²ط§ظ†',
    'onb.goal.active':       'ط§ظ„ط¨ظ‚ط§ط، ظ†ط´ظٹط·ط§ظ‹',
    'onb.goal.active.sub':   'طµط­ط© ظˆط¹ط§ظپظٹط©',
    'onb.done.title':        'ط£ظ†طھ ط¬ط§ظ‡ط²!',
    'onb.done.sub':          'ظپظˆط±ط¬ ظ…ط®طµطµ ظ„ظƒ. ظ„ظ†ط¨ظ†ظگ ط´ظٹط¦ط§ظ‹ ظ…ط¹ط§ظ‹.',
    'onb.done.cta':          'ظ‡ظٹط§ ظ†ط¨ط¯ط£! ًں”¥',
    'onb.toast':             'ظ…ط±ط­ط¨ط§ظ‹ ط¨ظƒ ظپظٹ ظپظˆط±ط¬طŒ {name}! ًں”¥',
    'onb.toast.athlete':     'ط±ظٹط§ط¶ظٹ',

    // â”€â”€ APP TOUR â”€â”€
    'tour.back':       'ط±ط¬ظˆط¹',
    'tour.skip':       'طھط®ط·ظٹ',
    'tour.next':       'ط§ظ„طھط§ظ„ظٹ â†’',
    'tour.cta':        'ظ‡ظٹط§ ظ†ط¨ط¯ط£! ًں”¥',
    'tour.more.title': 'ط¬ظˆظ„ط© ط§ظ„طھط·ط¨ظٹظ‚',
    'tour.more.sub':   'ط¥ط¹ط§ط¯ط© ط¬ظˆظ„ط© ط§ظ„ظ…ظٹط²ط§طھ آ· 60 ط«ط§ظ†ظٹط©',
    'tour.s0.tag':     'ظپظˆط±ط¬ ط¬ظٹظ…',
    'tour.s0.title':   'ظ†ط¸ط§ظ… ط§ظ„ط¬ظٹظ… ط§ظ„ط®ط§طµ ط¨ظƒ ط¬ط§ظ‡ط²',
    'tour.s0.sub':     'ط¬ظˆظ„ط© 60 ط«ط§ظ†ظٹط© ظ„ظƒظ„ ظ…ط§ ظٹظ…ظƒظ† ظ„ظپظˆط±ط¬ ظپط¹ظ„ظ‡ ظ…ظ† ط£ط¬ظ„ظƒ.',
    'tour.s1.tag':     'ط§ظ„ط®ط·ظˆط© 1 آ· ط§ظ„طھط³ط¬ظٹظ„',
    'tour.s1.title':   'ط³ط¬ظ‘ظ„ ظƒظ„ طھظƒط±ط§ط±',
    'tour.s1.sub':     'ط§ط®طھط± ظ…ط¬ظ…ظˆط¹ط© ط¹ط¶ظ„ظٹط©طŒ ط§ط¨ط­ط« ط¹ظ† طھظ…ط±ظٹظ†ظƒطŒ ظˆطھطھط¨ط¹ ظ…ط¬ظ…ظˆط¹ط§طھظƒ.',
    'tour.s1.f0':      'ط£ظƒط«ط± ظ…ظ† 100 طھظ…ط±ظٹظ† ظ…ط¯ظ…ط¬',
    'tour.s1.f0s':     'ط¹ط¨ط± 9 ظ…ط¬ظ…ظˆط¹ط§طھ ط¹ط¶ظ„ظٹط© ظ…ط¹ ط¨ط­ط« ط°ظƒظٹ',
    'tour.s1.f1':      'ظ…ط¬ظ…ظˆط¹ط§طھ آ· طھظƒط±ط§ط±ط§طھ آ· ظˆط²ظ† آ· ظ…ظ„ط§ط­ط¸ط§طھ',
    'tour.s1.f1s':     'ط¨ط§ظ„ط¥ط¶ط§ظپط© ط¥ظ„ظ‰ ط¹ظ„ط§ظ…ط§طھ ط§ظ„ط¯ط±ظˆط¨ ط³طھ ظˆط§ظ„ط¥ط­ظ…ط§ط، ظˆ AMRAP',
    'tour.s1.f2':      'طھظ„ظ…ظٹط­ ط§ظ„ط¬ظ„ط³ط© ط§ظ„ط£ط®ظٹط±ط©',
    'tour.s1.f2s':     'ط´ط§ظ‡ط¯ ظ…ط§ ط±ظپط¹طھظ‡ ظپظٹ ط§ظ„ظ…ط±ط© ط§ظ„ط£ط®ظٹط±ط©طŒ ظ…ط¨ط§ط´ط±ط©ظ‹',
    'tour.s2.tag':     'ط§ظ„ط£ط¯ط§ط،',
    'tour.s2.title':   'ط§ط·ط±ط¯ ط£ط±ظ‚ط§ظ…ظƒ ط§ظ„ظ‚ظٹط§ط³ظٹط©',
    'tour.s2.sub':     'ظپظٹ ظƒظ„ ظ…ط±ط© طھطھط¬ط§ظˆط² ط±ظ‚ظ…ظƒ ط§ظ„ظ‚ظٹط§ط³ظٹطŒ ظٹظڈط·ظ„ظ‚ ظپظˆط±ط¬ طھظ†ط¨ظٹظ‡ ط§ظ„ط¥ظ†ط¬ط§ط².',
    'tour.s2.f0':      'ط´ط§ط±ط© ط§ظ„ط±ظ‚ظ… ط§ظ„ظ‚ظٹط§ط³ظٹ ط§ظ„ظپظˆط±ظٹ',
    'tour.s2.f0s':     'طھط¶ظٹط، ظ„ط­ط¸ط© طھط­ظ‚ظٹظ‚ ط±ظ‚ظ… ظ‚ظٹط§ط³ظٹ ط¬ط¯ظٹط¯',
    'tour.s2.f1':      'ط³ط¬ظ„ط§طھ ط§ظ„ط­ط¬ظ… ظˆ 1RM',
    'tour.s2.f1s':     'ظ„ظƒظ„ طھظ…ط±ظٹظ†طŒ ظٹطھطھط¨ط¹ظ‡ط§ طھظ„ظ‚ط§ط¦ظٹط§ظ‹',
    'tour.s2.f2':      'ط³ط¬ظ„ ط§ظ„ط£ط±ظ‚ط§ظ… ط§ظ„ظ‚ظٹط§ط³ظٹط© ظپظٹ ط§ظ„ط¥ط­طµط§ط¦ظٹط§طھ',
    'tour.s2.f2s':     'ظƒظ„ طھظ…ط±ظٹظ†طŒ ظƒظ„ ط¥ظ†ط¬ط§ط²',
    'tour.s3.tag':     'ط§ظ„ط§ط³طھط±ط¯ط§ط¯',
    'tour.s3.title':   'ط§ط±طھظژط­ ظƒط§ظ„ظ…ط­طھط±ظپظٹظ†',
    'tour.s3.sub':     'ط²ط± âڈ± ط§ظ„ط¹ط§ط¦ظ… ظ…ظˆط¬ظˆط¯ ظپظٹ ط§ظ„ط²ط§ظˆظٹط© ط§ظ„ظٹظ…ظ†ظ‰ ط§ظ„ط³ظپظ„ظ‰ ط¹ظ„ظ‰ ظƒظ„ ط´ط§ط´ط©.',
    'tour.s3.f0':      'ط§ط¶ط؛ط· ط¨ط¹ط¯ ظƒظ„ ظ…ط¬ظ…ظˆط¹ط©',
    'tour.s3.f0s':     'ط§ط¨ط¯ط£ ط§ظ„ط¹ط¯ ط§ظ„طھظ†ط§ط²ظ„ظٹ ظ„ظ„ط±ط§ط­ط© ظپظˆط±ط§ظ‹',
    'tour.s3.f1':      'ط§ظ‡طھط²ط§ط² + طھظ†ط¨ظٹظ‡ طµظˆطھظٹ',
    'tour.s3.f1s':     'ظ„ط§ طھظپظˆظ‘طھ ظ†ظ‡ط§ظٹط© ط§ظ„ط±ط§ط­ط© ط£ط¨ط¯ط§ظ‹',
    'tour.s3.f2':      'ط¶ط¨ط· ظ…ط³ط¨ظ‚: 60 / 90 / 120 / 180 ط«ط§ظ†ظٹط©',
    'tour.s3.f2s':     'ط¶ط؛ط·ط© ظˆط§ط­ط¯ط© ظ„طھط­ط¯ظٹط¯ ظˆظ‚طھ ط±ط§ط­طھظƒ',
    'tour.s4.tag':     'ط§ظ„طھط­ظ„ظٹظ„ط§طھ',
    'tour.s4.title':   'ط´ط§ظ‡ط¯ طھظ‚ط¯ظ…ظƒ',
    'tour.s4.sub':     'ظ…ط®ط·ط·ط§طھ ظˆط®ط±ط§ط¦ط· ط­ط±ط§ط±ط© ظˆط§طھط¬ط§ظ‡ط§طھ. ط´ط§ظ‡ط¯ ظ†ظپط³ظƒ طھطھط­ظˆظ„.',
    'tour.s4.f0':      'ظ…ط®ط·ط·ط§طھ ط§ظ„ط­ط¬ظ… ظˆط§ظ„ظ‚ظˆط©',
    'tour.s4.f0s':     'ظ„ظƒظ„ طھظ…ط±ظٹظ† ظˆظ„ظƒظ„ ظ…ط¬ظ…ظˆط¹ط© ط¹ط¶ظ„ظٹط©',
    'tour.s4.f1':      'ط±ط§ط¯ط§ط± طھظˆط§ط²ظ† ط§ظ„ط¹ط¶ظ„ط§طھ',
    'tour.s4.f1s':     'ط§ظƒطھط´ظپ ط§ظ„ط¹ط¶ظ„ط§طھ ط§ظ„طھظٹ طھظ‡ظ…ظ„ظ‡ط§',
    'tour.s4.f2':      'ظˆط²ظ† ط§ظ„ط¬ط³ظ… ظˆط§ظ„طھظ‚ظˆظٹظ…',
    'tour.s4.f2s':     'ط³ط¬ظ„ط§طھ ظٹظˆظ…ظٹط©طŒ ط§طھط¬ط§ظ‡ط§طھ ط£ط³ط¨ظˆط¹ظٹط©طŒ ط®ط±ظٹط·ط© ط­ط±ط§ط±ظٹط©',
    'tour.s5.tag':     'ط§ظ„طھط­ط¯ظٹ',
    'tour.s5.title':   'ط§ط±ظپط¹ ظ…ط³طھظˆط§ظƒ ظٹظˆظ…ظٹط§ظ‹',
    'tour.s5.sub':     'ظƒظ„ طھظƒط±ط§ط± ظٹظƒط³ط¨ظƒ XP. ط§ظ„ظ…ظ‡ط§ظ… طھط¯ظپط¹ظƒ ظ„طھط¬ط§ظˆط² ط­ط¯ظˆط¯ظƒ.',
    'tour.s5.f0':      'ظ…ط¨طھط¯ط¦ â†’ ظ…ط­طھط±ظپ â†’ ط£ط³ط·ظˆط±ط©',
    'tour.s5.f0s':     '10 ط±طھط¨ ظ„طھطھط³ظ„ظ‚ظ‡ط§طŒ ظƒظ„ ط±طھط¨ط© ط£طµط¹ط¨',
    'tour.s5.f1':      'ظ…ظ‡ط§ظ… ظٹظˆظ…ظٹط© ظˆط£ط³ط¨ظˆط¹ظٹط©',
    'tour.s5.f1s':     'طھط­ط¯ظٹط§طھ ط¬ط¯ظٹط¯ط© ظƒظ„ ظٹظˆظ…',
    'tour.s5.f2':      'ظ…ظƒط§ظپط¢طھ ط§ظ„طھط³ظ„ط³ظ„ ظˆط§ظ„ط´ط§ط±ط§طھ',
    'tour.s5.f2s':     'ظ„ط§ طھظƒط³ط± ط§ظ„ط³ظ„ط³ظ„ط©',
    'tour.s6.tag':     'ط§ظ„ظ…ط¯ط±ط¨ ط§ظ„ط°ظƒظٹ',
    'tour.s6.title':   'ظ…ط¯ط±ط¨ظƒ ط§ظ„ط´ط®طµظٹ',
    'tour.s6.sub':     'ظٹظ‚ط±ط£ ظپظˆط±ط¬ ط¨ظٹط§ظ†ط§طھظƒ ط§ظ„طھط¯ط±ظٹط¨ظٹط© ظˆظٹطھظƒظٹظپ ظ…ط¹ظƒ ظٹظˆظ…ظٹط§ظ‹.',
    'tour.s6.f0':      'ط¯ط±ط¬ط© ط§ظ„ط§ط³طھط¹ط¯ط§ط¯ ط§ظ„ظٹظˆظ…ظٹط©',
    'tour.s6.f0s':     'ط§ط¹ط±ظپ ظ…طھظ‰ طھط¯ظپط¹ ط¨ظ‚ظˆط© ط£ظˆ طھطھط¹ط§ظپظ‰',
    'tour.s6.f1':      'ط¨ط±ط§ظ…ط¬ PPL ظˆ 5/3/1 ظˆ 5أ—5',
    'tour.s6.f1s':     'ظ‚ظˆط§ظ„ط¨ ط¹ظ„ظ…ظٹط©طŒ ط¶ط؛ط·ط© ظˆط§ط­ط¯ط© ظ„ظ„ط¨ط¯ط،',
    'tour.s6.f2':      'ط£ظ‡ط¯ط§ظپ ط§ظ„طھط؛ط°ظٹط© ظˆط§ظ„ظ…ط§ظƒط±ظˆ',
    'tour.s6.f2s':     'ط³ط¹ط±ط§طھ ط­ط±ط§ط±ظٹط© ظˆط¨ط±ظˆطھظٹظ† ظ…ط®طµطµط© ظ„ظ‡ط¯ظپظƒ',
    'tour.s7.tag':     'ط£ظ†طھ ظ…ط³طھط¹ط¯',
    'tour.s7.title':   'ظ‡ظٹط§ ظپظˆط±ط¬',
    'tour.s7.sub':     'ط§ظ„ط­ط¯ظٹط¯ ظٹظ†طھط¸ط±. ط¬ظ„ط³طھظƒ ط§ظ„ط£ظˆظ„ظ‰ طھط¨ط¯ط£ ط§ظ„ط¢ظ†.',
    'tour.s7.t0':      'ط³ط¬ظ‘ظ„',
    'tour.s7.t1':      'ط§ظ„ط£ط±ظ‚ط§ظ…',
    'tour.s7.t2':      'ط¥ط­طµط§ط¦ظٹط§طھ',
    'tour.s7.t3':      'ط§ط±طھظ‚ظگ',

    // A2: Auto-rest
    'settings.autoRest':    'ط¨ط¯ط، ظ…ط¤ظ‚طھ ط§ظ„ط±ط§ط­ط© طھظ„ظ‚ط§ط¦ظٹط§ظ‹',
    'settings.autoRestSub': 'ظٹط¨ط¯ط£ ظ…ط¤ظ‚طھ ط§ظ„ط±ط§ط­ط© ط¨ط¹ط¯ ظƒظ„ ظ…ط¬ظ…ظˆط¹ط© ظ…ط³ط¬ظ‘ظ„ط©',

    // B1: RPE
    'settings.rpe':    'ط¹ط±ط¶ RPE ظ„ظƒظ„ ظ…ط¬ظ…ظˆط¹ط©',
    'settings.rpeSub': 'ظ…ط¹ط¯ظ„ ط§ظ„ط¬ظ‡ط¯ ط§ظ„ظ…ط¨ط°ظˆظ„ (1â€“10)',
    'form.rpe':        'RPE',

    // B2: Swap
    'form.swap':       'â†” ط¨ط¯ظٹظ„',
    'swap.sub':        'ط§ط®طھط± ط¨ط¯ظٹظ„ط§ظ‹ ظ„ظ†ظپط³ ط§ظ„ظ…ط¬ظ…ظˆط¹ط© ط§ظ„ط¹ط¶ظ„ظٹط©:',
    'swap.cancel':     'ط¥ظ„ط؛ط§ط،',

    // C2: Photos
    'photos.title':    'طµظˆط± ط§ظ„طھظ‚ط¯ظ…',
    'photos.add':      '+ ط¥ط¶ط§ظپط©',
    'photos.empty':    'ظ„ط§ طھظˆط¬ط¯ طµظˆط± ط¨ط¹ط¯. ط£ط¶ظپ ط£ظˆظ„ظ‰ طµظˆط± طھظ‚ط¯ظ…ظƒ!',

  }
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  TRANSLATION ENGINE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let currentLang = localStorage.getItem('forge_lang') || 'en';

let _forgeCp1256ReverseMap = null;
function _forgeGetCp1256ReverseMap() {
  if (_forgeCp1256ReverseMap) return _forgeCp1256ReverseMap;
  try {
    const dec1256 = new TextDecoder('windows-1256');
    const map = {};
    for (let i = 0; i < 256; i++) {
      const ch = dec1256.decode(new Uint8Array([i]));
      if (map[ch] === undefined) map[ch] = i;
    }
    _forgeCp1256ReverseMap = map;
  } catch (e) {
    _forgeCp1256ReverseMap = {};
  }
  return _forgeCp1256ReverseMap;
}

function _forgeFixArabicMojibake(input) {
  if (typeof input !== 'string') return input;
  if (!/[طظØÙ]/.test(input)) return input;
  const rev = _forgeGetCp1256ReverseMap();
  try {
    const utf8 = new TextDecoder('utf-8');
    let out = '';
    let bufOrig = '';
    let bufBytes = [];
    let hasMoj = false;
    const flush = () => {
      if (!bufOrig) return;
      if (!hasMoj) {
        out += bufOrig;
      } else {
        let decoded = '';
        try { decoded = utf8.decode(new Uint8Array(bufBytes)); } catch (e) { decoded = ''; }
        out += /[\u0600-\u06FF]/.test(decoded) ? decoded : bufOrig;
      }
      bufOrig = '';
      bufBytes = [];
      hasMoj = false;
    };
    for (const ch of input) {
      const code = ch.charCodeAt(0);
      if (code <= 0x7f) {
        bufOrig += ch;
        bufBytes.push(code);
        continue;
      }
      const b = rev[ch];
      if (typeof b === 'number') {
        bufOrig += ch;
        bufBytes.push(b);
        if (/[طظØÙ]/.test(ch)) hasMoj = true;
        continue;
      }
      flush();
      out += ch;
    }
    flush();
    return out;
  } catch (e) {
    return input;
  }
}
window._forgeFixArabicText = _forgeFixArabicMojibake;

let _forgeMojibakeObserver = null;
function _forgeFixArabicAttrs(el) {
  if (!el || el.nodeType !== 1) return;
  const attrs = ['placeholder', 'title', 'aria-label'];
  attrs.forEach(name => {
    const v = el.getAttribute(name);
    if (typeof v === 'string' && v) {
      const fixed = _forgeFixArabicMojibake(v);
      if (fixed !== v) el.setAttribute(name, fixed);
    }
  });
}

function _forgeFixArabicTree(root) {
  if (currentLang !== 'ar' || !root) return;
  const n = root.nodeType;
  if (n === 3) {
    const txt = root.nodeValue || '';
    const fixed = _forgeFixArabicMojibake(txt);
    if (fixed !== txt) root.nodeValue = fixed;
    return;
  }
  if (n !== 1 && n !== 9 && n !== 11) return;

  if (n === 1) _forgeFixArabicAttrs(root);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let textNode = walker.nextNode();
  while (textNode) {
    const txt = textNode.nodeValue || '';
    const fixed = _forgeFixArabicMojibake(txt);
    if (fixed !== txt) textNode.nodeValue = fixed;
    textNode = walker.nextNode();
  }

  const elWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);
  let elNode = elWalker.nextNode();
  while (elNode) {
    _forgeFixArabicAttrs(elNode);
    elNode = elWalker.nextNode();
  }
}

function _forgeStartMojibakeObserver() {
  if (_forgeMojibakeObserver || !document.body) return;
  _forgeMojibakeObserver = new MutationObserver((mutations) => {
    if (currentLang !== 'ar') return;
    mutations.forEach(m => {
      if (m.type === 'characterData') {
        _forgeFixArabicTree(m.target);
        return;
      }
      m.addedNodes && m.addedNodes.forEach(node => _forgeFixArabicTree(node));
      if (m.target) _forgeFixArabicAttrs(m.target.nodeType === 1 ? m.target : null);
    });
  });
  _forgeMojibakeObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['placeholder', 'title', 'aria-label']
  });
}

/** Translate a key - falls back to English if key missing in Arabic */
function t(key) {
  const raw = (LANGS[currentLang] && LANGS[currentLang][key]) || LANGS.en[key] || key;
  return currentLang === 'ar' ? _forgeFixArabicMojibake(raw) : raw;
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
  const floatBtn = document.getElementById('lang-toggle-float');
  const langLabel = isAr ? 'EN' : 'AR';
  if (floatBtn) floatBtn.textContent = langLabel;
  if (typeof window._authApplyLanguage === 'function') window._authApplyLanguage();

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

  // Final pass: fix any mojibake Arabic text rendered outside t() paths.
  if (isAr) {
    _forgeFixArabicTree(document.body);
    setTimeout(() => _forgeFixArabicTree(document.body), 120);
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
  if (tag && (tag.textContent === '// Gym OS' || tag.textContent === '// طھطھط¨ط¹ ط§ظ„طھظ…ط§ط±ظٹظ†')) {
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
  if (pwaBannerTitle) pwaBannerTitle.textContent = isAr ? 'طھط«ط¨ظٹطھ ظپظˆط±ط¬' : 'Install FORGE';
  if (pwaBannerSub)   pwaBannerSub.textContent   = isAr ? 'ط£ط¶ظپ ط¥ظ„ظ‰ ط§ظ„ط´ط§ط´ط© ط§ظ„ط±ط¦ظٹط³ظٹط© ظ„ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ طھط¬ط±ط¨ط© ط§ظ„طھط·ط¨ظٹظ‚ ط§ظ„ظƒط§ظ…ظ„ط©' : 'Add to home screen for the full app experience';
  if (pwaInstallBtn)  pwaInstallBtn.textContent   = isAr ? 'طھط«ط¨ظٹطھ' : 'INSTALL';
}

function updateNavLabels() {
  // Nav labels now use data-i18n spans â€” handled by the main applyLanguage scan.
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

  // Save button â€” update only the text span, not the SVG icon
  const saveBtnSpan = document.querySelector('[onclick="saveWorkout()"] span[data-i18n="form.save"]');
  if (saveBtnSpan) saveBtnSpan.textContent = t('form.save');
  const saveBwBtn = document.querySelector('[onclick="saveBwWorkout()"]');
  if (saveBwBtn) saveBwBtn.textContent = t('bw.save');

  // Add set buttons â€” use data-i18n so applyLanguage handles them, but also update here for instant refresh
  document.querySelectorAll('[onclick="addSet()"][data-i18n]').forEach(btn => btn.textContent = t('form.addSet'));
  document.querySelectorAll('[onclick="addBwSet()"][data-i18n]').forEach(btn => btn.textContent = t('bw.addSet'));

  // "Recent â€”" heading (has a child span â€” update text node only)
  const recentHeading = document.getElementById('wgt-muscle-history-heading');
  if (recentHeading) {
    const _fAr2 = (typeof currentLang !== 'undefined') && currentLang === 'ar';
    const span = recentHeading.querySelector('#wgt-muscle-history-label');
    recentHeading.childNodes.forEach(n => { if (n.nodeType === 3) n.textContent = _fAr2 ? 'ط§ظ„ط£ط®ظٹط±ط© â€” ' : 'Recent â€” '; });
    if (span && !recentHeading.contains(span)) recentHeading.appendChild(span);
  }

  // Exercise entry panel title (changes based on weighted/bodyweight mode)
  const exPanelTitle = document.getElementById('exercise-panel-title');
  if (exPanelTitle) {
    const _fAr = (typeof currentLang !== 'undefined') && currentLang === 'ar';
    const _isWgt = (typeof workoutMode === 'undefined') || workoutMode === 'weighted';
    exPanelTitle.textContent = _isWgt
      ? (_fAr ? 'ط¥ط¯ط®ط§ظ„ ط§ظ„طھظ…ط±ظٹظ†' : 'Exercise Entry')
      : (_fAr ? 'طھظ…ط±ظٹظ† ظˆط²ظ† ط§ظ„ط¬ط³ظ…' : 'Bodyweight Exercise');
  }

  // Exercise name placeholder
  const exInput = document.getElementById('exercise-name');
  if (exInput) {
    const _fAr = (typeof currentLang !== 'undefined') && currentLang === 'ar';
    const _isWgt = (typeof workoutMode === 'undefined') || workoutMode === 'weighted';
    exInput.placeholder = _isWgt
      ? (_fAr ? 'ظ…ط«ط§ظ„: ط¶ط؛ط· ط§ظ„طµط¯ط±طŒ ط§ظ„ظ‚ط±ظپطµط§ط،â€¦' : 'e.g. Bench Press, Squatâ€¦')
      : (_fAr ? 'ظ…ط«ط§ظ„: ط¶ط؛ط·طŒ ط¨ظٹط±ط¨ظٹâ€¦' : 'e.g. Push-Ups, Burpeesâ€¦');
  }

  // Notes placeholder
  const notesInput = document.getElementById('session-notes');
  if (notesInput) {
    const _fAr = (typeof currentLang !== 'undefined') && currentLang === 'ar';
    notesInput.placeholder = _fAr ? 'ظƒظٹظپ ط´ط¹ط±طھطں ط£ظٹ ط£ط±ظ‚ط§ظ… ظ‚ظٹط§ط³ظٹط©طں' : 'How did it feel? Any PRs?';
  }
}

function updateStaticLabels() {
  // Section labels (Rest Timer title, etc.)
  document.querySelectorAll('.section-label').forEach(el => {
    const txt = el.textContent.trim();
    if (txt === 'Rest Timer' || txt === 'ظ…ط¤ظ‚طھ ط§ظ„ط±ط§ط­ط©') el.textContent = t('timer.title');
    if (txt === 'EDIT LAYOUT' || txt === 'طھط¹ط¯ظٹظ„ ط§ظ„طھط®ط·ظٹط·') return; // handled elsewhere
  });
}

function translateMoreView() {
  // Panel titles in More view - use text content matching
  document.querySelectorAll('#view-more .panel-title').forEach(el => {
    const txt = el.textContent.trim();
    const map = {
      'My Profile': t('more.profile'),
      'ط§ظ„ظ…ظ„ظپ ط§ظ„ط´ط®طµظٹ': t('more.profile'),
      'Settings': t('more.settings'),
      'ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ': t('more.settings'),
      'My Templates': t('more.templates'),
      'ظ‚ظˆط§ظ„ط¨ظٹ': t('more.templates'),
      'Data & Export': t('more.data'),
      'ط§ظ„ط¨ظٹط§ظ†ط§طھ ظˆط§ظ„طھطµط¯ظٹط±': t('more.data'),
      'Install on Phone': t('more.install'),
      'ط§ظ„طھط«ط¨ظٹطھ ط¹ظ„ظ‰ ط§ظ„ظ‡ط§طھظپ': t('more.install'),
      'Bodyweight History': t('more.bwHistory'),
      'ط³ط¬ظ„ ظˆط²ظ† ط§ظ„ط¬ط³ظ…': t('more.bwHistory'),
      'Body Composition': t('more.bodyComp'),
      'طھظƒظˆظٹظ† ط§ظ„ط¬ط³ظ…': t('more.bodyComp'),
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
      'طµظˆطھ ظ…ط¤ظ‚طھ ط§ظ„ط±ط§ط­ط©': t('settings.sound'),
      'Show Last Session Hint': t('settings.hint'),
      'ط¹ط±ط¶ طھظ„ظ…ظٹط­ ط§ظ„ط¬ظ„ط³ط© ط§ظ„ط³ط§ط¨ظ‚ط©': t('settings.hint'),
    };
    if (map[txt]) el.textContent = map[txt];
  });
  // Hint text under toggles
  document.querySelectorAll('.toggle-row > div > div:nth-child(2)').forEach(el => {
    const txt = el.textContent.trim();
    const map = {
      'Vibrate & beep when rest ends': t('settings.soundHint'),
      'ط§ظ‡طھط²ط§ط² ظˆطµظˆطھ طھظ†ط¨ظٹظ‡ ط¹ظ†ط¯ ط§ظ†طھظ‡ط§ط، ط§ظ„ط±ط§ط­ط©': t('settings.soundHint'),
      'Shows previous sets when logging': t('settings.hintHint'),
      'ظٹط¹ط±ط¶ ط§ظ„ظ…ط¬ظ…ظˆط¹ط§طھ ط§ظ„ط³ط§ط¨ظ‚ط© ط¹ظ†ط¯ ط§ظ„طھط³ط¬ظٹظ„': t('settings.hintHint'),
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
    if (txt.includes('Export') || txt.includes('طھطµط¯ظٹط±')) {
      replaceText(t('data.export'));
    } else if (txt.includes('Backup') || txt.includes('ظ†ط³ط® ط§ط­طھظٹط§ط·ظٹ')) {
      replaceText(t('data.backup'));
    } else if (txt.includes('Clear') || txt.includes('ظ…ط³ط­')) {
      replaceText(t('data.clear'));
    } else if (txt.includes('Restore') || txt.includes('ط§ط³طھط¹ط§ط¯ط©')) {
      // label has hidden file input â€” preserve it
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
      'ط£ظ†ط¯ط±ظˆظٹط¯ (Chrome)':   { title: t('install.android'), text: t('install.androidText') },
      'iPhone (Safari)':    { title: t('install.ios'),     text: t('install.iosText') },
      'ط¢ظٹظپظˆظ† (Safari)':     { title: t('install.ios'),     text: t('install.iosText') },
      'Get a Real APK':     { title: t('install.apk'),     text: t('install.apkText') },
      'ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ APK':     { title: t('install.apk'),     text: t('install.apkText') },
    };
    if (map[title]) {
      titleEl.textContent = map[title].title;
      textEl.textContent  = map[title].text;
    }
  });
}

// renderStepsPanel already handles Arabic internally â€” no patch needed.

// showToast is defined in the main script â€” no override needed.
// Use the global t() function to translate strings before passing to showToast().

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  ANDROID / MOBILE FIXES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// 4. Fix input zoom on Android â€” ensure all number inputs have inputmode
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
// NOTE: do NOT set overflowY='auto' here â€” it traps touch-scroll on iOS/Android
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  INIT â€” Apply saved language on page load
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
(function initLanguage() {
  // Always apply language on load (for both Arabic and English)
  // so all JS-rendered content (muscle balance, vol list, etc.) uses the correct language
  function doApply() {
    _forgeStartMojibakeObserver();
    setTimeout(() => {
      applyLanguage();
      if (currentLang === 'ar') _forgeFixArabicTree(document.body);
    }, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', doApply);
  } else {
    doApply();
  }
})();

