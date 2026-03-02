  import { useEffect, useState } from 'react';
  import { useAuth } from '../context/AuthContext';
  import { supabase } from '../supabaseClient';
  import { useNavigate } from 'react-router-dom';

  // Component Imports
  import ExpenseList from '../components/ExpenseList';
  import AddExpenseModal from '../components/AddExpenseModal';
  import SpendingPieChart from '../components/SpendingPieChart';
  import MonthlyBarChart from '../components/MonthlyBarChart';
  import PredictionWidget from '../components/PredictionWidget';

  export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingExpense, setEditingExpense] = useState(null);

    // --- FILTER STATES ---
    const [filterMonth, setFilterMonth] = useState(null); // Filter by Click on Bar
    const [selectedCategory, setSelectedCategory] = useState('All'); // Filter by Dropdown

    // --- READ DATA ---
    useEffect(() => {
      const fetchExpenses = async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', user.id) 
            .order('date', { ascending: false });

          if (error) throw error;
          setExpenses(data);
        } catch (error) {
          console.error('Error fetching expenses:', error.message);
        } finally {
          setLoading(false);
        }
      };
      if (user) fetchExpenses();
    }, [user]);

    // --- CREATE OR UPDATE DATA ---
    const handleSaveExpense = async (expenseData) => {
      try {
        // Force amount to be negative for expenses (unless it's Income)
        const formattedAmount = expenseData.category === 'Income' 
          ? Math.abs(Number(expenseData.amount)) 
          : -Math.abs(Number(expenseData.amount));

        const payload = { ...expenseData, amount: formattedAmount };

        if (editingExpense) {
          // UPDATE EXISTING
          const { data, error } = await supabase
            .from('expenses')
            .update(payload)
            .eq('id', editingExpense.id)
            .select();

          if (error) throw error;
          
          // DEFENSIVE CHECK: Did Supabase actually return the row?
          if (data && data.length > 0) {
            setExpenses(expenses.map(exp => exp.id === editingExpense.id ? data[0] : exp));
          } else {
            // Fallback: Optimistically update local state so it doesn't crash
            setExpenses(expenses.map(exp => exp.id === editingExpense.id ? { ...exp, ...payload } : exp));
          }
          
        } else {
          // INSERT NEW
          const { data, error } = await supabase
            .from('expenses')
            .insert([{ ...payload, user_id: user.id }])
            .select();

          if (error) throw error;
          
          if (data && data.length > 0) {
            setExpenses([data[0], ...expenses]);
          }
        }
        
        setIsModalOpen(false);
        setEditingExpense(null);
      } catch (error) {
        alert('Error saving transaction: ' + error.message);
      }
    };

    // --- DELETE DATA ---
    const handleDeleteExpense = async (id) => {
      const confirmDelete = window.confirm("Are you sure you want to delete this?");
      if (!confirmDelete) return;
      try {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) throw error;
        setExpenses(expenses.filter(exp => exp.id !== id));
      } catch (error) {
        alert('Error deleting: ' + error.message);
      }
    };

    const handleLogout = async () => {
      await supabase.auth.signOut();
      navigate('/login');
    };

    // --- FILTER LOGIC (The Magic Part) ---
    const displayedExpenses = expenses.filter(exp => {
      // 1. Check Month Filter
      let matchesMonth = true;
      if (filterMonth) {
          const d = new Date(exp.date);
          const monthLabel = d.toLocaleString('default', { month: 'long', year: 'numeric' });
          matchesMonth = monthLabel === filterMonth;
      }

      // 2. Check Category Filter
      let matchesCategory = true;
      if (selectedCategory !== 'All') {
          matchesCategory = exp.category === selectedCategory;
      }

      return matchesMonth && matchesCategory;
    });

    // Calculate Total based on what is visible (ignoring any corrupted/undefined rows)
    const totalSpent = displayedExpenses
      .filter(exp => exp && exp.amount !== undefined)
      .reduce((acc, curr) => acc + Number(curr.amount), 0)
      .toFixed(2);

    return (
      <div className="dashboard-layout">
        {/* 1. Header */}
        <header className="main-header">
          <div className="header-brand">
              <h1>Smart Budget 🎓</h1>
              <span className="subtitle">Milestone 6: Data Visualization</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">Sign Out</button>
        </header>

        {/* 2. Control Bar */}
        <div className="control-bar">
          <div className="total-display">
              <span>
                {filterMonth ? `${filterMonth}` : "Total"} 
                {selectedCategory !== 'All' ? ` (${selectedCategory})` : ""}
                :
              </span>
              <span className="amount-highlight">${totalSpent}</span>
              
              {(filterMonth || selectedCategory !== 'All') && (
                <button 
                  onClick={() => { setFilterMonth(null); setSelectedCategory('All'); }}
                  style={{ marginLeft: '15px', fontSize: '0.8rem', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  Clear Filters ✕
                </button>
              )}
          </div>
          <div className="action-buttons">
              <button className="primary-btn" onClick={() => {
                  setEditingExpense(null);
                  setIsModalOpen(true);
              }}>
                  + Add Expense
              </button>
          </div>
        </div>

        {/* 3. Main Split Layout */}
        <div className="content-split">
          
          {/* LEFT: Visuals */}
          <div className="visuals-pane">
              
              {/* 1. Top Row: Prediction Widget */}
              <PredictionWidget expenses={expenses} />
              
              {/* 2. Bottom Row: Side-by-Side Charts */}
              <div className="charts-row">
                  <div className="chart-card main-chart">
                      <MonthlyBarChart 
                        userId={user.id} 
                        filterMonth={filterMonth}
                        onMonthClick={(month) => setFilterMonth(month)}
                        selectedCategory={selectedCategory}
                        onCategoryChange={(cat) => setSelectedCategory(cat)}
                      />
                  </div>
                  <div className="chart-card secondary-chart">
                      <SpendingPieChart userId={user.id} />
                  </div>
              </div>

          </div>

          {/* RIGHT: List */}
          <div className="list-pane">
            <ExpenseList 
              expenses={displayedExpenses} 
              onDelete={handleDeleteExpense} 
              onEdit={(expense) => {
                setEditingExpense(expense);
                setIsModalOpen(true);
              }} 
            />
              <div className="list-header">
                  <h3>Transaction List</h3>
                  <span className="badge-count">{displayedExpenses.length} items</span>
              </div>
              
              <div className="scrollable-content">
                  {loading ? (
                      <p style={{textAlign:'center', marginTop: '20px'}}>Loading...</p>
                  ) : (
                      <ExpenseList expenses={displayedExpenses} onDelete={handleDeleteExpense} />
                  )}
              </div>
          </div>
        </div>

        <AddExpenseModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setEditingExpense(null);
          }} 
          onSave={handleSaveExpense} 
          expenseToEdit={editingExpense} 
        />
      </div>
    );
  }