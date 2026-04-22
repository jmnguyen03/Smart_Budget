import { useState, useEffect } from 'react';

export default function AddExpenseModal({ isOpen, onClose, onSave, expenseToEdit }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  // 1. ADD THE NEW STATE FOR OUR CHECKBOX (Default it to true)
  const [isRecurring, setIsRecurring] = useState(true);

  // Categories list for dropdown
const categories = [
    'Entertainment', 
    'Food & Dining', 
    'Groceries', 
    'Income', 
    'Rent', 
    'Shopping', 
    'Textbooks', 
    'Transportation', 
    'Utilities'
  ];
  // Populate the form if we are editing an existing expense
  useEffect(() => {
    if (expenseToEdit) {
      setAmount(Math.abs(expenseToEdit.amount));
      setCategory(expenseToEdit.category);
      setDate(expenseToEdit.date);
      setDescription(expenseToEdit.description || '');
      // If editing, load the saved recurring status (default to true if undefined)
      setIsRecurring(expenseToEdit.is_recurring !== false);
    } else {
      resetForm();
    }
  }, [expenseToEdit, isOpen]);

  const resetForm = () => {
    setAmount('');
    setCategory('Food & Dining'); // Reset to default category
    
    // Get local date properly formatted as YYYY-MM-DD
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setDate(`${year}-${month}-${day}`);
    
    setDescription('');
    setIsRecurring(true); 
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 2. INCLUDE THE RECURRING FLAG IN THE DATA WE SEND TO SUPABASE
    const expenseData = {
      //id: expenseToEdit ? expenseToEdit.id : undefined,
      amount: parseFloat(amount),
      category,
      date,
      description,
      is_recurring: isRecurring 
    };

    onSave(expenseData);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-content" style={contentStyle}>
        <h2>{expenseToEdit ? 'Edit Transaction' : 'Add New Transaction'}</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div>
            <label>Amount ($)</label>
            <input 
              type="number" 
              step="0.01" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              required 
              style={inputStyle}
            />
          </div>

          <div>
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label>Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              required 
              style={inputStyle}
            />
          </div>

          <div>
            <label>Description (Optional)</label>
            <input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              style={inputStyle}
            />
          </div>

          {/* 3. ADD THE CHECKBOX UI */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
            <input 
              type="checkbox" 
              id="recurring-checkbox"
              checked={isRecurring} 
              onChange={(e) => setIsRecurring(e.target.checked)} 
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="recurring-checkbox" style={{ cursor: 'pointer', fontSize: '0.95rem', color: '#334155' }}>
              <strong>Recurring Expense?</strong> <br/>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>
                Uncheck this for one-time spikes (like tuition or a new laptop) to keep your daily forecast accurate.
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button type="submit" style={submitBtnStyle}>Save</button>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          </div>

        </form>
      </div>
    </div>
  );
}

// Basic inline styles to ensure it looks clean without needing extra CSS classes
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};
const contentStyle = {
  backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
};
const inputStyle = {
  width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box'
};
const submitBtnStyle = {
  flex: 1, padding: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
};
const cancelBtnStyle = {
  flex: 1, padding: '10px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
};