const Store = (() => {
  const KEY = 'pocketbook.v1';

  const CATEGORIES = {
    income:    { emoji: '💰', color: '#5ad19a', kind: 'income' },
    groceries: { emoji: '🛒', color: '#e8b04b', kind: 'expense' },
    dining:    { emoji: '🍜', color: '#f08a7c', kind: 'expense' },
    transport: { emoji: '🚌', color: '#6aa9ff', kind: 'expense' },
    housing:   { emoji: '🏠', color: '#b388ff', kind: 'expense' },
    utilities: { emoji: '💡', color: '#4cc9c0', kind: 'expense' },
    shopping:  { emoji: '🛍️', color: '#ff9bcd', kind: 'expense' },
    health:    { emoji: '➕', color: '#9bd17e', kind: 'expense' },
    fun:       { emoji: '🎬', color: '#ffc861', kind: 'expense' },
    other:     { emoji: '📦', color: '#8aa0b6', kind: 'expense' },
  };

  const DEFAULT_BUDGETS = {
    groceries: 500, dining: 280, transport: 160,
    housing: 1400, utilities: 220, shopping: 250, fun: 180,
  };

  const blank = () => ({ transactions: [], budgets: { ...DEFAULT_BUDGETS } });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : blank();
    } catch {
      return blank();
    }
  }

  function persist() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  /* ---- Transactions ---- */
  function addTransaction(t) {
    state.transactions.unshift({
      id: crypto.randomUUID(),
      amount: Number(t.amount),
      desc: t.desc.trim(),
      category: t.category,
      type: t.type,                // 'income' | 'expense'
      date: t.date,                // ISO yyyy-mm-dd
    });
    persist();
  }

  function removeTransaction(id) {
    state.transactions = state.transactions.filter(t => t.id !== id);
    persist();
  }

  function getTransactions() {
    return [...state.transactions].sort((a, b) => b.date.localeCompare(a.date));
  }

  /* ---- Budgets ---- */
  function setBudget(category, amount) {
    state.budgets[category] = Math.max(0, Number(amount) || 0);
    persist();
  }
  function getBudgets() { return { ...state.budgets }; }

  /* ---- Lifecycle ---- */
  function reset() { state = blank(); persist(); }

  /* Generate a believable sample month so the dashboard looks alive on
     first run. Spreads transactions across the last ~6 months. */
  function seed() {
    const txns = [];
    const today = new Date();
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const merchants = {
      groceries: ['Market Lane', 'Greenfield Co-op', 'Corner Grocer', 'Daily Harvest'],
      dining:    ['Saffron Kitchen', 'Noodle Bar', 'Cafe Lumiere', 'Taco Stand', 'Pizzeria Vivo'],
      transport: ['Metro Pass', 'Ride share', 'Fuel stop', 'Bike repair'],
      utilities: ['Power & Light', 'Fibre Internet', 'Water board', 'Mobile plan'],
      shopping:  ['Atlas Outfitters', 'Page & Bind', 'Home Depot', 'Gadget World'],
      health:    ['City Pharmacy', 'Dental clinic', 'Gym membership'],
      fun:       ['Cinema 8', 'Vinyl Den', 'Concert tickets', 'Streaming+'],
      housing:   ['Monthly rent', 'Tenant insurance'],
      other:     ['Misc', 'Gift', 'Donation'],
    };

    for (let m = 5; m >= 0; m--) {
      const base = new Date(today.getFullYear(), today.getMonth() - m, 1);

      // Salary on the 1st
      txns.push(mk(base, 1, 'income', 'income', 'Monthly salary', 3200 + Math.round(Math.random() * 200)));
      // Rent on the 3rd
      txns.push(mk(base, 3, 'housing', 'expense', 'Monthly rent', 1400));

      // A scatter of everyday expenses
      const count = 16 + Math.floor(Math.random() * 8);
      for (let i = 0; i < count; i++) {
        const cat = pick(['groceries','dining','dining','transport','shopping','utilities','health','fun','groceries']);
        const day = 2 + Math.floor(Math.random() * 26);
        const ranges = { groceries:[18,90], dining:[9,55], transport:[3,40], shopping:[15,180], utilities:[35,140], health:[12,120], fun:[8,70] };
        const [lo, hi] = ranges[cat] || [10, 60];
        const amt = +(lo + Math.random() * (hi - lo)).toFixed(2);
        txns.push(mk(base, day, cat, 'expense', pick(merchants[cat]), amt));
      }
    }

    function mk(base, day, category, type, desc, amount) {
      const d = new Date(base.getFullYear(), base.getMonth(), Math.min(day, 28));
      return {
        id: crypto.randomUUID(),
        amount, desc, category, type,
        date: d.toISOString().slice(0, 10),
      };
    }

    state = { transactions: txns, budgets: { ...DEFAULT_BUDGETS } };
    persist();
  }

  return {
    CATEGORIES, DEFAULT_BUDGETS,
    addTransaction, removeTransaction, getTransactions,
    setBudget, getBudgets,
    reset, seed,
    isEmpty: () => state.transactions.length === 0,
  };
})();
