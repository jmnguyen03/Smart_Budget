// --- src/utils/etlPipeline.js ---

export const generateAIContext = (expenses) => {
  const validExpenses = expenses.filter(exp => exp && Number(exp.amount) < 0);

  const categoryTotals = validExpenses.reduce((acc, curr) => {
    const category = curr.category || 'Uncategorized';
    const amount = Math.abs(Number(curr.amount)); 
    acc[category] = (acc[category] || 0) + amount;
    return acc;
  }, {});

  const totalSpent = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

  let persona = "The Balanced Saver ⚖️"; 
  let highestCategory = "";
  let highestPercentage = 0;
  const categoryPercentages = {};

  for (const [category, amount] of Object.entries(categoryTotals)) {
    const percentage = (amount / totalSpent) * 100;
    categoryPercentages[category] = percentage.toFixed(1) + "%";

    if (percentage > highestPercentage) {
      highestPercentage = percentage;
      highestCategory = category;
    }
  }

  if (highestCategory === 'Food & Dining' && highestPercentage > 25) {
    persona = "The Foodie 🍔";
  } else if (highestCategory === 'Transportation' && highestPercentage > 20) {
    persona = "The Commuter 🚗";
  } else if (highestCategory === 'Shopping' && highestPercentage > 20) {
    persona = "The Shopaholic 🛍️";
  } else if (highestCategory === 'Entertainment' && highestPercentage > 20) {
    persona = "The Socialite 🎟️";
  } else if (highestCategory === 'Textbooks' && highestPercentage > 15) {
    persona = "The Scholar 📚";
  }

  const aiPayload = {
    totalSpent: `$${totalSpent.toFixed(2)}`,
    assignedPersona: persona,
    dominantCategory: highestCategory,
    spendingBreakdown: categoryPercentages,
    systemInstruction: `You are a financial advisor. The user is categorized as '${persona}'. Give them 2 short, actionable tips to save money based on their spending breakdown.`
  };

  return aiPayload;
};