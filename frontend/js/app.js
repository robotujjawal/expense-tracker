/**
 * app.js
 * UI state + rendering for the Ledger expense tracker.
 */

(() => {
  const state = {
    categories: [],
    transactions: [],
    filter: 'all',
    search: '',
    selectedType: 'expense',
  };

  let chartInstance = null;

  const ICON_MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.5A8.5 8.5 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5Z"></path></svg>';
  const ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5"></circle><path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8 6 18M18 6l1.8-1.8"></path></svg>';

  // ---- DOM refs -----------------------------------------------------
  const el = {
    todayDate: document.getElementById('todayDate'),
    sumIncome: document.getElementById('sumIncome'),
    sumExpense: document.getElementById('sumExpense'),
    sumBalance: document.getElementById('sumBalance'),
    txForm: document.getElementById('txForm'),
    txType: document.getElementById('txType'),
    txTitle: document.getElementById('txTitle'),
    txAmount: document.getElementById('txAmount'),
    txCategory: document.getElementById('txCategory'),
    txDate: document.getElementById('txDate'),
    txNotes: document.getElementById('txNotes'),
    formMsg: document.getElementById('formMsg'),
    typeButtons: document.querySelectorAll('.type-btn'),
    filterTabs: document.getElementById('filterTabs'),
    searchInput: document.getElementById('searchInput'),
    tableBody: document.getElementById('txTableBody'),
    emptyState: document.getElementById('emptyState'),
    rowTemplate: document.getElementById('rowTemplate'),
    breakdownChart: document.getElementById('breakdownChart'),
    breakdownLegend: document.getElementById('breakdownLegend'),
    themeToggle: document.getElementById('themeToggle'),

    // Auth elements
    loginBtn: document.getElementById('loginBtn'),
    loginPanel: document.getElementById('loginPanel'),
    authTabs: document.querySelectorAll('.auth-tab'),
    authTitle: document.getElementById('authTitle'),
    loginForm: document.getElementById('loginForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginFullname: document.getElementById('loginFullname'),
    loginPassword: document.getElementById('loginPassword'),
    confirmPassword: document.getElementById('confirmPassword'),
    authSubmit: document.getElementById('authSubmit'),
    loginCancel: document.getElementById('loginCancel'),
    loginMsg: document.getElementById('loginMsg'),
    authSwitchText: document.getElementById('authSwitchText'),
    switchAuthMode: document.getElementById('switchAuthMode'),
    fullnameField: document.getElementById('fullnameField'),
    confirmPasswordField: document.getElementById('confirmPasswordField'),
  };

  // ---- Helpers --------------------------------------------------------
  const currency = (value) =>
    '₹' + Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatDate = (isoDate) => {
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Theme helpers -------------------------------------------------------
  // Dark is the default, premium look. The toggle switches to a lighter
  // alternate theme via the `theme-light` class on <body>.
  function initTheme() {
    try {
      const saved = localStorage.getItem('ledger-theme') || 'dark';
      if (saved === 'light') document.body.classList.add('theme-light');
      updateThemeToggle();
    } catch (_) { /* ignore */ }
  }

  function toggleTheme() {
    const isLight = document.body.classList.toggle('theme-light');
    try { localStorage.setItem('ledger-theme', isLight ? 'light' : 'dark'); } catch (_) {}
    updateThemeToggle();
  }

  function updateThemeToggle() {
    if (!el.themeToggle) return;
    const isLight = document.body.classList.contains('theme-light');
    el.themeToggle.innerHTML = isLight ? ICON_MOON : ICON_SUN;
    el.themeToggle.title = isLight ? 'Switch to dark theme' : 'Switch to light theme';
  }

  // DRF paginates by default ({results: [...]}) — unwrap either shape.
  const unwrap = (data) => (Array.isArray(data) ? data : data.results || []);

  // ---- Init -------------------------------------------------------------
  async function init() {
    el.todayDate.textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
    el.txDate.value = new Date().toISOString().slice(0, 10);

    initTheme();
    bindEvents();

    try {
      const [categories] = await Promise.all([API.getCategories()]);
      state.categories = unwrap(categories);
      populateCategorySelect();

      // Check current user — if authenticated, load user-specific data.
      try {
        const user = await API.getCurrentUser();
        state.user = user.username;
        updateAuthUI();
        await Promise.all([loadTransactions(), loadSummary()]);
      } catch (authErr) {
        // Not authenticated: prompt to sign in and do not load private data.
        state.user = null;
        updateAuthUI();

        // Open centered login modal so users see the auth prompt immediately
        try {
          if (el.loginPanel) {
            showLoginModal();
            if (el.loginEmail) el.loginEmail.focus();
          }
        } catch (_) { /* ignore failures here */ }
      }
    } catch (err) {
      showFormMessage(
        'Could not reach the backend. Make sure `python manage.py runserver` is running.',
        false
      );
      console.error(err);
    }
  }

  function bindEvents() {
    el.typeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        el.typeButtons.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        state.selectedType = btn.dataset.type;
        el.txType.value = state.selectedType;
        populateCategorySelect();
      });
    });

    el.txForm.addEventListener('submit', handleSubmit);

    el.filterTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      el.filterTabs.querySelectorAll('.tab').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      state.filter = tab.dataset.filter;
      loadTransactions();
    });

    let searchTimer;
    el.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.search = e.target.value.trim();
        loadTransactions();
      }, 300);
    });

    el.tableBody.addEventListener('click', async (e) => {
      const btn = e.target.closest('.delete-btn');
      if (!btn) return;
      const row = btn.closest('tr');
      const id = row.dataset.id;
      if (!confirm('Delete this entry from the ledger?')) return;
      try {
        await API.deleteTransaction(id);
        await Promise.all([loadTransactions(), loadSummary()]);
      } catch (err) {
        alert('Could not delete this entry.');
        console.error(err);
      }
    });

    // ---- login / signup modal handling ---------------------------------
    function createBackdrop() {
      let b = document.querySelector('.modal-backdrop');
      if (!b) {
        b = document.createElement('div');
        b.className = 'modal-backdrop';
        document.body.appendChild(b);
      }
      return b;
    }

    function removeBackdrop() {
      const b = document.querySelector('.modal-backdrop');
      if (b) b.remove();
    }

    function showLoginModal() {
      if (!el.loginPanel) return;
      el.loginPanel.hidden = false;
      el.loginPanel.classList.add('modal');
      document.body.classList.add('modal-open');
      const backdrop = createBackdrop();
      backdrop.classList.add('is-visible');
      if (el.loginEmail) el.loginEmail.focus();
    }

    function hideLoginModal() {
      if (!el.loginPanel) return;
      el.loginPanel.classList.remove('modal');
      el.loginPanel.hidden = true;
      document.body.classList.remove('modal-open');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.classList.remove('is-visible');
      setTimeout(removeBackdrop, 160);
    }

    function updateAuthMode(mode) {
      const isSignup = mode === 'signup';
      if (el.authTitle) el.authTitle.textContent = isSignup ? 'Create your account' : 'Welcome back';
      if (el.authSubmit) el.authSubmit.textContent = isSignup ? 'Sign up' : 'Sign in';
      if (el.authSwitchText) el.authSwitchText.textContent = isSignup ? 'Already have an account?' : "Don't have an account?";
      if (el.switchAuthMode) el.switchAuthMode.textContent = isSignup ? 'Login' : 'Sign up';
      if (el.fullnameField) el.fullnameField.style.display = isSignup ? '' : 'none';
      if (el.confirmPasswordField) el.confirmPasswordField.style.display = isSignup ? '' : 'none';
      if (el.loginFullname) el.loginFullname.required = isSignup;
      if (el.confirmPassword) el.confirmPassword.required = isSignup;
      if (el.loginPassword) el.loginPassword.placeholder = isSignup ? 'Create a password' : 'Enter your password';
    }

    // auth tab switching
    if (el.authTabs && el.authTabs.length) {
      el.authTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          el.authTabs.forEach((t) => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
          tab.classList.add('is-active');
          tab.setAttribute('aria-selected', 'true');

          const mode = tab.dataset.mode;
          updateAuthMode(mode);
        });
      });
    }

    if (el.switchAuthMode) {
      el.switchAuthMode.addEventListener('click', () => {
        const activeTab = document.querySelector('.auth-tab.is-active');
        const nextMode = activeTab && activeTab.dataset.mode === 'signup' ? 'login' : 'signup';
        const target = document.querySelector(`.auth-tab[data-mode="${nextMode}"]`);
        if (target) target.click();
      });
    }

    // login button (toggles modal / logout)
    if (el.loginBtn) {
      el.loginBtn.addEventListener('click', () => {
        if (state.user) {
          API.logout().then(() => {
            clearPrivateDashboard();
            state.user = null;
            updateAuthUI();
            hideLoginModal();
            showLoginModal();
          }).catch((e) => {
            clearPrivateDashboard();
            state.user = null;
            updateAuthUI();
            hideLoginModal();
            showLoginModal();
            console.error(e);
          });
          return;
        }
        showLoginModal();
      });
    }

    if (el.loginCancel) {
      el.loginCancel.addEventListener('click', () => {
        hideLoginModal();
      });
    }

    // unified auth form submit — supports login and signup depending on active tab
    if (el.loginForm) {
      el.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (el.loginMsg) el.loginMsg.textContent = '';

        const activeTab = document.querySelector('.auth-tab.is-active');
        const mode = activeTab ? activeTab.dataset.mode : 'login';

        const email = el.loginEmail ? el.loginEmail.value.trim() : '';
        const password = el.loginPassword ? el.loginPassword.value : '';
        const fullName = el.loginFullname ? el.loginFullname.value.trim() : '';
        const confirmPassword = el.confirmPassword ? el.confirmPassword.value : '';

        if (!email || !password) {
          if (el.loginMsg) el.loginMsg.textContent = 'Email and password are required.';
          return;
        }

        if (mode === 'signup') {
          if (!fullName) {
            if (el.loginMsg) el.loginMsg.textContent = 'Full name is required.';
            return;
          }
          if (password.length < 8) {
            if (el.loginMsg) el.loginMsg.textContent = 'Password must be at least 8 characters long.';
            return;
          }
          if (password !== confirmPassword) {
            if (el.loginMsg) el.loginMsg.textContent = 'Passwords do not match.';
            return;
          }
        }

        try {
          if (mode === 'signup') {
            await API.signup({ full_name: fullName, email, password });
          } else {
            await API.login({ email, password });
          }
          try {
            const user = await API.getCurrentUser();
            state.user = user.username;
            updateAuthUI();
            hideLoginModal();
            await Promise.all([loadTransactions(), loadSummary()]);
          } catch (e) {
            window.location.reload();
          }
        } catch (err) {
          const msg = err?.message || 'Authentication failed.';
          if (el.loginMsg) el.loginMsg.textContent = mode === 'signup' ? `Could not create account: ${msg}` : `Invalid credentials: ${msg}`;
          console.error(err);
        }
      });
    }

    const togglePasswordBtn = document.getElementById('togglePassword');
    if (togglePasswordBtn && el.loginPassword) {
      togglePasswordBtn.addEventListener('click', () => {
        const showPassword = el.loginPassword.type === 'password';
        el.loginPassword.type = showPassword ? 'text' : 'password';
        togglePasswordBtn.textContent = showPassword ? 'Hide' : 'Show';
        togglePasswordBtn.title = showPassword ? 'Hide password' : 'Show password';
      });
    }

    // allow clicking the backdrop to dismiss the modal
    document.addEventListener('click', (e) => {
      const b = document.querySelector('.modal-backdrop');
      if (!b) return;
      if (e.target === b) hideLoginModal();
    });

    if (el.themeToggle) {
      el.themeToggle.addEventListener('click', () => toggleTheme());
    }
  }

  // ---- Category select ----------------------------------------------
  function populateCategorySelect() {
    const relevant = state.categories.filter((c) => c.kind === state.selectedType);
    el.txCategory.innerHTML = relevant
      .map((c) => `<option value="${c.id}">${c.icon} ${c.name}</option>`)
      .join('');
  }

  function clearPrivateDashboard() {
    state.transactions = [];
    state.filter = 'all';
    if (el.searchInput) el.searchInput.value = '';
    if (el.filterTabs) {
      el.filterTabs.querySelectorAll('.tab').forEach((tab) => {
        tab.classList.toggle('is-active', tab.dataset.filter === 'all');
      });
    }
    if (el.tableBody) el.tableBody.innerHTML = '';
    if (el.emptyState) el.emptyState.hidden = false;
    el.sumIncome.textContent = currency(0);
    el.sumExpense.textContent = currency(0);
    el.sumBalance.textContent = currency(0);
    if (el.breakdownLegend) el.breakdownLegend.innerHTML = '<li class="breakdown-empty">No expenses logged yet.</li>';
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  }

  function updateAuthUI() {
    if (!el.loginBtn) return;
    const isLoggedIn = !!state.user;
    el.loginBtn.textContent = isLoggedIn ? 'Logout' : 'Log in';
    el.loginBtn.setAttribute('aria-label', isLoggedIn ? 'Log out' : 'Log in');
    el.loginBtn.title = isLoggedIn ? 'Log out' : 'Log in';
  }

  // ---- Form submit -----------------------------------------------------
  async function handleSubmit(e) {
    e.preventDefault();
    showFormMessage('', true);

    const payload = {
      title: el.txTitle.value.trim(),
      amount: el.txAmount.value,
      transaction_type: state.selectedType,
      category: el.txCategory.value || null,
      date: el.txDate.value,
      notes: el.txNotes.value.trim(),
    };

    if (!payload.title || !payload.amount) return;

    try {
      await API.createTransaction(payload);
      el.txForm.reset();
      el.txDate.value = new Date().toISOString().slice(0, 10);
      showFormMessage('Entry added to the ledger.', true);
      await Promise.all([loadTransactions(), loadSummary()]);
    } catch (err) {
      showFormMessage('Could not save this entry. Check the amount and try again.', false);
      console.error(err);
    }
  }

  function showFormMessage(text, ok) {
    el.formMsg.textContent = text;
    el.formMsg.classList.toggle('success', !!ok && !!text);
  }

  // ---- Transactions table ----------------------------------------------
  async function loadTransactions() {
    const params = {};
    if (state.filter !== 'all') params.type = state.filter;
    if (state.search) params.search = state.search;

    const data = await API.getTransactions(params);
    state.transactions = unwrap(data);
    renderTable();
  }

  function renderTable() {
    el.tableBody.innerHTML = '';
    el.emptyState.hidden = state.transactions.length > 0;

    state.transactions.forEach((tx) => {
      const node = el.rowTemplate.content.cloneNode(true);
      const tr = node.querySelector('tr');
      tr.dataset.id = tx.id;

      node.querySelector('.cell-date').textContent = formatDate(tx.date);
      node.querySelector('.cell-icon').textContent = tx.category_icon || (tx.transaction_type === 'income' ? '✨' : '💰');
      node.querySelector('.cell-title-text').textContent = tx.title;

      const notesEl = node.querySelector('.cell-notes');
      if (tx.notes) { notesEl.textContent = tx.notes; } else { notesEl.remove(); }

      const badge = node.querySelector('.badge');
      badge.textContent = tx.category_name || 'Uncategorized';
      badge.style.setProperty('--badge-color', tx.category_color || '#8B5CF6');

      const amountEl = node.querySelector('.cell-amount');
      const sign = tx.transaction_type === 'income' ? '+' : '−';
      amountEl.textContent = `${sign} ${currency(tx.amount)}`;
      amountEl.classList.add(tx.transaction_type === 'income' ? 'is-income' : 'is-expense');

      el.tableBody.appendChild(node);
    });
  }

  // ---- Summary + chart ----------------------------------------------
  async function loadSummary() {
    const summary = await API.getSummary();
    el.sumIncome.textContent = currency(summary.income_total);
    el.sumExpense.textContent = currency(summary.expense_total);
    el.sumBalance.textContent = currency(summary.balance);
    renderBreakdown(summary.category_breakdown || []);
  }

  function renderBreakdown(breakdown) {
    el.breakdownLegend.innerHTML = '';

    if (!breakdown.length) {
      el.breakdownLegend.innerHTML = '<li class="breakdown-empty">No expenses logged yet.</li>';
      if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
      return;
    }

    breakdown.forEach((row) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="legend-swatch" style="background:${row.color}"></span>
        <span class="legend-name">${row.icon} ${row.name}</span>
        <span class="legend-amount">${currency(row.total)}</span>
      `;
      el.breakdownLegend.appendChild(li);
    });

    const ctx = el.breakdownChart.getContext('2d');
    const data = {
      labels: breakdown.map((r) => r.name),
      datasets: [{
        data: breakdown.map((r) => r.total),
        backgroundColor: breakdown.map((r) => r.color),
        borderColor: '#14141D',
        borderWidth: 2,
      }],
    };

    if (chartInstance) {
      chartInstance.data = data;
      chartInstance.update();
      return;
    }

    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data,
      options: {
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1B1B26',
            titleColor: '#F5F5F7',
            bodyColor: '#A1A1AA',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 10,
          },
        },
      },
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
