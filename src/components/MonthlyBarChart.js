import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '../supabaseClient';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, getElementAtEvent } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// NOW ACCEPTS 'selectedCategory' and 'onCategoryChange' AS PROPS
export default function MonthlyBarChart({ userId, onMonthClick, selectedCategory, onCategoryChange }) {
  const [rawData, setRawData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const chartRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('expenses')
          .select('amount, date, category')
          .eq('user_id', userId)
          .order('date', { ascending: true });

        if (error) throw error;
        if (data) {
          setRawData(data);
          const uniqueCats = [...new Set(data.map(item => item.category))];
          setCategories(uniqueCats.sort());
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchData();
  }, [userId]);

  const chartData = useMemo(() => {
    if (!rawData.length) return null;

    // Use the Prop 'selectedCategory' instead of local state
    const filtered = selectedCategory === 'All' 
      ? rawData 
      : rawData.filter(item => item.category === selectedCategory);

    const grouped = filtered.reduce((acc, curr) => {
      const dateObj = new Date(curr.date);
      const label = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
      const sortKey = curr.date.slice(0, 7);
      
      if (!acc[sortKey]) acc[sortKey] = { label, total: 0 };
      acc[sortKey].total += Math.abs(curr.amount);
      return acc;
    }, {});

    const sortedKeys = Object.keys(grouped).sort();
    
    return {
      labels: sortedKeys.map(key => grouped[key].label),
      datasets: [{
        label: selectedCategory === 'All' ? 'Total Spending' : `${selectedCategory} Spending`,
        data: sortedKeys.map(key => grouped[key].total),
        backgroundColor: selectedCategory === 'All' ? 'rgba(59, 130, 246, 0.7)' : 'rgba(16, 185, 129, 0.7)',
        borderRadius: 4,
      }],
    };
  }, [rawData, selectedCategory]);

  const handleBarClick = (event) => {
    if (!chartRef.current) return;
    const elements = getElementAtEvent(chartRef.current, event);
    if (elements.length > 0) {
      const index = elements[0].index;
      const clickedMonth = chartData.labels[index];
      if (onMonthClick) onMonthClick(clickedMonth);
    } else {
      if (onMonthClick) onMonthClick(null);
    }
  };

  if (loading) return <p className="loading-text">Loading...</p>;

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Monthly Trends</h3>
        <select 
          value={selectedCategory} 
          // CALL THE PROP FUNCTION HERE
          onChange={(e) => onCategoryChange(e.target.value)}
          className="chart-filter"
        >
          <option value="All">All Categories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="canvas-wrapper">
        {chartData ? (
          <Bar 
            ref={chartRef}
            data={chartData}
            onClick={handleBarClick}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, ticks: { maxTicksLimit: 6 } },
                x: { grid: { display: false } }
              },
              onHover: (event, chartElement) => {
                event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
              }
            }} 
          />
        ) : <p className="no-data">No data available.</p>}
      </div>
    </div>
  );
}