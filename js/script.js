/* ==========================================================================
   Lucas Cruz — Portfólio | script.js
   JavaScript Vanilla, sem dependências.

   Sumário:
   1. Configuração (edite aqui!)
   2. Utilitários
   3. Navbar (scroll, menu mobile, seção ativa)
   4. Animações de entrada e progresso
   5. Interações da hero (spotlight + parallax)
   6. Cards de tecnologia (brilho que segue o mouse)
   7. Projetos via API do GitHub (filtros, busca, fallback)
   8. Inicialização
   ========================================================================== */

(() => {
  'use strict';

  /* 1. CONFIGURAÇÃO ======================================================== */
  const CONFIG = {
    githubUser: 'lucasrcruz7',

    // Quantos cards aparecem antes do botão "Mostrar mais"
    pageSize: 6,

    // Repositórios que NÃO devem aparecer (ex.: o README de perfil, testes, forks antigos)
    excludeRepos: ['lucasrcruz7'],

    // Mostrar forks? (false = apenas projetos próprios)
    includeForks: false,

    // Repositórios em destaque aparecem primeiro, na ordem desta lista.
    // Ex.: ['meu-projeto-top', 'api-node']
    featuredRepos: [],

    // Tempo de cache local da resposta da API (evita o limite de 60 req/h do GitHub)
    cacheMinutes: 30,

    /*
     * PROJETOS MANUAIS
     * Use para exibir projetos que não estão no GitHub (ou para complementar a lista).
     * Eles aparecem sempre, antes dos repositórios da API.
     *
     * Exemplo:
     * {
     *   name: 'Nome do Projeto',
     *   description: 'O que ele faz e qual problema resolve.',
     *   language: 'TypeScript',
     *   topics: ['react', 'api'],
     *   repoUrl: 'https://github.com/lucasrcruz7/nome-do-repo',
     *   liveUrl: 'https://meu-projeto.vercel.app', // opcional
     * }
     */
    manualProjects: [],

    /*
     * FALLBACK — exibido SOMENTE se a API do GitHub falhar e não houver projetos manuais.
     * São espaços reservados (não são projetos reais). Substitua pelos seus projetos
     * reais ou preencha "manualProjects" acima.
     */
    fallbackProjects: [
      {
        name: 'Seu projeto aqui',
        description: 'Espaço reservado. Edite CONFIG.fallbackProjects em js/script.js para exibir um projeto real.',
        language: 'JavaScript',
        topics: ['exemplo'],
        repoUrl: 'https://github.com/lucasrcruz7',
        placeholder: true,
      },
      {
        name: 'Outro projeto',
        description: 'Espaço reservado para um projeto com nome, descrição, tecnologias e links.',
        language: 'TypeScript',
        topics: ['exemplo'],
        repoUrl: 'https://github.com/lucasrcruz7',
        placeholder: true,
      },
      {
        name: 'Mais um projeto',
        description: 'Espaço reservado. Enquanto isso, todos os repositórios estão disponíveis no GitHub.',
        language: 'Java',
        topics: ['exemplo'],
        repoUrl: 'https://github.com/lucasrcruz7',
        placeholder: true,
      },
    ],
  };

  // Cores das linguagens (inspiradas nas cores do GitHub Linguist)
  const LANG_COLORS = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    PHP: '#4F5D95',
    Java: '#b07219',
    'C#': '#178600',
    HTML: '#e34c26',
    CSS: '#663399',
    SCSS: '#c6538c',
    Python: '#3572A5',
    'C++': '#f34b7d',
    C: '#555555',
    Go: '#00ADD8',
    Kotlin: '#A97BFF',
    Dart: '#00B4AB',
    Shell: '#89e051',
    Vue: '#41b883',
    Blade: '#f7523f',
    Hack: '#878787',
    'Jupyter Notebook': '#DA5B0B',
  };
  const DEFAULT_LANG_COLOR = '#E50914';

  /* 2. UTILITÁRIOS ========================================================= */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  /** Escapa texto vindo da API antes de inserir no HTML (evita XSS). */
  const escapeHTML = (str = '') =>
    String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** Aceita apenas URLs http(s) — protege contra "javascript:" em homepages. */
  const safeURL = (url) => {
    try {
      const u = new URL(url);
      return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
    } catch {
      return null;
    }
  };

  /** "meu-projeto_api" / "meuProjeto" -> "Meu Projeto Api" / "Meu Projeto" */
  const prettifyName = (name) =>
    name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[-_.]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase());

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(new Date(iso)).replace('.', '');
    } catch {
      return '';
    }
  };

  const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;

  /** Limita a frequência de execução usando requestAnimationFrame. */
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        fn(...args);
        ticking = false;
      });
    };
  };

  /* 3. NAVBAR ============================================================== */
  function initNavbar() {
    const navbar = $('#navbar');
    const toggle = $('#menu-toggle');
    const menu = $('#nav-menu');
    const links = $$('.nav-link');
    const backToTop = $('#back-to-top');
    const progress = $('.scroll-progress');

    // Índice para animação escalonada dos itens no menu mobile
    $$('li', menu).forEach((li, i) => li.style.setProperty('--n', i));

    // Navbar translúcida, barra de progresso e botão "voltar ao topo"
    const onScroll = rafThrottle(() => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      navbar.classList.toggle('is-scrolled', y > 20);
      backToTop.classList.toggle('is-visible', y > window.innerHeight * 0.8);
      progress.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Menu mobile
    const setMenu = (open) => {
      menu.classList.toggle('is-open', open);
      navbar.classList.toggle('menu-active', open);
      document.body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    };

    toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));

    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        setMenu(false);
        toggle.focus();
      }
    });

    // Fecha o menu se a tela for redimensionada para desktop
    window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => {
      if (e.matches) setMenu(false);
    });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
    });

    // Indicador da seção ativa
    const sections = links.map((l) => document.getElementById(l.dataset.section)).filter(Boolean);
    const setActive = (id) => {
      links.forEach((l) => {
        const active = l.dataset.section === id;
        l.classList.toggle('is-active', active);
        if (active) l.setAttribute('aria-current', 'true');
        else l.removeAttribute('aria-current');
      });
    };

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      // Considera "ativa" a seção que cruza a faixa central da tela
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((s) => sectionObserver.observe(s));
  }

  /* 4. ANIMAÇÕES DE ENTRADA ================================================ */
  let revealObserver;

  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal').forEach((el) => el.classList.add('is-visible'));
      return;
    }

    revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    $$('.reveal').forEach((el) => revealObserver.observe(el));
  }

  /** Linhas do editor de código aparecem uma a uma. */
  function initEditor() {
    const editor = $('.editor');
    if (!editor) return;
    $$('.ln', editor).forEach((ln, i) => ln.style.setProperty('--n', i));
    // Pequeno atraso para acompanhar a entrada da hero
    requestAnimationFrame(() => requestAnimationFrame(() => editor.classList.add('is-typed')));
  }

  /** Linha vermelha da timeline preenche conforme a rolagem. */
  function initTimeline() {
    const timeline = $('#timeline');
    if (!timeline) return;

    const update = rafThrottle(() => {
      const rect = timeline.getBoundingClientRect();
      const trigger = window.innerHeight * 0.6;
      const progress = Math.min(Math.max((trigger - rect.top) / rect.height, 0), 1);
      timeline.style.setProperty('--timeline', progress.toFixed(3));
    });

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* 5. HERO: SPOTLIGHT + PARALLAX ========================================== */
  function initHeroInteractions() {
    const hero = $('.hero');
    if (!hero || prefersReducedMotion.matches || !finePointer.matches) return;

    const layers = $$('[data-parallax]', hero);

    const onMove = rafThrottle((e) => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Spotlight segue o cursor
      hero.style.setProperty('--mx', `${x}px`);
      hero.style.setProperty('--my', `${y}px`);

      // Parallax suave: deslocamento relativo ao centro (-1 a 1)
      const dx = (x / rect.width - 0.5) * 2;
      const dy = (y / rect.height - 0.5) * 2;
      layers.forEach((el) => {
        const depth = parseFloat(el.dataset.parallax) || 1;
        el.style.setProperty('--px', `${(dx * depth * 6).toFixed(2)}px`);
        el.style.setProperty('--py', `${(dy * depth * 6).toFixed(2)}px`);
      });
    });

    hero.addEventListener('pointermove', onMove);
    hero.addEventListener('pointerleave', () => {
      layers.forEach((el) => {
        el.style.setProperty('--px', '0px');
        el.style.setProperty('--py', '0px');
      });
    });
  }

  /* 6. CARDS DE TECNOLOGIA ================================================= */
  function initTechCards() {
    if (!finePointer.matches) return;
    $$('.tech-card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* 7. PROJETOS (API DO GITHUB) ============================================ */
  const projectsState = {
    all: [],
    filter: 'all',
    query: '',
    visible: CONFIG.pageSize,
    isFallback: false,
  };

  const els = {};

  /** Converte um repositório da API para o formato interno de projeto. */
  const normalizeRepo = (repo) => ({
    name: repo.name,
    displayName: prettifyName(repo.name),
    description: repo.description,
    language: repo.language,
    topics: Array.isArray(repo.topics) ? repo.topics.slice(0, 4) : [],
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    updated: repo.pushed_at || repo.updated_at,
    repoUrl: repo.html_url,
    liveUrl: safeURL(repo.homepage),
  });

  const normalizeManual = (p) => ({
    name: p.name,
    displayName: p.name,
    description: p.description,
    language: p.language || null,
    topics: p.topics || [],
    stars: 0,
    forks: 0,
    updated: null,
    repoUrl: safeURL(p.repoUrl),
    liveUrl: safeURL(p.liveUrl),
    placeholder: Boolean(p.placeholder),
  });

  /** Busca os repositórios (com cache em sessionStorage). */
  async function fetchRepos() {
    const cacheKey = `gh-repos-${CONFIG.githubUser}`;
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
      if (cached && Date.now() - cached.time < CONFIG.cacheMinutes * 60 * 1000) return cached.data;
    } catch {
      /* cache inválido: ignora */
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(
        `https://api.github.com/users/${encodeURIComponent(CONFIG.githubUser)}/repos?per_page=100&sort=pushed`,
        { headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal }
      );

      if (!res.ok) {
        const reason =
          res.status === 403 || res.status === 429
            ? 'Limite de requisições da API do GitHub atingido. Tente novamente em alguns minutos.'
            : res.status === 404
              ? 'Usuário do GitHub não encontrado.'
              : `A API do GitHub respondeu com o status ${res.status}.`;
        throw new Error(reason);
      }

      const data = await res.json();
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ time: Date.now(), data }));
      } catch {
        /* armazenamento indisponível: segue sem cache */
      }
      return data;
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('A API do GitHub demorou para responder.');
      if (err instanceof TypeError) throw new Error('Não foi possível conectar à API do GitHub.');
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Filtra repositórios relevantes e ordena (destaques → estrelas → atualização). */
  function selectRepos(repos) {
    const exclude = CONFIG.excludeRepos.map((r) => r.toLowerCase());
    const featured = CONFIG.featuredRepos.map((r) => r.toLowerCase());

    return repos
      .filter((r) => !r.archived || featured.includes(r.name.toLowerCase()))
      .filter((r) => CONFIG.includeForks || !r.fork)
      .filter((r) => !exclude.includes(r.name.toLowerCase()))
      .sort((a, b) => {
        const fa = featured.indexOf(a.name.toLowerCase());
        const fb = featured.indexOf(b.name.toLowerCase());
        if (fa !== fb) return (fa === -1 ? Infinity : fa) - (fb === -1 ? Infinity : fb);
        if (b.stargazers_count !== a.stargazers_count) return b.stargazers_count - a.stargazers_count;
        return new Date(b.pushed_at) - new Date(a.pushed_at);
      })
      .map(normalizeRepo);
  }

  /** Monta o HTML de um card de projeto. */
  function projectCard(p, index) {
    const color = LANG_COLORS[p.language] || DEFAULT_LANG_COLOR;
    const name = escapeHTML(p.displayName);
    const rawName = escapeHTML(p.name);
    const desc = p.description
      ? `<p class="project__desc">${escapeHTML(p.description)}</p>`
      : `<p class="project__desc project__desc--empty">Repositório sem descrição — confira os detalhes no GitHub.</p>`;

    const topics = p.topics.length
      ? `<ul class="project__topics" aria-label="Tópicos">${p.topics.map((t) => `<li>${escapeHTML(t)}</li>`).join('')}</ul>`
      : '';

    const meta = [
      p.language ? `<span><span class="project__lang-dot" aria-hidden="true"></span>${escapeHTML(p.language)}</span>` : '',
      p.stars ? `<span title="Estrelas">${icon('i-star')}${p.stars}<span class="sr-only"> estrelas</span></span>` : '',
      p.forks ? `<span title="Forks">${icon('i-fork')}${p.forks}<span class="sr-only"> forks</span></span>` : '',
      p.updated ? `<span class="project__date" title="Última atualização">${formatDate(p.updated)}</span>` : '',
    ].join('');

    const ext = 'target="_blank" rel="noopener noreferrer"';
    const liveBtn = p.liveUrl
      ? `<a class="project__link" href="${escapeHTML(p.liveUrl)}" ${ext}>Ver projeto ${icon('i-arrow-up-right')}<span class="sr-only"> ${name} (abre em nova aba)</span></a>`
      : '';
    const codeBtn = p.repoUrl
      ? `<a class="project__link" href="${escapeHTML(p.repoUrl)}" ${ext}>${icon('i-code')} Ver código<span class="sr-only"> de ${name} (abre em nova aba)</span></a>`
      : '';

    // Overlay da thumbnail (somente desktop com hover). Fica fora da ordem de tabulação
    // para não duplicar os links do corpo do card.
    const overlayBtns = [
      p.liveUrl ? `<a class="btn btn--primary btn--sm" href="${escapeHTML(p.liveUrl)}" ${ext} tabindex="-1">Ver projeto</a>` : '',
      p.repoUrl ? `<a class="btn btn--ghost btn--sm" href="${escapeHTML(p.repoUrl)}" ${ext} tabindex="-1">${icon('i-github')} Ver código</a>` : '',
    ].join('');

    return `
      <article class="project${p.placeholder ? ' project--placeholder' : ''}" style="--lang:${color}; --n:${index % CONFIG.pageSize}">
        <div class="project__thumb">
          ${p.placeholder ? '<span class="project__badge">Exemplo</span>' : ''}
          <span class="project__thumb-symbol" aria-hidden="true">&lt;/&gt; ${escapeHTML(p.language || 'code')}</span>
          <span class="project__thumb-title" aria-hidden="true">${rawName}</span>
          ${overlayBtns ? `<div class="project__overlay" aria-hidden="true">${overlayBtns}</div>` : ''}
        </div>
        <div class="project__body">
          ${meta ? `<div class="project__meta">${meta}</div>` : ''}
          <h3 class="project__name">${name}</h3>
          ${desc}
          ${topics}
          <div class="project__actions">${liveBtn}${codeBtn}</div>
        </div>
      </article>`;
  }

  /** Cria os botões de filtro a partir das linguagens presentes. */
  function renderFilters() {
    const counts = projectsState.all.reduce((acc, p) => {
      const lang = p.language || 'Outros';
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {});

    const langs = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

    els.filters.innerHTML = [
      `<button class="filter${projectsState.filter === 'all' ? ' is-active' : ''}" data-filter="all" aria-pressed="${projectsState.filter === 'all'}">Todos <span class="filter__count">${projectsState.all.length}</span></button>`,
      ...langs.map((lang) => {
        const active = projectsState.filter === lang;
        const color = LANG_COLORS[lang] || 'var(--muted)';
        return `<button class="filter${active ? ' is-active' : ''}" data-filter="${escapeHTML(lang)}" aria-pressed="${active}">
          <span class="filter__dot" style="--dot:${color}" aria-hidden="true"></span>${escapeHTML(lang)} <span class="filter__count">${counts[lang]}</span>
        </button>`;
      }),
    ].join('');
  }

  /** Aplica filtro + busca e renderiza a grade. */
  function renderProjects() {
    const q = projectsState.query.trim().toLowerCase();

    const filtered = projectsState.all.filter((p) => {
      const lang = p.language || 'Outros';
      if (projectsState.filter !== 'all' && lang !== projectsState.filter) return false;
      if (!q) return true;
      return [p.name, p.displayName, p.description, p.language, ...p.topics]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q));
    });

    const visible = filtered.slice(0, projectsState.visible);

    if (!filtered.length) {
      els.grid.innerHTML = `
        <div class="projects-message">
          <span>Nenhum projeto encontrado${q ? ` para <strong>"${escapeHTML(projectsState.query)}"</strong>` : ''}.</span>
          <button class="btn btn--ghost btn--sm" data-action="clear">Limpar filtros</button>
        </div>`;
    } else {
      els.grid.innerHTML = visible.map(projectCard).join('');
    }

    els.more.hidden = filtered.length <= projectsState.visible;

    if (!projectsState.isFallback) {
      els.status.innerHTML = filtered.length
        ? `<span class="text-red">${filtered.length}</span> ${filtered.length === 1 ? 'repositório' : 'repositórios'} · exibindo ${visible.length}`
        : '';
    }
  }

  function showError(message) {
    projectsState.isFallback = true;
    els.status.innerHTML = '';

    // Usa projetos manuais se existirem; caso contrário, os espaços reservados
    const manual = CONFIG.manualProjects.map(normalizeManual);
    projectsState.all = manual.length ? manual : CONFIG.fallbackProjects.map(normalizeManual);
    renderFilters();
    renderProjects();

    els.grid.insertAdjacentHTML(
      'afterbegin',
      `<div class="projects-message" role="alert">
        <span><strong>Não foi possível carregar os repositórios.</strong> ${escapeHTML(message)} Você pode vê-los diretamente no GitHub.</span>
        <button class="btn btn--ghost btn--sm" data-action="retry">${icon('i-refresh')} Tentar novamente</button>
      </div>`
    );
  }

  async function loadProjects() {
    els.grid.setAttribute('aria-busy', 'true');
    els.status.textContent = 'Carregando repositórios do GitHub…';
    if (!els.grid.querySelector('.project-skeleton')) {
      els.grid.innerHTML = '<div class="project-skeleton" aria-hidden="true"></div>'.repeat(3);
    }

    try {
      const repos = await fetchRepos();
      const manual = CONFIG.manualProjects.map(normalizeManual);
      const selected = selectRepos(repos);
      projectsState.all = [...manual, ...selected];
      projectsState.isFallback = false;

      if (!projectsState.all.length) {
        els.status.textContent = '';
        els.grid.innerHTML = `
          <div class="projects-message">
            <span><strong>Novos projetos em breve.</strong> Acompanhe meu GitHub para ver o que estou construindo.</span>
          </div>`;
        return;
      }

      renderFilters();
      renderProjects();
    } catch (err) {
      console.warn('[Portfólio] Falha ao carregar projetos:', err);
      showError(err.message || '');
    } finally {
      els.grid.removeAttribute('aria-busy');
    }
  }

  function initProjects() {
    els.grid = $('#projects-grid');
    els.filters = $('#project-filters');
    els.search = $('#project-search');
    els.status = $('#projects-status');
    els.more = $('#projects-more');
    if (!els.grid) return;

    els.filters.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      projectsState.filter = btn.dataset.filter;
      projectsState.visible = CONFIG.pageSize;
      $$('.filter', els.filters).forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      renderProjects();
    });

    let searchTimer;
    els.search.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        projectsState.query = e.target.value;
        projectsState.visible = CONFIG.pageSize;
        renderProjects();
      }, 150);
    });

    els.more.addEventListener('click', () => {
      projectsState.visible += CONFIG.pageSize;
      renderProjects();
    });

    // Ações dentro da grade (tentar novamente / limpar filtros)
    els.grid.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'retry') {
        try { sessionStorage.removeItem(`gh-repos-${CONFIG.githubUser}`); } catch { /* noop */ }
        els.grid.innerHTML = '';
        loadProjects();
      }
      if (action === 'clear') {
        projectsState.filter = 'all';
        projectsState.query = '';
        els.search.value = '';
        renderFilters();
        renderProjects();
      }
    });

    // Carrega a API apenas quando a seção estiver próxima da tela (economiza requisições)
    const section = $('#projetos');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries, obs) => {
          if (entries.some((en) => en.isIntersecting)) {
            obs.disconnect();
            loadProjects();
          }
        },
        { rootMargin: '600px 0px' }
      );
      io.observe(section);
    } else {
      loadProjects();
    }
  }

  /* 8. INICIALIZAÇÃO ======================================================= */
  function initMisc() {
    // Ano atual no rodapé
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    // Foto de perfil: se o avatar do GitHub falhar, usa o monograma local
    $$('img[data-fallback]').forEach((img) => {
      img.addEventListener('error', () => {
        if (img.src.includes(img.dataset.fallback)) return;
        img.classList.remove('portrait__img--photo');
        img.src = img.dataset.fallback;
      }, { once: true });
    });

    // Garante segurança em qualquer link externo que abra em nova aba
    $$('a[target="_blank"]').forEach((a) => {
      const rel = new Set((a.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
      rel.add('noopener');
      rel.add('noreferrer');
      a.setAttribute('rel', [...rel].join(' '));
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initMisc();
    initNavbar();
    initReveal();
    initEditor();
    initTimeline();
    initHeroInteractions();
    initTechCards();
    initProjects();
  });
})();
