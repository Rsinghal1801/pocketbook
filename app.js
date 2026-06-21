(() => {
  const $  = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const C  = Store.CATEGORIES;

  const money = n => (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const money2 = n => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const monthKey = d => d.slice(0, 7);
  const thisMonth = () => new Date().toISOString().slice(0, 7);
  const fmtDate = iso => new Date(iso + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  let activeFilter = 'all';
  let searchTerm = '';

  /* ---------------- Derived data ---------------- */
  function monthlyTotals() {
    const t = Store.getTransactions();
    const cur = thisMonth();
    let income = 0, expense = 0;
    t.forEach(x => {
      if (monthKey(x.date) !== cur) return;
      if (x.type === 'income') income += x.amount; else expense += x.amount;
    });
    return { income, expense };
  }

  function netBalance() {
    return Store.getTransactions().reduce((s, x) => s + (x.type === 'income' ? x.amount : -x.amount), 0);
  }

  function lastSixMonths() {
    const labels = [], income = [], expense = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      labels.push(d.toLocaleDateString(undefined, { month: 'short' }));
      let inc = 0, exp = 0;
      Store.getTransactions().forEach(t => {
        if (monthKey(t.date) !== key) return;
        if (t.type === 'income') inc += t.amount; else exp += t.amount;
      });
      income.push(+inc.toFixed(2)); expense.push(+exp.toFixed(2));
    }
    return { labels, income, expense };
  }

  function categoryBreakdown() {
    const cur = thisMonth();
    const totals = {};
    Store.getTransactions().forEach(t => {
      if (t.type !== 'expense' || monthKey(t.date) !== cur) return;
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }

  /* ---------------- Renderers ---------------- */
  function renderStats() {
    const { income, expense } = monthlyTotals();
    $('#statBalance').textContent = money(netBalance());
    $('#statIncome').textContent = money(income);
    $('#statExpense').textContent = money(expense);
    const saved = income - expense;
    $('#statSaved').textContent = money(saved);
    $('#statSaved').className = 'stat-card__value figure ' + (saved >= 0 ? 'stat--up' : 'stat--down');

    const rate = income ? Math.round((saved / income) * 100) : 0;
    $('#statSavedSub').textContent = income ? `${rate}% of income kept` : 'income minus spending';
    $('#statIncomeSub').textContent = new Date().toLocaleDateString(undefined, { month: 'long' });
    $('#statExpenseSub').textContent = `${categoryBreakdown().length} categories`;
    $('#statBalanceSub').textContent = `${Store.getTransactions().length} transactions tracked`;
  }

  function renderCharts() {
    const six = lastSixMonths();
    Charts.renderFlow(six.labels, six.income, six.expense);

    const breakdown = categoryBreakdown();
    const labels = breakdown.map(([c]) => label(c));
    const values = breakdown.map(([, v]) => +v.toFixed(2));
    const colors = breakdown.map(([c]) => C[c]?.color || '#888');
    Charts.renderDonut(labels, values, colors);

    const total = values.reduce((a, b) => a + b, 0);
    $('#donutTotal').textContent = money(total);

    $('#categoryLegend').innerHTML = breakdown.slice(0, 6).map(([c, v]) =>
      `<li><span class="dot" style="background:${C[c]?.color}"></span>${label(c)} · ${money(v)}</li>`
    ).join('') || '<li class="empty" style="padding:0">No spending yet this month</li>';

    return {
      months: six.labels, income: six.income, expense: six.expense,
      donutLabels: labels, donutValues: values, donutColors: colors,
    };
  }

  function txnRow(t, withDelete = true) {
    const cat = C[t.category] || C.other;
    const sign = t.type === 'income' ? '+' : '−';
    const cls = t.type === 'income' ? 'txn__amount--in' : '';
    return `
      <div class="txn" data-id="${t.id}">
        <div class="txn__icon">${cat.emoji}</div>
        <div class="txn__body">
          <p class="txn__desc">${escapeHtml(t.desc)}</p>
          <p class="txn__meta">${label(t.category)} · ${fmtDate(t.date)}</p>
        </div>
        <span class="txn__amount ${cls}">${sign} ${money2(t.amount)}</span>
        ${withDelete ? `<button class="txn__del" data-del="${t.id}" aria-label="Delete transaction">✕</button>` : ''}
      </div>`;
  }

  function renderRecent() {
    const rows = Store.getTransactions().slice(0, 6);
    $('#recentList').innerHTML = rows.length
      ? rows.map(t => txnRow(t, false)).join('')
      : `<p class="empty">No activity yet. Add a transaction or load sample data to begin.</p>`;
  }

  function renderFull() {
    let rows = Store.getTransactions();
    if (activeFilter !== 'all') rows = rows.filter(t => activeFilter === 'income' ? t.type === 'income' : t.category === activeFilter);
    if (searchTerm) rows = rows.filter(t => (t.desc + ' ' + label(t.category)).toLowerCase().includes(searchTerm));
    $('#fullList').innerHTML = rows.length
      ? rows.map(t => txnRow(t)).join('')
      : `<p class="empty">Nothing matches that. Try a different search or filter.</p>`;
  }

  function renderFilters() {
    const used = new Set(Store.getTransactions().map(t => t.category));
    const chips = [['all', 'All'], ['income', 'Income']]
      .concat([...used].filter(c => c !== 'income').map(c => [c, label(c)]));
    $('#filterChips').innerHTML = chips.map(([v, l]) =>
      `<button class="chip ${activeFilter === v ? 'is-active' : ''}" data-filter="${v}">${l}</button>`
    ).join('');
  }

  function renderBudgets() {
    const cur = thisMonth();
    const spent = {};
    Store.getTransactions().forEach(t => {
      if (t.type !== 'expense' || monthKey(t.date) !== cur) return;
      spent[t.category] = (spent[t.category] || 0) + t.amount;
    });
    const budgets = Store.getBudgets();
    const cats = Object.keys(budgets);

    $('#budgetGrid').innerHTML = cats.map(cat => {
      const limit = budgets[cat];
      const used = spent[cat] || 0;
      const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
      const state = used > limit ? 'is-over' : pct >= 80 ? 'is-warn' : '';
      const left = limit - used;
      return `
        <div class="budget">
          <div class="budget__top">
            <span class="budget__name"><span class="budget__emoji">${C[cat]?.emoji || '📦'}</span>${label(cat)}</span>
            <span class="budget__pct">${Math.round(pct)}%</span>
          </div>
          <div class="budget__bar"><div class="budget__fill ${state}" style="width:${pct}%"></div></div>
          <p class="budget__nums"><b>${money2(used)}</b> of ${money2(limit)} · ${left >= 0 ? money2(left) + ' left' : money2(-left) + ' over'}</p>
          <div class="budget__edit">
            <input type="number" min="0" step="10" value="${limit}" data-budget="${cat}" aria-label="Monthly budget for ${label(cat)}" />
          </div>
        </div>`;
    }).join('');
  }

  function renderAll() {
    renderStats();
    const payload = renderCharts();
    window.__chartPayload = payload;
    renderRecent();
    renderFilters();
    renderFull();
    renderBudgets();
  }

  /* ---------------- Modal ---------------- */
  const modal = $('#txnModal');
  function openModal() {
    fillCategorySelect('expense');
    $('#txnDate').value = new Date().toISOString().slice(0, 10);
    setType('expense');
    $('#formError').hidden = true;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => $('#txnAmount').focus(), 50);
  }
  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    $('#txnForm').reset();
  }
  function setType(type) {
    $('#txnType').value = type;
    $$('.seg__btn').forEach(b => b.classList.toggle('is-active', b.dataset.type === type));
    fillCategorySelect(type);
  }
  function fillCategorySelect(type) {
    const sel = $('#txnCategory');
    const opts = Object.entries(C).filter(([, v]) => v.kind === type);
    sel.innerHTML = opts.map(([k, v]) => `<option value="${k}">${v.emoji} ${label(k)}</option>`).join('');
  }

  /* ---------------- Helpers ---------------- */
  function label(c) { return c.charAt(0).toUpperCase() + c.slice(1); }
  function escapeHtml(s) { return s.replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-show'), 2400);
  }

  /* ---------------- Navigation ---------------- */
  function switchView(view) {
    $$('.view').forEach(v => v.classList.toggle('is-active', v.id === `view-${view}`));
    $$('.nav__item').forEach(n => n.classList.toggle('is-active', n.dataset.view === view));
    $('#viewTitle').textContent = label(view);
    if (history.replaceState) history.replaceState(null, '', '#' + view);
  }

  /* ---------------- Events ---------------- */
  function bind() {
    // nav
    $$('[data-view]').forEach(el => el.addEventListener('click', e => {
      e.preventDefault(); switchView(el.dataset.view);
    }));

    // modal open/close
    $('#addBtn').addEventListener('click', openModal);
    $$('[data-close]').forEach(el => el.addEventListener('click', closeModal));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });

    // type toggle
    $$('.seg__btn').forEach(b => b.addEventListener('click', () => setType(b.dataset.type)));

    // submit
    $('#txnForm').addEventListener('submit', e => {
      e.preventDefault();
      const amount = parseFloat($('#txnAmount').value);
      const desc = $('#txnDesc').value;
      if (!amount || amount <= 0) return showFormError('Enter an amount greater than zero.');
      if (!desc.trim()) return showFormError('Add a short description.');
      Store.addTransaction({
        amount, desc,
        category: $('#txnCategory').value,
        type: $('#txnType').value,
        date: $('#txnDate').value,
      });
      closeModal();
      renderAll();
      toast('Transaction added');
    });

    // delete (event delegation)
    document.addEventListener('click', e => {
      const del = e.target.closest('[data-del]');
      if (del) { Store.removeTransaction(del.dataset.del); renderAll(); toast('Transaction removed'); }
    });

    // filters + search
    $('#filterChips').addEventListener('click', e => {
      const chip = e.target.closest('[data-filter]');
      if (!chip) return;
      activeFilter = chip.dataset.filter; renderFilters(); renderFull();
    });
    $('#searchInput').addEventListener('input', e => { searchTerm = e.target.value.toLowerCase().trim(); renderFull(); });

    // budgets
    $('#budgetGrid').addEventListener('change', e => {
      const inp = e.target.closest('[data-budget]');
      if (!inp) return;
      Store.setBudget(inp.dataset.budget, inp.value);
      renderBudgets(); toast('Budget updated');
    });

    // theme
    $('#themeBtn').addEventListener('click', () => {
      const root = document.documentElement;
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      localStorage.setItem('pocketbook.theme', next);
      Charts.retheme(window.__chartPayload);
      renderCharts();
    });

    // data tools
    $('#seedBtn').addEventListener('click', () => { Store.seed(); renderAll(); toast('Sample month loaded'); });
    $('#resetBtn').addEventListener('click', () => {
      if (confirm('Erase all transactions and budgets on this device?')) { Store.reset(); renderAll(); toast('All data cleared'); }
    });
  }
  function showFormError(msg) { const el = $('#formError'); el.textContent = msg; el.hidden = false; }

  /* ---------------- Init ---------------- */
  function init() {
    document.documentElement.dataset.theme = localStorage.getItem('pocketbook.theme') || 'dark';
    $('#todayLabel').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

    if (Store.isEmpty()) Store.seed();   // first-run: greet with a populated dashboard
    bind();
    renderAll();

    const hash = location.hash.replace('#', '');
    if (['overview', 'transactions', 'budgets'].includes(hash)) switchView(hash);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
