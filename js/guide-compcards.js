// FORGE Gym Tracker - user guide renderer and body composition summary cards
// Extracted from index.html to keep the main script lean.

let _guideTab = 'start';

function switchGuideTab(tab, btn) {
  _guideTab = tab;
  document.querySelectorAll('.guide-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderGuide();
}

function renderGuide() {
  const el = document.getElementById('guide-content');
  if (!el) return;
  const ar = typeof currentLang !== 'undefined' && currentLang === 'ar';
  const dir = ar ? 'rtl' : 'ltr';

  // Also update tab labels for language
  const tabLabels = {
    start: ar ? 'البداية' : 'Getting Started',
    log: ar ? 'التسجيل' : 'Logging',
    score: ar ? 'التقييم' : 'Scoring',
    features: ar ? 'المميزات' : 'Features'
  };
  document.querySelectorAll('.guide-tab').forEach((b, i) => {
    const keys = ['start', 'log', 'score', 'features'];
    b.textContent = tabLabels[keys[i]] || b.textContent;
  });

  const CHAPTERS = {
    // GETTING STARTED
    start: () => {
      const steps = ar ? [
        { emoji: '👤', title: 'أنشئ ملفك الشخصي', desc: 'اذهب إلى "المزيد" ← "الملف الشخصي". أضف تاريخ ميلادك، طولك، وهدفك التدريبي. سيحسب التطبيق تلقائيًا عمرك وكتلة جسمك (BMI) واحتياجاتك اليومية من السعرات.', color: '#39ff8f' },
        { emoji: '💪', title: 'اختر عضلتك', desc: 'في تبويب "السجل"، ستجد خريطة الجسم التفاعلية. اضغط على العضلة التي تريد تدريبها (صدر، ظهر، أكتاف، إلخ) لتبدأ تسجيل التمرين.', color: '#60a5fa' },
        { emoji: '📝', title: 'سجّل تمرينك', desc: 'اكتب اسم التمرين، أضف المجموعات مع عدد التكرارات والوزن. اضغط "حفظ" عند الانتهاء. كلما أضفت أوزانًا أعلى من السابق، سيُسجَّل كـ PR (رقم قياسي شخصي)!', color: '#f97316' },
        { emoji: '📊', title: 'تابع تقدمك', desc: 'افتح تبويب "الإحصاءات" لترى مخططات التقدم، ميزان العضلات، ومؤشرات تكوين الجسم. كلما سجّلت أكثر، كلما أصبحت الرؤى أذكى.', color: '#c084fc' },
        { emoji: '🤖', title: 'استخدم مدرب فورج', desc: 'في قسم "المدرب الذكي" داخل تبويب السجل، ستجد تحليلات مخصصة لتدريبك، توصيات للتقدم، وخطة أسبوعية مقترحة.', color: '#f39c12' }
      ] : [
        { emoji: '👤', title: 'Create Your Profile', desc: 'Go to More → Profile. Add your date of birth, height, and training goal. The app will automatically calculate your age, BMI, and daily calorie needs (TDEE).', color: '#39ff8f' },
        { emoji: '💪', title: 'Pick Your Muscle', desc: 'In the Log tab, tap the interactive body map to select the muscle group you\'re training - Chest, Back, Shoulders, and more. This categorises every workout automatically.', color: '#60a5fa' },
        { emoji: '📝', title: 'Log Your Workout', desc: 'Type the exercise name, add sets with reps and weight, then hit Save. If you lift heavier than ever before, FORGE automatically marks it as a PR (Personal Record)!', color: '#f97316' },
        { emoji: '📊', title: 'Track Your Progress', desc: 'Open the Stats tab to see progress charts, muscle balance radar, and body composition trends. The more you log, the smarter the insights get.', color: '#c084fc' },
        { emoji: '🤖', title: 'Use Forge Coach', desc: 'The AI Coach section inside the Log tab gives you personalised training analysis, progressive overload tips, a suggested weekly plan, and nutrition estimates.', color: '#f39c12' }
      ];

      const welcome = ar
        ? '<div class="gc-chapter"><div class="gc-chapter-title">مرحبًا بك في فورج 👋</div><div class="gc-chapter-sub">دليلك الكامل لاستخدام التطبيق من الصفر</div></div>'
        : '<div class="gc-chapter"><div class="gc-chapter-title">Welcome to FORGE 👋</div><div class="gc-chapter-sub">Your complete guide to using the app from day one</div></div>';

      const highlight = ar
        ? '<div class="gc-highlight"><span class="gc-highlight-icon">💡</span><span class="gc-highlight-text">فورج يعمل بالكامل بدون إنترنت بعد أول تحميل. بياناتك محفوظة محليًا على جهازك - لا حسابات، لا سحابة، لا أي شيء يُرسَل خارج هاتفك.</span></div>'
        : '<div class="gc-highlight"><span class="gc-highlight-icon">💡</span><span class="gc-highlight-text">FORGE works fully offline after first load. All your data is saved locally on your device - no accounts, no cloud, nothing leaves your phone.</span></div>';

      const stepsHtml = steps.map((s, i) => `
        <div class="gc-step" style="--gs-color:${s.color}">
          <div class="gc-step-num">${i + 1}</div>
          <div class="gc-step-body">
            <div class="gc-step-title">${s.emoji} ${s.title}</div>
            <div class="gc-step-desc">${s.desc}</div>
          </div>
        </div>`).join('');

      return `${welcome}<div class="gc-steps">${stepsHtml}</div>${highlight}`;
    },

    // LOGGING
    log: () => {
      const cards = ar ? [
        { icon: '🏋️', color: '#39ff8f', title: 'التمارين بالأوزان', desc: 'اختر عضلة من خريطة الجسم، ثم أدخل اسم التمرين والمجموعات. كل مجموعة تحتوي على: عدد التكرارات + الوزن. تُجمع كل المجموعات تلقائيًا في "الحجم الإجمالي".', tip: 'حجم الجلسة = مجموع (تكرارات × وزن) لكل المجموعات' },
        { icon: '🤸', color: '#60a5fa', title: 'التمارين بوزن الجسم', desc: 'اضغط على "وزن الجسم" للتبديل. سجّل التمارين مثل الضغط، العقلة، القرفصاء بدون أوزان. يمكنك تحديد مستوى الجهد: سهل / متوسط / صعب / حتى الإخفاق.', tip: 'مستوى الجهد يساعد المدرب الذكي على تحليل شدة التدريب' },
        { icon: '💧', color: '#38bdf8', title: 'تتبع الماء', desc: 'اضغط على أيقونة الماء في الرأس أو استخدم أكواب الماء في الإحصاءات. الهدف اليومي 8 أكواب. يتجدد كل يوم تلقائيًا.', tip: 'الضغط على + في الرأس يضيف كوبًا بسرعة' },
        { icon: '⏱️', color: '#f97316', title: 'مؤقت الراحة', desc: 'اضبط وقت الراحة بين المجموعات (60 ث / 90 ث / 2 د / 3 د). اضغط ▶ ليبدأ العد التنازلي. ستسمع صوتًا وتشعر بالاهتزاز عند انتهاء الوقت.', tip: 'المؤقت يبدأ تلقائيًا بعد حفظ كل مجموعة' },
        { icon: '📋', color: '#c084fc', title: 'القوالب', desc: 'احفظ مجموعات تمارينك المفضلة كقالب. في المرة القادمة، ابدأ الجلسة بضغطة واحدة دون الحاجة لإعادة الكتابة.', tip: 'أنشئ قالبًا في المزيد ← قوالبي' },
        { icon: '📐', color: '⚖️', title: 'تكوين الجسم', desc: 'في تبويب الإحصاءات، سجّل وزنك ونسبة الدهون وكتلة العضلات بضغطة على البطاقات أو من خلال نموذج السجل. سترى المخططات تتحدث فورًا.', tip: 'يمكن الضغط على بطاقات الرأس لتسجيل سريع' }
      ] : [
        { icon: '🏋️', color: '#39ff8f', title: 'Weighted Workouts', desc: 'Pick a muscle from the body map, type the exercise name, then add sets with reps and weight. All sets are summed into a "Total Volume" automatically.', tip: 'Session Volume = sum of (reps × weight) across all sets' },
        { icon: '🤸', color: '#60a5fa', title: 'Bodyweight Workouts', desc: 'Tap "Bodyweight" to switch modes. Log exercises like push-ups, pull-ups, squats without weights. Set an effort level - Easy / Medium / Hard / To Failure - for each set.', tip: 'Effort levels help the AI Coach analyse training intensity' },
        { icon: '💧', color: '#38bdf8', title: 'Water Tracking', desc: 'Tap the water icon in the header or use the cup grid in Stats. Daily goal is 8 cups. Resets automatically every day at midnight.', tip: 'Tap + in the header for a quick 1-cup add' },
        { icon: '⏱️', color: '#f97316', title: 'Rest Timer', desc: 'Set rest time between sets (60s / 90s / 2m / 3m). Press ▶ to start the countdown. You\'ll hear a sound and feel a vibration when rest is done.', tip: 'Timer auto-starts after saving a workout set' },
        { icon: '📋', color: '#c084fc', title: 'Templates', desc: 'Save your favourite workout combos as a template. Next session, start with one tap - no retyping exercises or sets.', tip: 'Create templates in More → My Templates' },
        { icon: '⚖️', color: '#f97316', title: 'Body Composition', desc: 'In the Stats tab, tap any of the three cards (Weight / Body Fat / Muscle) to log instantly. Charts update the moment you save.', tip: 'Header cards also support quick-tap logging' }
      ];

      const header = ar
        ? '<div class="gc-chapter"><div class="gc-chapter-title">كيف تسجّل تمرينك 📋</div><div class="gc-chapter-sub">كل ما تحتاج معرفته عن طريقة التسجيل</div></div>'
        : '<div class="gc-chapter"><div class="gc-chapter-title">How to Log Workouts 📋</div><div class="gc-chapter-sub">Everything you need to know about logging</div></div>';

      const cardsHtml = cards.map(c => `
        <div class="gc-info-card" style="background:color-mix(in srgb,${c.color} 6%,var(--bg3));border-color:color-mix(in srgb,${c.color} 22%,transparent)">
          <div class="gc-info-icon">${c.icon}</div>
          <div class="gc-info-body">
            <div class="gc-info-title" style="color:${c.color}">${c.title}</div>
            <div class="gc-info-desc">${c.desc}</div>
            <span class="gc-info-tip">${ar ? '💡 نصيحة' : '💡 Tip'}: ${c.tip}</span>
          </div>
        </div>`).join('');

      return `${header}<div class="gc-info-cards">${cardsHtml}</div>`;
    },

    // SCORING
    score: () => {
      const header = ar
        ? '<div class="gc-chapter"><div class="gc-chapter-title">نظام التقييم والنقاط 🏆</div><div class="gc-chapter-sub">كيف تُحسَب نقاطك ومستوياتك</div></div>'
        : '<div class="gc-chapter"><div class="gc-chapter-title">Scoring & XP System 🏆</div><div class="gc-chapter-sub">How your points and ranks are calculated</div></div>';

      const xpTitle = ar ? 'كيف تكسب نقاط الخبرة (XP)' : 'How You Earn XP';
      const xpItems = ar ? [
        { emoji: '💪', label: 'تمرين بالأوزان', val: '+10 XP' },
        { emoji: '🏅', label: 'رقم قياسي جديد (PR)', val: '+25 XP' },
        { emoji: '🤸', label: 'تمرين بوزن الجسم', val: '+8 XP' },
        { emoji: '🏅', label: 'رقم قياسي لوزن الجسم', val: '+20 XP' },
        { emoji: '🔥', label: 'يوم إضافي في السلسلة', val: '+5 XP' },
        { emoji: '⚡', label: 'كل مجموعة مسجّلة', val: '+2 XP' },
        { emoji: '🏋️', label: 'كل 1000 كجم حجم', val: '+1 XP' },
        { emoji: '👟', label: 'كل 1000 خطوة', val: '+1 XP' }
      ] : [
        { emoji: '💪', label: 'Weighted workout logged', val: '+10 XP' },
        { emoji: '🏅', label: 'New Personal Record (PR)', val: '+25 XP' },
        { emoji: '🤸', label: 'Bodyweight workout logged', val: '+8 XP' },
        { emoji: '🏅', label: 'Bodyweight PR', val: '+20 XP' },
        { emoji: '🔥', label: 'Streak day extended', val: '+5 XP' },
        { emoji: '⚡', label: 'Per set logged', val: '+2 XP' },
        { emoji: '🏋️', label: 'Per 1,000 kg volume lifted', val: '+1 XP' },
        { emoji: '👟', label: 'Per 1,000 steps', val: '+1 XP' }
      ];
      const xpPills = xpItems.map(x => `
        <div class="gc-xp-pill">
          <span class="gc-xp-pill-emoji">${x.emoji}</span>
          <span class="gc-xp-pill-text">${x.label}</span>
          <span class="gc-xp-pill-val">${x.val}</span>
        </div>`).join('');

      const gradeTitle = ar ? 'درجات ميزان العضلات' : 'Muscle Balance Grades';
      const grades = [
        { grade: 'S', color: '#39ff8f', bar: 95, label: ar ? 'ممتاز - 80+ نقطة' : 'Elite - 80+ score' },
        { grade: 'A', color: '#f39c12', bar: 70, label: ar ? 'جيد جدًا - 60-79' : 'Good - 60-79' },
        { grade: 'B', color: '#60a5fa', bar: 50, label: ar ? 'متوسط - 40-59' : 'Average - 40-59' },
        { grade: 'C', color: '#e74c3c', bar: 30, label: ar ? 'ضعيف - 20-39' : 'Weak - 20-39' },
        { grade: 'D', color: '#888', bar: 12, label: ar ? 'مبتدئ - أقل من 20' : 'Beginner - under 20' },
        { grade: '—', color: '#444', bar: 4, label: ar ? 'لم تُدرَّب بعد' : 'Not trained yet' }
      ];
      const gradeRows = grades.map(g => `
        <div class="gc-score-row" style="background:color-mix(in srgb,${g.color} 5%,var(--bg3))">
          <div class="gc-score-grade" style="color:${g.color}">${g.grade}</div>
          <div class="gc-score-bar-wrap"><div class="gc-score-bar" style="width:${g.bar}%;background:${g.color}"></div></div>
          <div class="gc-score-label" style="color:${g.color}">${g.label}</div>
        </div>`).join('');

      const balTitle = ar ? 'كيف يُحسَب ميزان العضلات' : 'How Muscle Balance is Calculated';
      const balItems = ar ? [
        { icon: '📊', title: '50% - التغطية', desc: 'كم عضلة من أصل 9 قمت بتدريبها؟ تدريب كل المجموعات العضلية يرفع هذه النسبة.' },
        { icon: '⚡', title: '50% - متوسط التكرار', desc: 'مقارنة تكرار كل عضلة بالعضلة الأكثر تدريبًا. العضلة ذات 0 جلسات تسحب الدرجة للأسفل.' },
        { icon: '⚖️', title: 'خصم - العضلات المتعاكسة', desc: 'العضلات المتعاكسة (صدر/ظهر، بايسبس/ترايسبس، أرجل/أردان) يجب تدريبها بتوازن. التفاوت الكبير يخصم من الدرجة.' }
      ] : [
        { icon: '📊', title: '50% - Coverage', desc: 'How many of the 9 muscle groups have you trained? Training all groups maximises this component.' },
        { icon: '⚡', title: '50% - Frequency Average', desc: 'Each muscle\'s training frequency compared to your most-trained muscle. Zero-session muscles drag the score down.' },
        { icon: '⚖️', title: 'Penalty - Antagonist Pairs', desc: 'Opposing muscles (Chest/Back, Biceps/Triceps, Legs/Glutes) should be trained equally. Large imbalances deduct points from your score.' }
      ];
      const balHtml = balItems.map(b => `
        <div class="gc-info-card" style="background:var(--bg3);border-color:var(--border)">
          <div class="gc-info-icon">${b.icon}</div>
          <div class="gc-info-body">
            <div class="gc-info-title" style="color:var(--text)">${b.title}</div>
            <div class="gc-info-desc">${b.desc}</div>
          </div>
        </div>`).join('');

      const lvlTitle = ar ? 'مستويات فورج - 15 رتبة' : 'FORGE Ranks - 15 Levels';
      const LEVELS_DISPLAY = [
        { icon: '🌱', name: ar ? 'مبتدئ' : 'NEWCOMER', xp: '0', color: '#4a6a4e' },
        { icon: '🔰', name: ar ? 'متدرب' : 'ROOKIE', xp: '150', color: '#5a8a5e' },
        { icon: '🔩', name: ar ? 'حديد' : 'IRON', xp: '400', color: '#7f8c8d' },
        { icon: '🥉', name: ar ? 'برونز' : 'BRONZE', xp: '800', color: '#cd7f32' },
        { icon: '🥈', name: ar ? 'فضة' : 'SILVER', xp: '1,500', color: '#bdc3c7' },
        { icon: '🥇', name: ar ? 'ذهب' : 'GOLD', xp: '2,500', color: '#f39c12' },
        { icon: '💎', name: ar ? 'بلاتين' : 'PLATINUM', xp: '4,000', color: '#1abc9c' },
        { icon: '💠', name: ar ? 'ألماس' : 'DIAMOND', xp: '6,500', color: '#3498db' },
        { icon: '🌑', name: ar ? 'أوبسيديان' : 'OBSIDIAN', xp: '10,000', color: '#8e44ad' },
        { icon: '⚡', name: ar ? 'تيتان' : 'TITAN', xp: '15,000', color: '#9b59b6' },
        { icon: '⚔️', name: ar ? 'سيد الحرب' : 'WARLORD', xp: '22,000', color: '#e74c3c' },
        { icon: '🔥', name: ar ? 'ماستر' : 'MASTER', xp: '32,000', color: '#ff6b35' },
        { icon: '👁️', name: ar ? 'غراند ماستر' : 'GRANDMASTER', xp: '45,000', color: '#ff3366' },
        { icon: '♾️', name: ar ? 'خالد' : 'IMMORTAL', xp: '65,000', color: '#ff0080' },
        { icon: '👑', name: ar ? 'أسطورة' : 'LEGEND', xp: '90,000', color: '#ffd700' }
      ];
      const levelRows = LEVELS_DISPLAY.map(l => `
        <div class="gc-level-row">
          <div class="gc-level-icon">${l.icon}</div>
          <div class="gc-level-name" style="color:${l.color}">${l.name}</div>
          <div class="gc-level-xp">${l.xp} XP</div>
        </div>`).join('');

      return `
        ${header}
        <div style="padding:0 14px 6px;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;color:var(--text3)">${xpTitle.toUpperCase()}</div>
        <div class="gc-xp-pills">${xpPills}</div>
        <div style="padding:0 14px 6px;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;color:var(--text3)">${gradeTitle.toUpperCase()}</div>
        <div class="gc-score-table">${gradeRows}</div>
        <div style="padding:0 14px 6px;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;color:var(--text3)">${balTitle.toUpperCase()}</div>
        <div class="gc-info-cards">${balHtml}</div>
        <div style="padding:0 14px 6px;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;color:var(--text3)">${lvlTitle.toUpperCase()}</div>
        <div class="gc-levels">${levelRows}</div>`;
    },

    // FEATURES
    features: () => {
      const header = ar
        ? '<div class="gc-chapter"><div class="gc-chapter-title">كل مميزات التطبيق ✨</div><div class="gc-chapter-sub">دليل سريع لكل ما يمكنك فعله</div></div>'
        : '<div class="gc-chapter"><div class="gc-chapter-title">All App Features ✨</div><div class="gc-chapter-sub">A quick reference for everything you can do</div></div>';

      const features = ar ? [
        { icon: '🗺️', color: '#39ff8f', title: 'خريطة الجسم', desc: 'اضغط على عضلة لاختيارها وعرض تاريخ تدريبها والتمارين المقترحة.' },
        { icon: '🤖', color: '#60a5fa', title: 'مدرب الذكاء الاصطناعي', desc: 'تحليل تدريبك، توصيات الحمولة التدريجية، التغذية، وخطة أسبوعية مقترحة.' },
        { icon: '🎯', color: '#f97316', title: 'مهمة اليوم', desc: 'أهداف يومية محسوبة بناءً على مستوى تجربتك. أتمّها لكسب XP إضافي.' },
        { icon: '🔥', color: '#e74c3c', title: 'السلسلة اليومية', desc: 'تدرّب كل يوم لإبقاء سلسلتك. كل يوم يضيف 5 XP ويُظهر إحصائيات تراكمية.' },
        { icon: '📡', color: '#c084fc', title: 'الرادار العضلي', desc: 'مخطط رادار يعرض تردد التدريب والقوة القصوى لكل عضلة دفعة واحدة.' },
        { icon: '📤', color: '#38bdf8', title: 'التصدير الكامل', desc: 'صدّر جميع بياناتك (تمارين، تكوين جسم، أرقام قياسية) ملف CSV منظّم بالتصنيف.' },
        { icon: '🌙', color: '#8b5cf6', title: 'الوضع الليلي والنهاري', desc: 'بدّل بين السمة الداكنة (افتراضية) والسمة الدافئة في الإعدادات.' },
        { icon: '🌐', color: '#f39c12', title: 'ثنائي اللغة', desc: 'التطبيق بالكامل قابل للتحويل بين العربية والإنجليزية. الضغط على EN/AR في الأعلى.' },
        { icon: '📴', color: '#4a6a4e', title: 'يعمل بدون إنترنت', desc: 'كل البيانات محفوظة محليًا. يعمل في الصالة بدون أي اتصال إنترنت.' },
        { icon: '📲', color: '#39ff8f', title: 'تثبيت كتطبيق', desc: 'أضفه لشاشتك الرئيسية من المتصفح. يعمل مثل تطبيق أصلي على Android وiPhone.' }
      ] : [
        { icon: '🗺️', color: '#39ff8f', title: 'Interactive Body Map', desc: 'Tap any muscle to select it, view training history for that muscle, and see suggested exercises.' },
        { icon: '🤖', color: '#60a5fa', title: 'AI Forge Coach', desc: 'Analyses your training, gives progressive overload tips, nutrition estimates, and suggests a weekly plan.' },
        { icon: '🎯', color: '#f97316', title: 'Today\'s Mission', desc: 'Daily goals calculated from your experience level. Complete them to earn bonus XP.' },
        { icon: '🔥', color: '#e74c3c', title: 'Daily Streak', desc: 'Train every day to keep your streak alive. Each streak day earns +5 XP and tracks cumulative stats.' },
        { icon: '📡', color: '#c084fc', title: 'Muscle Radar Chart', desc: 'A radar chart that shows frequency AND max strength for all 9 muscles simultaneously at a glance.' },
        { icon: '📤', color: '#38bdf8', title: 'Full Data Export', desc: 'Export all your data (workouts, body comp, PRs) as a fully categorised and structured CSV file.' },
        { icon: '🌙', color: '#8b5cf6', title: 'Dark & Light Theme', desc: 'Toggle between the default dark theme and a warm solar theme in Settings.' },
        { icon: '🌐', color: '#f39c12', title: 'Bilingual App', desc: 'The entire app switches between English and Arabic. Tap EN/AR in the top right of the Log tab.' },
        { icon: '📴', color: '#4a6a4e', title: '100% Offline', desc: 'All data stored locally. Works in the gym with zero internet. No account needed - ever.' },
        { icon: '📲', color: '#39ff8f', title: 'Install as App', desc: 'Add to your home screen from the browser. Works like a native app on both Android and iPhone.' }
      ];

      const grid = features.map(f => `
        <div class="gc-feature-card" style="--gf-color:${f.color}">
          <div class="gc-feature-icon">${f.icon}</div>
          <div class="gc-feature-title" style="color:${f.color}">${f.title}</div>
          <div class="gc-feature-desc">${f.desc}</div>
        </div>`).join('');

      const tips = ar ? [
        { icon: '💡', text: 'اضغط مطولًا على أي قسم في السجل لتغيير ترتيبه (وضع التحرير).' },
        { icon: '📅', text: 'في تبويب السجل، اسحب لرؤية التقويم وفلترة التدريبات حسب اليوم.' },
        { icon: '🎯', text: 'بطاقات الرأس (الوزن، الدهون، العضلات) قابلة للضغط لتسجيل سريع.' },
        { icon: '🔔', text: 'صوت واهتزاز عند انتهاء مؤقت الراحة - يمكن تعطيله من الإعدادات.' }
      ] : [
        { icon: '💡', text: 'Long-press any section in the Log tab to drag and reorder it (Edit Layout mode).' },
        { icon: '📅', text: 'In the History tab, use the calendar to filter workouts by a specific day.' },
        { icon: '🎯', text: 'The three header cards (Weight, BF%, Muscle) support quick tap-to-log.' },
        { icon: '🔔', text: 'Rest timer plays a sound and vibrates on completion - disable in Settings.' }
      ];
      const tipsHtml = tips.map(tip => `
        <div class="gc-step" style="--gs-color:#f39c12">
          <div class="gc-step-emoji">${tip.icon}</div>
          <div class="gc-step-body"><div class="gc-step-desc">${tip.text}</div></div>
        </div>`).join('');

      const tipsLabel = ar ? 'نصائح سريعة' : 'QUICK TIPS';

      return `
        ${header}
        <div class="gc-feature-grid">${grid}</div>
        <div style="padding:0 14px 6px;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;color:var(--text3)">${tipsLabel}</div>
        <div class="gc-steps">${tipsHtml}</div>`;
    }
  };

  const fn = CHAPTERS[_guideTab] || CHAPTERS.start;
  el.innerHTML = `<div dir="${dir}">${fn()}</div>`;
}

function renderCompCards() {
  if (!bodyWeight.length) return;
  const last = bodyWeight[bodyWeight.length - 1];
  const prev = bodyWeight.length > 1 ? bodyWeight[bodyWeight.length - 2] : null;

  // Body weight
  const bwVal = document.getElementById('comp-bw-val');
  const bwTrend = document.getElementById('comp-bw-trend');
  if (bwVal) bwVal.textContent = last.weight + ' ' + last.unit;
  if (bwTrend && prev) {
    const diff = (last.weight - prev.weight).toFixed(1);
    bwTrend.textContent = diff > 0 ? '+' + diff : diff;
    bwTrend.style.color = diff > 0 ? 'var(--warn)' : 'var(--green)';
  }

  // Body fat
  const bfVal = document.getElementById('comp-bf-val');
  const bfTrend = document.getElementById('comp-bf-trend');
  const lastBF = [...bodyWeight].reverse().find(d => d.bodyFat);
  const prevBF = bodyWeight.slice(0, -1).reverse().find(d => d.bodyFat);
  if (bfVal) bfVal.textContent = lastBF ? lastBF.bodyFat + '%' : '—';
  if (bfTrend && lastBF && prevBF) {
    const diff = (lastBF.bodyFat - prevBF.bodyFat).toFixed(1);
    bfTrend.textContent = diff > 0 ? '+' + diff + '%' : diff + '%';
    bfTrend.style.color = diff > 0 ? 'var(--danger)' : 'var(--green)';
  }

  // Muscle mass
  const mmVal = document.getElementById('comp-mm-val');
  const mmTrend = document.getElementById('comp-mm-trend');
  const lastMM = [...bodyWeight].reverse().find(d => d.muscleMass);
  const prevMM = bodyWeight.slice(0, -1).reverse().find(d => d.muscleMass);
  if (mmVal) mmVal.textContent = lastMM ? lastMM.muscleMass + ' kg' : '—';
  if (mmTrend && lastMM && prevMM) {
    const diff = (lastMM.muscleMass - prevMM.muscleMass).toFixed(1);
    mmTrend.textContent = diff > 0 ? '+' + diff + ' kg' : diff + ' kg';
    mmTrend.style.color = diff > 0 ? 'var(--green)' : 'var(--text3)';
  }
}
