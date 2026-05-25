import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import SetBudgetModal from '../components/SetBudgetModal';

export default function Budgets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  useEffect(() => {
    const fetchBudgetAndExpenses = async () => {
      try {
        setLoading(true);
        // Fetch Budgets
        const { data: budData, error: budError } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id);
        if (budError) throw budError;
        setBudgets(budData);

        // Fetch Expenses (needed to calculate progress)
        // Grab just the current month's expenses for accurate tracking
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        
        const { data: expData, error: expError } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', firstDay); // Only expenses from this month

        if (expError) throw expError;
        setExpenses(expData);

      } catch (error) {
        console.error('Error fetching data:', error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchBudgetAndExpenses();
  }, [user]);

  const handleSaveBudget = async (budgetData) => {
    try {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="main-header">
        <div className="header-brand">
            <h1>Smart Budget 🎓</h1>
            <span className="subtitle">Budget Tracker</span>
        </div>
        <div style={{display: 'flex', gap: '15px'}}>
            <button onClick={() => navigate('/dashboard')} className="secondary-btn" style={{backgroundColor: 'white'}}>
                ← Back to Dashboard
            </button>
            <button onClick={handleLogout} className="logout-btn">Sign Out</button>
        </div>
      </header>

      {/* Control Bar */}
      <div className="control-bar">
        <h2>Your Monthly Category Limits</h2>
        <button className="primary-btn" onClick={() => setIsBudgetModalOpen(true)} style={{ backgroundColor: '#10b981' }}>
            + Add / Edit Budget
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        {loading ? (
          <p>Loading your budgets...</p>
        ) : budgets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '8px' }}>
            <h3>No budgets set yet!</h3>
            <p style={{color: '#64748b'}}>Click the button above to set limits for your spending categories.</p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            {budgets.map(budget => {
              // Calculate spending for this specific category
              const spentInCategory = expenses
                .filter(exp => exp.category === budget.category && Number(exp.amount) < 0)
                .reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0);
              
              const percentage = Math.min((spentInCategory / budget.amount) * 100, 100);
              const isOverBudget = spentInCategory > budget.amount;

              return (
                <div key={budget.id} style={{ marginBottom: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '1.1rem' }}>{budget.category}</strong>
                    <span style={{ color: isOverBudget ? '#ef4444' : '#64748b', fontWeight: isOverBudget ? 'bold' : 'normal' }}>
                      ${spentInCategory.toFixed(2)} / ${budget.amount.toFixed(2)}
                      {isOverBudget && " (Over Limit!)"}
                    </span>
                  </div>
                  <div style={{ height: '12px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${percentage}%`, 
                      backgroundColor: isOverBudget ? '#ef4444' : (percentage > 80 ? '#f59e0b' : '#10b981'),
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SetBudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSave={handleSaveBudget}
      />
    </div>
  );
}