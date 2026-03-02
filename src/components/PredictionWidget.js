import { useEffect, useState } from 'react';
import regression from 'regression';

export default function PredictionWidget({ expenses }) {
  const [projectedTotal, setProjectedTotal] = useState(0);
  const [currentTotal, setCurrentTotal] = useState(0);
  const [burnRate, setBurnRate] = useState(0);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    if (!expenses || expenses.length === 0) return;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    setDaysLeft(daysInMonth - currentDay);

    // 1. Isolate Data: Get ALL expenses from this month
    const thisMonthExpenses = expenses.filter(exp => {
      const [year, month] = exp.date.split('-').map(Number);
      return (month - 1) === currentMonth && year === currentYear;
    });

    if (thisMonthExpenses.length === 0) {
      setProjectedTotal(0);
      setCurrentTotal(0);
      setBurnRate(0);
      return;
    }

    // --- WEEK 8: OUTLIER ISOLATION LOGIC ---
    // Split the data: 'undefined' or 'true' goes to recurring, 'false' goes to one-time
    const recurringExpenses = thisMonthExpenses.filter(exp => exp.is_recurring !== false);
    const oneTimeExpenses = thisMonthExpenses.filter(exp => exp.is_recurring === false);

    // Sum up the massive one-time spikes (Rent, Textbooks, etc.)
    const oneTimeTotal = oneTimeExpenses.reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0);

    // 2. Data Engineering: Fill an array for the WHOLE month ONLY using recurring expenses
    const dailyTotals = Array(daysInMonth).fill(0); 
    
    recurringExpenses.forEach(exp => {
      const dayIndex = Number(exp.date.split('-')[2]) - 1; 
      // Safely add to the correct day index
      if (dayIndex >= 0 && dayIndex < daysInMonth) {
          dailyTotals[dayIndex] += Math.abs(Number(exp.amount));
      }
    });

    // 3. Create Regression Points (Only calculate up to the current day)
    let runningRecurringTotal = 0;
    const regressionData = [];
    
    for (let i = 0; i < currentDay; i++) {
      runningRecurringTotal += dailyTotals[i];
      regressionData.push([i + 1, runningRecurringTotal]);
    }

    // Actual total spent includes everything (recurring + one-time)
    const totalSpentSoFar = thisMonthExpenses.reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0);
    setCurrentTotal(totalSpentSoFar);
    
    // Burn rate strictly ignores one-time spikes to show the true daily habit
    setBurnRate(runningRecurringTotal / (currentDay || 1));

    // 4. Predictive Algorithm
    if (regressionData.length > 1) {
      const result = regression.linear(regressionData);
      const predictedRecurring = result.predict(daysInMonth)[1]; 
      
      const safePredictedRecurring = predictedRecurring > runningRecurringTotal 
        ? predictedRecurring 
        : runningRecurringTotal;

      // FINAL MATH: Habitual prediction + Flat one-time spikes
      setProjectedTotal(safePredictedRecurring + oneTimeTotal);
    } else {
      setProjectedTotal(totalSpentSoFar);
    }

  }, [expenses]);

  return (
    <div className="prediction-widget">
      <div className="widget-header">
        <span className="ai-icon">✨</span>
        <h3>Smart Forecast</h3>
      </div>
      
      <div className="widget-stats">
        <div className="stat-box">
          <p className="stat-label">Current Spend</p>
          <p className="stat-value">${currentTotal.toFixed(2)}</p>
        </div>
        
        <div className="stat-box warning-box">
          <p className="stat-label">Projected EOM Total</p>
          <p className="stat-value projected-value">${projectedTotal.toFixed(2)}</p>
        </div>
        
        <div className="stat-box">
          <p className="stat-label">Daily Burn Rate</p>
          <p className="stat-value">${burnRate.toFixed(2)}/day</p>
        </div>
      </div>
      
      <div className="widget-footer">
        <p>Based on your spending habits over the last {new Date().getDate()} days. You have {daysLeft} days left in the month.</p>
      </div>
    </div>
  );
}