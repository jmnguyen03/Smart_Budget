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
import SetBudgetModal from '../components/SetBudgetModal';

// WEEK 13: Import the ETL Pipeline
import { generateAIContext } from '../utils/etlPipeline';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // --- FILTER STATES ---
  const [filterMonth, setFilterMonth] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // --- READ DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch Expenses
        const { data: expData, error: expError } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id) 
          .order('date', { ascending: false });
        if (expError) throw expError;
        setExpenses(expData);

        // Fetch Budgets
        const { data: budData, error: budError } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id);
        if (budError) throw budError;
        setBudgets(budData);

      } catch (error) {
        console.error('Error fetching data:', error.message);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  // --- CREATE OR UPDATE DATA ---
  const handleSaveExpense = async (expenseData) => {
    try {
      const formattedAmount = expenseData.category === 'Income' 
        ? Math.abs(Number(expenseData.amount)) 
        : -Math.abs(Number(expenseData.amount));

      const payload = { ...expenseData, amount: formattedAmount };

      if (editingExpense) {
        const { data, error } = await supabase
          .from('expenses')
          .update(payload)
          .eq('id', editingExpense.id)
          .select();

        if (error) throw error;
        
        if (data && data.length > 0) {
          setExpenses(expenses.map(exp => exp.id === editingExpense.id ? data[0] : exp));
        } else {
          throw new Error("Supabase updated 0 rows. Check RLS policies.");
        }
      } else {
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

  // --- WEEK 13: RUN ETL & NAVIGATE TO NEW ADVISOR PAGE ---
  const handleRunSmartAdvisor = () => {
    const compressedDataForAI = generateAIContext(expenses);
    console.log("🚀 Payload ready for AI API:", compressedDataForAI);
    // Navigate to the new page and pass the AI context along in the router state
    navigate('/advisor', { state: { financialContext: compressedDataForAI } });
  };

  // --- HANDLE BUDGETS ---
  const handleSaveBudget = async (budgetData) => {
    try {
      // Check if a budget for this category already exists to update it instead of creating a duplicate
      const existingBudget = budgets.find(b => b.category === budgetData.category);

      if (existingBudget) {
        const { data, error } = await supabase
          .from('budgets')
          .update({ amount: budgetData.amount })
          .eq('id', existingBudget.id)
          .select();
        
        if (error) throw error;
        setBudgets(budgets.map(b => b.id === existingBudget.id ? data[0] : b));
      } else {
        const { data, error } = await supabase
          .from('budgets')
          .insert([{ ...budgetData, user_id: user.id }])
          .select();
          
        if (error) throw error;
        setBudgets([...budgets, data[0]]);
      }
      setIsBudgetModalOpen(false);
    } catch (error) {
      alert('Error saving budget: ' + error.message);
    }
  };

  // --- FILTER LOGIC ---
  const displayedExpenses = expenses.filter(exp => {
    let matchesMonth = true;
    if (filterMonth) {
        const d = new Date(exp.date);
        const monthLabel = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        matchesMonth = monthLabel === filterMonth;
    }
    let matchesCategory = true;
    if (selectedCategory !== 'All') {
        matchesCategory = exp.category === selectedCategory;
    }
    return matchesMonth && matchesCategory;
  });

  // --- CALCULATION LOGIC ---
  const validExpenses = displayedExpenses.filter(exp => exp && exp.amount !== undefined);
  const totalIncome = validExpenses.filter(exp => Number(exp.amount) > 0).reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalExpenses = validExpenses.filter(exp => Number(exp.amount) < 0).reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0);
  const netBalance = totalIncome - totalExpenses;

  return (
    <div className="dashboard-layout">
      {/* 1. Header */}
      <header className="main-header">
        <div className="header-brand">
            <h1>Smart Budget 🎓</h1>
            <span className="subtitle">Quarter 2: Smart Advisor AI</span>
        </div>
        <button onClick={handleLogout} className="logout-btn">Sign Out</button>
      </header>

      {/* 2. Control Bar */}
      <div className="control-bar" style={{ paddingTop: '5px', paddingBottom: '5px' }}>
        <div className="total-display" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Income: </span>
                <span style={{ color: '#16a34a', fontWeight: 'bold' }}>${totalIncome.toFixed(2)}</span>
            </div>
            <div>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Spent: </span>
                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>${totalExpenses.toFixed(2)}</span>
            </div>
            <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '20px' }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                  {filterMonth ? `${filterMonth} Balance: ` : "Net Balance: "}
                </span>
                <span className="amount-highlight">${netBalance.toFixed(2)}</span>
            </div>
            
            {(filterMonth || selectedCategory !== 'All') && (
              <button 
                onClick={() => { setFilterMonth(null); setSelectedCategory('All'); }}
                style={{ marginLeft: '15px', fontSize: '0.8rem', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                Clear Filters ✕
              </button>
            )}
        </div>

        <div className="action-buttons" style={{ display: 'flex', gap: '10px' }}>
            <button 
                className="secondary-btn" 
                onClick={() => navigate('/budgets')}
                style={{ backgroundColor: '#ecfdf5', color: '#10b981', border: '1px solid #6ee7b7', fontWeight: 'bold' }}
            >
                Manage Budgets
            </button>

            {/* Now navigates to the dedicated Smart Advisor Page */}
            <button 
                className="secondary-btn advisor-link-btn" 
                onClick={handleRunSmartAdvisor}
                style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe', fontWeight: 'bold' }}
            >
                Talk to Smart Advisor
            </button>
            
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
        <div className="visuals-pane">
            <PredictionWidget expenses={expenses} />
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

        <div className="list-pane">
            <div className="list-header">
                <h3>Transaction List</h3>
                <span className="badge-count">{displayedExpenses.length} items</span>
            </div>
            <div className="scrollable-content">
                {loading ? (
                    <p style={{textAlign:'center', marginTop: '20px'}}>Loading...</p>
                ) : (
                    <ExpenseList 
                      expenses={displayedExpenses} 
                      onDelete={handleDeleteExpense} 
                      onEdit={(expense) => {
                        setEditingExpense(expense);
                        setIsModalOpen(true);
                      }} 
                    />
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

      <SetBudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSave={handleSaveBudget}
      />
      
    </div>
  );
}