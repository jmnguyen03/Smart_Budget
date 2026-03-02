export default function ExpenseList({ expenses, onDelete, onEdit }) {
  if (!expenses || expenses.length === 0) {
    return <p style={{ textAlign: 'center', color: '#94a3b8' }}>No transactions found.</p>;
  }

  return (
    <div className="expense-list">
      {expenses.map((exp) => (
        <div key={exp.id} className="expense-item">
          <div className="expense-info">
            <h4>{exp.description}</h4>
            <div className="meta-data">
              <span>{exp.date}</span>
              <span>{exp.category}</span>
            </div>
          </div>
          
          <div className="expense-actions">
            {/* Formats negative numbers cleanly */}
            <span className="amount">
              ${Math.abs(Number(exp.amount)).toFixed(2)}
            </span>
            <div className="action-icons">
              {/* NEW EDIT BUTTON */}
              <button className="edit-btn" onClick={() => onEdit(exp)} title="Edit">
                ✏️
              </button>
              <button className="delete-btn" onClick={() => onDelete(exp.id)} title="Delete">
                🗑️
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}