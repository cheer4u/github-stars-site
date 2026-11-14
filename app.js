(function () {
  'use strict';

  var data = window.REPOS_DATA || {};
  var repos = data.repos || [];
  var REPO_URL = 'https://github.com/cheer4u/github-stars-site';

  var LANG_COLORS = {
    Python: '#3572A5', TypeScript: '#3178c6', JavaScript: '#f1e05a',
    HTML: '#e34c26', CSS: '#563d7c', Rust: '#dea584', Go: '#00ADD8',
    Shell: '#89e051', 'C++': '#f34b7d', C: '#555555', Swift: '#F05138',
    Kotlin: '#A97BFF', Java: '#b07219', Svelte: '#ff3e00', MDX: '#fcb32c',
    CoffeeScript: '#244776', 'Jupyter Notebook': '#DA5B0B', Vue: '#41b883'
  };

  var state = { category: null, language: null, query: '', sort: 'stars-desc', view: 'grid' };

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtStars(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }

  function langColor(lang) { return LANG_COLORS[lang] || '#8b949e'; }

  function topicsOf(r) { return r.topics || []; }

  /* ---------- 侧边栏 ---------- */

  function chipHtml(kind, value, count, decorate) {
    var active = state[kind] === value ? ' active' : '';
    var label = decorate ? decorate(value) : '<span>' + esc(value) + '</span>';
    return '<button class="filter-tag' + active + '" data-' + kind + '="' + esc(value) + '" title="' + esc(value) + '">' +
      label + '<span class="count">' + count + '</span></button>';
  }

  function renderSidebar() {
    var counts = {};
    repos.forEach(function (r) {
      topicsOf(r).forEach(function (t) { if (t) counts[t] = (counts[t] || 0) + 1; });
    });
    var cats = Object.keys(counts).map(function (k) { return [k, counts[k]]; })
      .sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); })
      .slice(0, 30);
    $('categoryTags').innerHTML = cats.map(function (c) { return chipHtml('category', c[0], c[1]); }).join('');

    var lc = {};
    repos.forEach(function (r) { if (r.language) lc[r.language] = (lc[r.language] || 0) + 1; });
    var langs = Object.keys(lc).map(function (k) { return [k, lc[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; })
      .slice(0, 15);
    $('languageTags').innerHTML = langs.map(function (c) {
      return chipHtml('language', c[0], c[1], function (v) {
        return '<span class="with-dot"><span class="lang-dot" style="background:' + langColor(v) + '"></span>' + esc(v) + '</span>';
      });
    }).join('');

    bindTags($('categoryTags'), 'category');
    bindTags($('languageTags'), 'language');
  }

  function bindTags(container, kind) {
    container.querySelectorAll('.filter-tag').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = btn.getAttribute('data-' + kind);
        if (state[kind] === v) {
          state[kind] = null;
        } else {
          state[kind] = v;
          var other = kind === 'category' ? 'language' : 'category';
          state[other] = null;
          $(other === 'category' ? 'categoryTags' : 'languageTags')
            .querySelectorAll('.filter-tag').forEach(function (b) { b.classList.remove('active'); });
        }
        renderSidebar();
        render();
      });
    });
  }

  /* ---------- 筛选与渲染 ---------- */

  function comparator() {
    switch (state.sort) {
      case 'stars-asc': return function (a, b) { return a.stars - b.stars; };
      case 'name-asc': return function (a, b) { return a.full_name.toLowerCase() < b.full_name.toLowerCase() ? -1 : 1; };
      case 'name-desc': return function (a, b) { return a.full_name.toLowerCase() > b.full_name.toLowerCase() ? -1 : 1; };
      case 'pushed-desc': return function (a, b) { return String(b.pushed_at || '').localeCompare(String(a.pushed_at || '')); };
      default: return function (a, b) { return b.stars - a.stars; };
    }
  }

  function filtered() {
    var q = state.query.trim().toLowerCase();
    var list = repos.filter(function (r) {
      if (state.category && topicsOf(r).indexOf(state.category) === -1) return false;
      if (state.language && (r.language || '') !== state.language) return false;
      if (q) {
        var hay = (r.full_name + ' ' + (r.description || '') + ' ' + (r.language || '') + ' ' + topicsOf(r).join(' ')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    return list.sort(comparator());
  }

  function cardHtml(r) {
    var lang = r.language || '';
    var topics = topicsOf(r).slice(0, 6);
    var home = r.homepage
      ? '<a class="repo-home" href="' + esc(r.homepage) + '" target="_blank" rel="noopener" title="' + esc(r.homepage) + '">↗ 主页</a>'
      : '';
    return '<article class="repo-card">' +
      '<div class="repo-header">' +
        '<a class="repo-name" href="' + esc(r.url) + '" target="_blank" rel="noopener"><span class="owner">' + esc(r.owner) + '/</span>' + esc(r.name) + '</a>' +
        '<span class="repo-stars" title="' + r.stars + ' stars">' +
          '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg>' +
          fmtStars(r.stars) +
        '</span>' +
      '</div>' +
      '<p class="repo-desc">' + esc(r.description || 'No description') + '</p>' +
      '<div class="repo-footer">' +
        '<span class="repo-meta">' +
          (lang ? '<span class="repo-lang"><span class="lang-dot" style="background:' + langColor(lang) + '"></span>' + esc(lang) + '</span>' : '') +
          home +
          (r.archived ? '<span class="repo-archived">archived</span>' : '') +
        '</span>' +
        '<div class="repo-topics">' +
          topics.map(function (t) { return '<button class="repo-topic" data-topic="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function render() {
    var list = filtered();
    var grid = $('reposGrid');
    $('emptyState').style.display = list.length ? 'none' : 'block';
    grid.innerHTML = list.map(cardHtml).join('');
    var scope = state.category ? 'in “' + state.category + '”'
      : state.language ? 'in ' + state.language : '';
    var q = state.query ? '，匹配 “' + state.query + '”' : '';
    $('resultsCount').textContent = '共 ' + list.length + ' / ' + repos.length + ' 个仓库 ' + scope + q;
  }

  /* ---------- 事件 ---------- */

  function bindEvents() {
    var input = $('searchInput');
    input.addEventListener('input', function () {
      state.query = input.value;
      $('clearSearch').classList.toggle('show', !!input.value);
      render();
    });
    $('clearSearch').addEventListener('click', function () {
      input.value = ''; state.query = '';
      $('clearSearch').classList.remove('show');
      render(); input.focus();
    });

    $('sortSelect').addEventListener('change', function (e) { state.sort = e.target.value; render(); });

    document.querySelectorAll('.view-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.view-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.view = btn.getAttribute('data-view');
        $('reposGrid').classList.toggle('list-view', state.view === 'list');
      });
    });

    $('reposGrid').addEventListener('click', function (e) {
      var t = e.target.closest('.repo-topic');
      if (!t) return;
      state.category = t.getAttribute('data-topic');
      state.language = null;
      renderSidebar(); render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 一键更新：打开 Actions 页面点 "Run workflow"，回来后自动刷新数据
    var pendingReload = false;
    $('updateBtn').addEventListener('click', function () {
      pendingReload = true;
      window.open(REPO_URL + '/actions/workflows/update-stars.yml', '_blank');
    });
    window.addEventListener('focus', function () {
      if (pendingReload) {
        pendingReload = false;
        setTimeout(function () { location.reload(); }, 600);
      }
    });
  }

  /* ---------- 初始化 ---------- */

  function init() {
    $('stats').textContent = repos.length + ' repos';
    if (data.lastUpdated) {
      var d = new Date(data.lastUpdated);
      $('lastUpdated').textContent = isNaN(d.getTime())
        ? data.lastUpdated
        : d.toLocaleString('zh-CN', { hour12: false });
    }
    renderSidebar();
    bindEvents();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
