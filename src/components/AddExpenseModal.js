import { useState, useEffect } from 'react';

const getLocalYYYYMMDD = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().split('T')[0];
};

const getInitialState = () => ({
  description: '',
  amount: '',
  category: 'Food & Dining',
  date: getLocalYYYYMMDD()
});

// Added 'expenseToEdit' prop
export default function AddExpenseModal({ isOpen, onClose, onSave, expenseToEdit }) {
  const [formData, setFormData] = useState(getInitialState());

  // Watch for changes: If expenseToEdit is passed in, pre-fill the form!
  useEffect(() => {
    if (expenseToEdit) {
      setFormData({
        description: expenseToEdit.description,
        amount: Math.abs(Number(expenseToEdit.amount)), // Strip negative sign for the input field
        category: expenseToEdit.category,
        date: expenseToEdit.date
      });
    } else {
      setFormData(getInitialState());
    }
  }, [expenseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(formData);
    onClose(); // Reset is handled by the useEffect when it closes
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Dynamic Title */}
        <h2>{expenseToEdit ? 'Edit Transaction' : 'Add Transaction'}</h2>
        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label>Description</label>
            <input name="description" value={formData.description} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Amount</label>
            <input name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="Entertainment">Entertainment</option>
              <option value="Food & Dining">Food & Dining</option>
              <option value="Groceries">Groceries</option>
              <option value="Income">Income</option>
              <option value="Rent">Rent</option>
              <option value="Shopping">Shopping</option>
              <option value="Textbooks">Textbooks</option>
              <option value="Transportation">Transportation</option>
              <option value="Utilities">Utilities</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date</label>
            <input name="date" type="date" value={formData.date} onChange={handleChange} required />
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={handleCancel}>Cancel</button>
            <button type="submit" className="primary-btn">
              {expenseToEdit ? 'Update Changes' : 'Save Transaction'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}