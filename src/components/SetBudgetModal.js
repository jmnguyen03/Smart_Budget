import { useState, useEffect } from 'react';

export default function SetBudgetModal({ isOpen, onClose, onSave }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Dining');

  // Removed 'Income' since you don't typically set a spending budget for income
  const categories = [
    'Entertainment', 
    'Food & Dining', 
    'Groceries', 
    'Rent', 
    'Shopping', 
    'Textbooks', 
    'Transportation', 
    'Utilities'
  ];

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setCategory('Food & Dining');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      category,
      amount: parseFloat(amount)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-content" style={contentStyle}>
        <h2>Set Category Budget</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label>Monthly Limit ($)</label>
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

          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button type="submit" style={submitBtnStyle}>Save Budget</button>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Inline styles mirroring your AddExpenseModal
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
  flex: 1, padding: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' // Green color to differentiate from expense
};
const cancelBtnStyle = {
  flex: 1, padding: '10px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
};