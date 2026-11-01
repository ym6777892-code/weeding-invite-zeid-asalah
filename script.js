/* ==========================================================================
   Shihab & Reem — wedding invitation
   1) Edit weddingData below. 2) Everything else works automatically.
   ========================================================================== */

const weddingData = {
  groomName: "شهاب",
  groomNameEn: "Shihab",
  brideName: "ريم",
  brideNameEn: "Reem",
  weddingDate: "12-12",          // DD-MM
  weddingYear: "",               // e.g. "2026" — the countdown stays hidden until a valid year is set
  weddingTime: "19:00",          // 24-hour HH:MM
  venueName: "",
  venueAddress: "",
  mapsLink: "https://maps.app.goo.gl/YDZcnXSLyyPjGtWY9?g_st=iw",
  musicFile: "./MP3.mp3",        // the <audio> tag in index.html points to the same file

  defaultLanguage: "ar",         // "ar" or "en"

  // Editable texts (Arabic / English)
  announcementAr: "يتشرفان بدعوتكم لحضور حفل زفافهما",
  announcementEn: "invite you to celebrate their wedding",
  messageAr: "بقلوبٍ يملؤها الفرح، يسعدنا أن تشاركونا أجمل لحظات العمر، وأن تكونوا معنا في ليلةٍ نحتفل فيها ببداية حياتنا معًا.",
  messageEn: "With hearts full of joy, we would love for you to share the most beautiful moments of our lives and celebrate the beginning of our life together."
};

