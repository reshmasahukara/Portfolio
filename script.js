/**
 * SmartExpense - Application Logic
 * Using Vanilla JavaScript with LocalStorage persistence
 */

(function () {
    'use strict';

    // --- State Management ---
    let state = {
        expenses: [],
        theme: 'light',
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0
    };

    // --- DOM Elements ---
    const elements = {
        expenseForm: document.getElementById('expense-form'),
        expenseTitle: document.getElementById('expense-title'),
        expenseAmount: document.getElementById('expense-amount'),
        expenseCategory: document.getElementById('expense-category'),
        expenseDate: document.getElementById('expense-date'),
        transactionsBody: document.getElementById('transactions-body'),
        emptyState: document.getElementById('empty-state'),
        totalBalance: document.getElementById('total-balance'),
        totalIncome: document.getElementById('total-income'),
        totalExpenses: document.getElementById('total-expenses'),
        currentDate: document.getElementById('current-date'),
        themeToggle: document.getElementById('theme-toggle'),
        clearAllBtn: document.getElementById('clear-all-btn'),
        openModalBtn: document.getElementById('open-modal-btn'),
        closeFormBtn: document.getElementById('close-form-btn'),
        addExpensePanel: document.getElementById('add-expense-panel'),
        confirmationModal: document.getElementById('confirmation-modal'),
        cancelClear: document.getElementById('cancel-clear'),
        confirmClear: document.getElementById('confirm-clear'),
        setIncomeBtn: document.getElementById('set-income-btn'),
        incomeModal: document.getElementById('income-modal'),
        incomeAmountInput: document.getElementById('income-amount-input'),
        cancelIncome: document.getElementById('cancel-income'),
        saveIncome: document.getElementById('save-income')
    };

    // --- Core Functions ---

    /**
     * Initialize the application
     */
    function init() {
        loadData();
        renderDate();
        setActiveTheme();
        updateSummary();
        renderExpenses();
        attachEventListeners();
        
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        elements.expenseDate.value = today;
    }

    /**
     * Load data from localStorage
     */
    function loadData() {
        const savedExpenses = localStorage.getItem('smart_expenses');
        const savedTheme = localStorage.getItem('smart_theme');
        const savedIncome = localStorage.getItem('smart_income');
        
        if (savedExpenses) {
            state.expenses = JSON.parse(savedExpenses);
        }
        
        if (savedIncome) {
            state.totalIncome = parseFloat(savedIncome);
        }
        
        if (savedTheme) {
            state.theme = savedTheme;
            document.documentElement.setAttribute('data-theme', state.theme);
        }
    }

    /**
     * Save data to localStorage
     */
    function saveData() {
        localStorage.setItem('smart_expenses', JSON.stringify(state.expenses));
        localStorage.setItem('smart_income', state.totalIncome.toString());
    }

    /**
     * Render the current date in the header
     */
    function renderDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        elements.currentDate.textContent = new Date().toLocaleDateString('en-US', options);
    }

    /**
     * Update the summary cards
     */
    function updateSummary() {
        state.totalExpenses = state.expenses.reduce((acc, curr) => acc + curr.amount, 0);
        state.totalBalance = state.totalIncome - state.totalExpenses;

        elements.totalExpenses.textContent = formatCurrency(state.totalExpenses);
        elements.totalBalance.textContent = formatCurrency(state.totalBalance);
        elements.totalIncome.textContent = formatCurrency(state.totalIncome);
        
        // Visual indicator for balance color (optional tweak)
        if (state.totalBalance < 0) {
            elements.totalBalance.style.color = 'var(--error-color)';
        } else {
            elements.totalBalance.style.color = 'var(--text-main)';
        }
    }

    /**
     * Render the list of expenses in the table
     */
    function renderExpenses() {
        elements.transactionsBody.innerHTML = '';

        if (state.expenses.length === 0) {
            elements.emptyState.style.display = 'block';
            return;
        }

        elements.emptyState.style.display = 'none';

        // Sort expenses by date (most recent first)
        const sortedExpenses = [...state.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedExpenses.forEach(expense => {
            const row = document.createElement('tr');
            row.classList.add('transaction-row');
            
            const categoryClass = `tag-${expense.category.toLowerCase()}`;
            
            row.innerHTML = `
                <td style="font-weight: 500;">${escapeHTML(expense.title)}</td>
                <td><span class="category-tag ${categoryClass}">${expense.category}</span></td>
                <td style="color: var(--text-muted);">${formatDate(expense.date)}</td>
                <td class="amount-text">-${formatCurrency(expense.amount)}</td>
                <td>
                    <button class="delete-btn" data-id="${expense.id}" title="Delete Transaction">
                        🗑️
                    </button>
                </td>
            `;
            
            elements.transactionsBody.appendChild(row);
        });
    }

    /**
     * Handle adding a new expense
     */
    function handleAddExpense(e) {
        e.preventDefault();

        const title = elements.expenseTitle.value.trim();
        const amount = parseFloat(elements.expenseAmount.value);
        const category = elements.expenseCategory.value;
        const date = elements.expenseDate.value;

        // Validation
        let isValid = true;
        if (!title) {
            showError('title-error', 'Title is required');
            isValid = false;
        } else {
            clearError('title-error');
        }

        if (isNaN(amount) || amount <= 0) {
            showError('amount-error', 'Enter a valid amount > 0');
            isValid = false;
        } else {
            clearError('amount-error');
        }

        if (!category) {
            showError('category-error', 'Select a category');
            isValid = false;
        } else {
            clearError('category-error');
        }

        if (!date) {
            showError('date-error', 'Date is required');
            isValid = false;
        } else {
            clearError('date-error');
        }

        if (!isValid) return;

        // Create new expense object
        const newExpense = {
            id: Date.now().toString(),
            title,
            amount,
            category,
            date
        };

        // Update state and UI
        state.expenses.push(newExpense);
        saveData();
        updateSummary();
        renderExpenses();

        // Reset form and feedback
        elements.expenseForm.reset();
        const today = new Date().toISOString().split('T')[0];
        elements.expenseDate.value = today;
        
        // Hide panel on small screens if it's acting like a modal
        if (window.innerWidth <= 1024) {
            elements.addExpensePanel.classList.add('hidden');
        }
    }

    /**
     * Handle deleting an expense
     */
    function handleDeleteExpense(id) {
        state.expenses = state.expenses.filter(exp => exp.id !== id);
        saveData();
        updateSummary();
        renderExpenses();
    }

    /**
     * Handle clearing all expenses
     */
    function handleClearAll() {
        state.expenses = [];
        saveData();
        updateSummary();
        renderExpenses();
        elements.confirmationModal.style.display = 'none';
    }

    /**
     * Toggle Light/Dark mode
     */
    function toggleTheme() {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', state.theme);
        localStorage.setItem('smart_theme', state.theme);
        setActiveTheme();
    }

    function setActiveTheme() {
        const icon = state.theme === 'light' ? '🌙' : '☀️';
        const text = state.theme === 'light' ? ' Dark Mode' : ' Light Mode';
        elements.themeToggle.innerHTML = `<span class="icon">${icon}</span> ${text}`;
    }

    // --- Helper Functions ---

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    function formatDate(dateString) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    function showError(id, msg) {
        const el = document.getElementById(id);
        if (el) el.textContent = msg;
    }

    function clearError(id) {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    }

    function escapeHTML(str) {
        const p = document.createElement('p');
        p.textContent = str;
        return p.innerHTML;
    }

    // --- Event Listeners ---

    function attachEventListeners() {
        elements.expenseForm.addEventListener('submit', handleAddExpense);

        // Delete button delegation
        elements.transactionsBody.addEventListener('click', (e) => {
            const btn = e.target.closest('.delete-btn');
            if (btn) {
                const id = btn.getAttribute('data-id');
                handleDeleteExpense(id);
            }
        });

        // Theme toggle
        elements.themeToggle.addEventListener('click', toggleTheme);

        // Confirmation Modal for Clear All
        elements.clearAllBtn.addEventListener('click', () => {
            if (state.expenses.length > 0) {
                elements.confirmationModal.style.display = 'flex';
            }
        });

        elements.cancelClear.addEventListener('click', () => {
            elements.confirmationModal.style.display = 'none';
        });

        elements.confirmClear.addEventListener('click', handleClearAll);

        // Mobile Form Toggle
        elements.openModalBtn.addEventListener('click', () => {
            elements.addExpensePanel.classList.remove('hidden');
            elements.expenseTitle.focus();
        });

        elements.closeFormBtn.addEventListener('click', () => {
            elements.addExpensePanel.classList.add('hidden');
        });

        // Income Modal
        elements.setIncomeBtn.addEventListener('click', () => {
            elements.incomeAmountInput.value = state.totalIncome || '';
            elements.incomeModal.style.display = 'flex';
            elements.incomeAmountInput.focus();
        });

        elements.cancelIncome.addEventListener('click', () => {
            elements.incomeModal.style.display = 'none';
        });

        elements.saveIncome.addEventListener('click', () => {
            const amount = parseFloat(elements.incomeAmountInput.value);
            if (!isNaN(amount) && amount >= 0) {
                state.totalIncome = amount;
                saveData();
                updateSummary();
                elements.incomeModal.style.display = 'none';
            }
        });

        // Close modal on click outside
        window.addEventListener('click', (e) => {
            if (e.target === elements.confirmationModal) {
                elements.confirmationModal.style.display = 'none';
            }
            if (e.target === elements.incomeModal) {
                elements.incomeModal.style.display = 'none';
            }
        });
    }

    // --- Start Application ---
    init();

})();
