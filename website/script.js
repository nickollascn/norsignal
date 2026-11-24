// NorSignal website – small interactions (no dependencies)
(function () {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');

  // Sticky header border
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  document.querySelectorAll('.nav-links a').forEach(a =>
    a.addEventListener('click', () => header.classList.remove('open'))
  );

  // Active nav link on scroll
  const links = [...document.querySelectorAll('.nav-links a')];
  const sections = links.map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));

  // Reveal on scroll + animate bars
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll('.bar i[data-w]').forEach(b => (b.style.width = b.dataset.w + '%'));
      reveal.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 70 + 'ms';
    reveal.observe(el);
  });
  // Hero bars animate right away
  requestAnimationFrame(() => requestAnimationFrame(() =>
    document.querySelectorAll('.hero .bar i[data-w]').forEach(b => (b.style.width = b.dataset.w + '%'))
  ));

  // Comparison dots
  document.querySelectorAll('.dots[data-n]').forEach(d => {
    const n = +d.dataset.n;
    d.innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
    d.setAttribute('aria-label', `${n} ud af 5`);
  });

  // Product tabs (feature list <-> mock portal)
  const features = document.querySelectorAll('.feature');
  const sideLinks = document.querySelectorAll('.mock-side a');
  let auto;
  function showPane(name) {
    features.forEach(f => f.classList.toggle('active', f.dataset.pane === name));
    sideLinks.forEach(a => a.classList.toggle('on', a.dataset.pane === name));
    document.querySelectorAll('.mock-pane').forEach(p => p.classList.toggle('on', p.id === 'pane-' + name));
  }
  const order = ['dash', 'report', 'expo', 'analyst'];
  function startAuto() {
    clearInterval(auto);
    auto = setInterval(() => {
      const cur = document.querySelector('.feature.active').dataset.pane;
      showPane(order[(order.indexOf(cur) + 1) % order.length]);
    }, 6000);
  }
  features.forEach(f => {
    f.addEventListener('click', () => { showPane(f.dataset.pane); startAuto(); });
    f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showPane(f.dataset.pane); startAuto(); } });
  });
  sideLinks.forEach(a => a.addEventListener('click', e => { e.preventDefault(); showPane(a.dataset.pane); startAuto(); }));
  startAuto();

  // Pricing buttons pre-select plan in the demo form
  document.querySelectorAll('[data-plan]').forEach(btn =>
    btn.addEventListener('click', () => { document.getElementById('f-plan').value = btn.dataset.plan; })
  );

  // Demo form (mock submit)
  const demoForm = document.getElementById('demo-form');
  demoForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!demoForm.checkValidity()) { demoForm.reportValidity(); return; }
    demoForm.style.display = 'none';
    document.getElementById('demo-success').classList.add('show');
  });

  // Download form (mock submit)
  const dl = document.getElementById('download-form');
  dl.addEventListener('submit', e => {
    e.preventDefault();
    const email = dl.querySelector('input').value;
    dl.style.display = 'none';
    document.getElementById('download-note').innerHTML =
      `<strong style="color:#331E39;font-size:16px">Tak. Rapporten er på vej til ${email.replace(/[<>&"]/g, '')}.</strong>`;
  });
})();