(function () {
  'use strict';

  var D = weddingData;
  window.__inviteReady = true;

  /* ---------- Interface strings ---------- */
  var I18N = {
    ar: {
      open: 'افتح الدعوة', heroEyebrow: 'حفل زفاف', saveTheDate: 'موعد الحفل',
      days: 'أيام', hours: 'ساعات', minutes: 'دقائق', seconds: 'ثوانٍ',
      venue: 'موقع الحفل', directions: 'احصل على الاتجاهات',
      hint: 'افتح الموقع على الخريطة للوصول إلينا.',
      love: 'بكل حب', musicOn: 'الموسيقى: تعمل', musicOff: 'الموسيقى: متوقفة',
      musicAriaOn: 'إيقاف الموسيقى', musicAriaOff: 'تشغيل الموسيقى', pageTitle: 'دعوة زفاف'
    },
    en: {
      open: 'Open Invitation', heroEyebrow: 'The Wedding of', saveTheDate: 'Save the Date',
      days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds',
      venue: 'The Location', directions: 'Get Directions',
      hint: 'Open the map to find your way to us.',
      love: 'With love', musicOn: 'Music: On', musicOff: 'Music: Off',
      musicAriaOn: 'Pause music', musicAriaOff: 'Play music', pageTitle: 'Wedding Invitation'
    }
  };

  var lang = 'ar';
  var countdownTimer = null;
  var audio = null;
  var playing = false;
  var musicOK = true;
  var resumeOnVisible = false;
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function t(k) { return I18N[lang][k] || ''; }
  function other(l) { return l === 'ar' ? 'en' : 'ar'; }
  function setLangText(el, txt, l) { el.textContent = txt; el.lang = l; el.dir = l === 'ar' ? 'rtl' : 'ltr'; }
  function nm(l) {
    return l === 'ar' ? { g: D.groomName, b: D.brideName } : { g: D.groomNameEn, b: D.brideNameEn };
  }

  /* ---------- Date helpers ---------- */
  function parseDay() {
    var m = /^(\d{1,2})-(\d{1,2})$/.exec(String(D.weddingDate || '').trim());
    if (!m) return null;
    var day = +m[1], mon = +m[2];
    return (mon >= 1 && mon <= 12 && day >= 1 && day <= 31) ? { day: day, mon: mon } : null;
  }
  function parseTime() {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(D.weddingTime || '').trim());
    if (!m) return null;
    var h = +m[1], mi = +m[2];
    return (h <= 23 && mi <= 59) ? { h: h, mi: mi } : null;
  }
  function validYear() {
    var y = String(D.weddingYear || '').trim();
    return /^\d{4}$/.test(y) ? +y : null;
  }
  function nf(l, n, pad) {
    return new Intl.NumberFormat(l === 'ar' ? 'ar-EG' : 'en-US', { useGrouping: false, minimumIntegerDigits: pad || 1 }).format(n);
  }
  function monthName(l, mon) {
    return new Intl.DateTimeFormat(l === 'ar' ? 'ar-EG-u-ca-gregory' : 'en-US', { month: 'long' }).format(new Date(2000, mon - 1, 1));
  }
  function fmtTime(l, tm, short) {
    var h12 = tm.h % 12 || 12;
    var pm = tm.h >= 12;
    if (l === 'ar') {
      var suf = pm ? 'مساءً' : 'صباحًا';
      return (short && tm.mi === 0) ? nf(l, h12) + ' ' + suf : nf(l, h12) + ':' + nf(l, tm.mi, 2) + ' ' + suf;
    }
    var s = pm ? 'PM' : 'AM';
    return (short && tm.mi === 0) ? h12 + ' ' + s : h12 + ':' + (tm.mi < 10 ? '0' : '') + tm.mi + ' ' + s;
  }
  function dateMain(l, d, y) { return nf(l, d.day) + ' ' + monthName(l, d.mon) + (y ? ' ' + nf(l, y) : ''); }
  function dateSub(l, d, y) { return nf(l, d.day) + '/' + nf(l, d.mon) + (y ? '/' + nf(l, y) : ''); }

  function targetDate() {
    var d = parseDay(), tm = parseTime(), y = validYear();
    if (!d || !y) return null;
    var dt = new Date(y, d.mon - 1, d.day, tm ? tm.h : 0, tm ? tm.mi : 0);
    return (dt.getMonth() === d.mon - 1 && dt.getDate() === d.day) ? dt : null;
  }

  /* ---------- Countdown ---------- */
  function stopCountdown() { if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; } }

  function startCountdown(target) {
    stopCountdown();
    var box = $('#countdown');
    var nodes = {};
    $$('.cd-num', box).forEach(function (n) { nodes[n.getAttribute('data-unit')] = n; });

    function tick() {
      var diff = target.getTime() - Date.now();
      if (diff <= 0) { box.hidden = true; stopCountdown(); return; }
      var s = Math.floor(diff / 1000);
      var vals = { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
      Object.keys(vals).forEach(function (k) {
        var out = nf(lang, vals[k], 2);
        if (nodes[k].textContent !== out) {
          nodes[k].textContent = out;
          if (!reduced && k === 'seconds') {
            nodes[k].classList.remove('tick'); void nodes[k].offsetWidth; nodes[k].classList.add('tick');
          }
        }
      });
      box.hidden = false;
    }
    tick();
    if (!box.hidden) countdownTimer = setInterval(tick, 1000);
  }

  /* ---------- Render all text for the current language ---------- */
  function render() {
    var L = lang, O = other(L), n = nm(L), o = nm(O);
    var d = parseDay(), tm = parseTime(), y = validYear();

    document.title = n.g + ' & ' + n.b + ' — ' + t('pageTitle');
    $$('[data-t]').forEach(function (el) { el.textContent = t(el.getAttribute('data-t')); });
    $('#openBtn').textContent = t('open');

    // Cover
    setLangText($('#coverMain'), n.g + ' & ' + n.b, L);
    setLangText($('#coverAlt'), o.g + ' & ' + o.b, O);
    $('#coverAnnounce').textContent = L === 'ar' ? D.announcementAr : D.announcementEn;
    var cd = $('#coverDate');
    cd.textContent = d ? dateMain(L, d, y) : '';
    cd.hidden = !d;

    // Hero
    var g = $('#groom'), b = $('#bride');
    g.textContent = n.g; g.lang = L;
    b.textContent = n.b; b.lang = L;
    $('#names').setAttribute('aria-label', n.g + ' & ' + n.b);
    setLangText($('#heroAlt'), o.g + ' & ' + o.b, O);
    $('#message').textContent = L === 'ar' ? D.messageAr : D.messageEn;
    $('#message').lang = L;

    // Date + time (shown in both languages: main in current, small line in the other)
    var dm = $('#dateMain'), ds = $('#dateSub'), tmn = $('#timeMain'), tms = $('#timeSub');
    if (d) {
      setLangText(dm, dateMain(L, d, y), L);
      setLangText(ds, dateSub(L, d, y), L); ds.dir = 'ltr';
    }
    dm.hidden = ds.hidden = !d;
    if (tm) {
      setLangText(tmn, fmtTime(L, tm, false), L);
      setLangText(tms, fmtTime(O, tm, true), O);
    }
    tmn.hidden = tms.hidden = !tm;
    $('#date').hidden = !(d || tm);

    // Countdown (hidden until a valid year is configured)
    var target = targetDate();
    if (target && target.getTime() > Date.now()) startCountdown(target);
    else { stopCountdown(); $('#countdown').hidden = true; }

    // Venue
    var vName = String(D.venueName || '').trim(), vAddr = String(D.venueAddress || '').trim();
    var map = /^https?:\/\//i.test(String(D.mapsLink || '').trim()) ? String(D.mapsLink).trim() : '';
    $('#venueName').textContent = vName; $('#venueName').hidden = !vName;
    $('#venueAddress').textContent = vAddr; $('#venueAddress').hidden = !vAddr;
    $('#venueHint').hidden = !!(vName || vAddr) || !map;
    var dir = $('#directions');
    if (map) { dir.href = map; dir.textContent = t('directions'); } else { dir.removeAttribute('href'); }
    dir.hidden = !map;
    $('#venue').hidden = !(vName || vAddr || map);

    // Footer
    setLangText($('#footNames'), n.g + ' & ' + n.b, L);
    setLangText($('#footAlt'), o.g + ' & ' + o.b, O);
    var fd = $('#footDate');
    fd.textContent = d ? nf(L, d.day) + ' · ' + nf(L, d.mon) + (y ? ' · ' + nf(L, y) : '') : '';
    fd.hidden = !d;

    updateMusicUI();
  }

  function applyLang(l) {
    lang = l;
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    $$('#langSwitch button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === l)); });
    render();
  }

  function initialLang() {
    var saved = '';
    try { saved = localStorage.getItem('sr-lang') || ''; } catch (e) {}
    if (saved === 'ar' || saved === 'en') return saved;
    return D.defaultLanguage === 'en' ? 'en' : 'ar';
  }

  /* ---------- Falling petals (canvas, pre-rendered sprites) ---------- */
  var Petals = (function () {
    var canvas = $('#petals');
    var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return { start: function () {}, burst: function () {} };

    var W = 0, H = 0, dpr = 1, sprites = [], list = [], raf = 0, last = 0;
    var PALETTE = [
      ['#F9E0E0', '#E8B4B6'], ['#FBF1EA', '#EBD9CB'], ['#F1E2D0', '#D8C4AD'],
      ['#E9BDBD', '#C99B9B'], ['#F6D4D6', '#DDAAAE'], ['#FDF7F1', '#E8D8C3']
    ];
    var SHAPE = 'M50 12C58 4 70 6 80 18C94 36 92 66 76 86C66 98 56 100 50 98C44 100 34 98 24 86C8 66 6 36 20 18C30 6 42 4 50 12Z';

    function rnd(a, b) { return a + Math.random() * (b - a); }

    function makeSprite(light, dark, narrow) {
      var c = document.createElement('canvas');
      c.width = c.height = Math.round(64 * dpr);
      var g = c.getContext('2d');
      g.scale(c.width / 100, c.height / 100);
      if (narrow) { g.translate(50, 50); g.scale(0.78, 1); g.translate(-50, -50); }
      var path = new Path2D(SHAPE);
      var grad = g.createRadialGradient(50, 36, 4, 50, 62, 58);
      grad.addColorStop(0, light); grad.addColorStop(1, dark);
      g.fillStyle = grad; g.fill(path);
      g.strokeStyle = 'rgba(130,70,78,.15)'; g.lineWidth = 0.9;
      [-26, -13, 0, 13, 26].forEach(function (x) {
        g.beginPath(); g.moveTo(50, 96); g.quadraticCurveTo(50 + x * 0.5, 60, 50 + x, 22 + Math.abs(x) * 0.4); g.stroke();
      });
      g.strokeStyle = 'rgba(130,70,78,.2)'; g.lineWidth = 1.2; g.stroke(path);
      g.fillStyle = 'rgba(255,255,255,.3)';
      g.beginPath(); g.ellipse(40, 32, 14, 7, -0.6, 0, 7); g.fill();
      return c;
    }

    function buildSprites() {
      sprites = [];
      PALETTE.forEach(function (p) { sprites.push(makeSprite(p[0], p[1], false), makeSprite(p[0], p[1], true)); });
    }

    function spawn(p, initial) {
      var d = Math.random();
      p.sp = sprites[(Math.random() * sprites.length) | 0];
      p.size = 11 + d * 22;
      p.vt = 24 + d * 44;                 // terminal fall speed, px/s
      p.vy = p.vt;
      p.bx = rnd(-20, W + 20);
      p.vx = rnd(-8, 8) + 4;              // gentle drift
      p.amp = rnd(14, 38);
      p.phase = rnd(0, 6.28);
      p.sw = rnd(0.6, 1.5);
      p.rot = rnd(0, 6.28);
      p.vr = rnd(-1.1, 1.1);
      p.flip = rnd(0, 6.28);
      p.vf = rnd(1.2, 3.2);
      p.alpha = 0.55 + d * 0.4;
      p.y = initial ? rnd(-H * 0.1, H) : -p.size * 2;
      p.temp = false;
      return p;
    }

    function target() { return Math.max(14, Math.min(34, Math.round(W * H / 26000))); }

    function resize() {
      var nd = Math.min(window.devicePixelRatio || 1, 2);
      var changed = nd !== dpr || !sprites.length;
      dpr = nd;
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      if (changed) buildSprites();
      var want = target(), keep = list.filter(function (p) { return p.temp; });
      list = list.filter(function (p) { return !p.temp; });
      while (list.length < want) list.push(spawn({}, true));
      if (list.length > want) list.length = want;
      list = list.concat(keep);
      if (reduced) drawStatic();
    }

    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        var sx = 0.28 + 0.72 * Math.abs(Math.cos(p.flip));
        var cs = Math.cos(p.rot), sn = Math.sin(p.rot);
        var x = p.bx + Math.sin(p.phase) * p.amp;
        ctx.setTransform(dpr * cs * sx, dpr * sn * sx, -dpr * sn, dpr * cs, x * dpr, p.y * dpr);
        ctx.globalAlpha = p.alpha * (0.78 + 0.22 * sx);
        ctx.drawImage(p.sp, -p.size / 2, -p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;
    }

    function drawStatic() {
      list.forEach(function (p, i) { p.y = ((i + 0.5) / list.length) * H; p.rot = i * 1.3; p.flip = i * 0.9; });
      draw();
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      for (var i = list.length - 1; i >= 0; i--) {
        var p = list[i];
        p.vy += (p.vt - p.vy) * Math.min(1, 1.6 * dt);
        p.y += p.vy * dt;
        p.bx += p.vx * dt;
        p.phase += p.sw * dt;
        p.rot += p.vr * dt;
        p.flip += p.vf * dt;
        if (p.y > H + p.size * 2) {
          if (p.temp) list.splice(i, 1); else spawn(p, false);
        }
      }
      draw();
    }

    function run() { if (!raf && !reduced) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function halt() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    return {
      start: function () {
        resize();
        window.addEventListener('resize', resize);
        document.addEventListener('visibilitychange', function () { document.hidden ? halt() : run(); });
        run();
      },
      // a handful of petals tossed up from the middle when the invitation opens
      burst: function (n) {
        if (reduced) return;
        for (var i = 0; i < n; i++) {
          var p = spawn({}, false);
          p.temp = true;
          p.bx = W / 2 + rnd(-40, 40);
          p.y = H * 0.5 + rnd(-30, 30);
          p.vx = rnd(-90, 90);
          p.vy = -rnd(120, 300);
          p.size = 14 + Math.random() * 16;
          p.alpha = 0.85;
          list.push(p);
        }
      }
    };
  })();

  /* ---------- Music (never autoplays; failures never break the page) ---------- */
  function updateMusicUI() {
    var b = $('#musicBtn');
    if (!b) return;
    b.classList.toggle('is-playing', playing);
    b.setAttribute('aria-pressed', String(playing));
    b.setAttribute('aria-label', playing ? t('musicAriaOn') : t('musicAriaOff'));
    $('#musicText').textContent = playing ? t('musicOn') : t('musicOff');
  }

  function disableMusic() {
    musicOK = false; playing = false;
    var b = $('#musicBtn'); if (b) b.hidden = true;
  }

  function startMusic() {
    if (!audio || !musicOK) return;
    try {
      var p = audio.play();
      if (p && p.then) {
        p.then(function () { playing = true; updateMusicUI(); },
               function (err) {
                 if (err && (err.name === 'NotSupportedError' || err.name === 'AbortError' && audio.error)) disableMusic();
                 else { playing = false; updateMusicUI(); }   // blocked by browser: visitor can tap the button
               });
      } else { playing = true; updateMusicUI(); }
    } catch (e) { disableMusic(); }
  }

  function setupMusic() {
    audio = $('#backgroundMusic');
    if (!audio || !String(D.musicFile || '').trim()) { disableMusic(); return; }
    audio.volume = 0.6;
    audio.addEventListener('error', disableMusic);          // e.g. MP3.mp3 not uploaded yet
    $('#musicBtn').addEventListener('click', function () {
      if (!audio || !musicOK) return;
      if (playing) { audio.pause(); playing = false; updateMusicUI(); } else { startMusic(); }
    });
    document.addEventListener('visibilitychange', function () {
      if (!audio || !musicOK) return;
      if (document.hidden && playing) { audio.pause(); resumeOnVisible = true; playing = false; updateMusicUI(); }
      else if (!document.hidden && resumeOnVisible) { resumeOnVisible = false; startMusic(); }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    var els = $$('.reveal, .names');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- Opening ---------- */
  function openInvitation() {
    var cover = $('#cover'), main = $('#invitation');
    if (cover.classList.contains('is-opening')) return;

    startMusic();                                   // inside the click: allowed on iPhone and Android
    cover.classList.add('is-opening');
    Petals.burst(16);
    main.removeAttribute('inert');
    document.body.classList.remove('is-locked');
    window.scrollTo(0, 0);

    setTimeout(initReveal, reduced ? 50 : 900);
    setTimeout(function () {
      if (musicOK) $('#musicBtn').hidden = false;
      main.focus({ preventScroll: true });
    }, reduced ? 50 : 1500);
    setTimeout(function () { cover.hidden = true; }, reduced ? 100 : 2000);
  }

  /* ---------- Init ---------- */
  function init() {
    // Loader: short, and never waits longer than needed
    var minWait = new Promise(function (r) { setTimeout(r, 900); });
    var fonts = (document.fonts && document.fonts.ready)
      ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 2500); })])
      : Promise.resolve();
    Promise.all([minWait, fonts]).then(function () {
      var loader = $('#loader');
      document.body.classList.add('is-ready');
      loader.classList.add('is-done');
      setTimeout(function () { loader.remove(); }, 800);
      $('#openBtn').focus({ preventScroll: true });
    });

    applyLang(initialLang());
    setupMusic();
    Petals.start();

    $('#openBtn').addEventListener('click', openInvitation);
    $$('#langSwitch button').forEach(function (b) {
      b.addEventListener('click', function () {
        var l = b.getAttribute('data-lang');
        if (l === lang) return;
        try { localStorage.setItem('sr-lang', l); } catch (e) {}
        applyLang(l);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
