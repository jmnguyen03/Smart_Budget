import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SpendingPieChart({ userId }) {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('category_summaries')
        .select('*')
        .eq('user_id', userId);

      if (data) {
        setChartData({
          labels: data.map(item => item.category),
          datasets: [
            {
              label: 'Total Spent',
              data: data.map(item => item.total_spent),
              backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#76A346'
              ],
              borderWidth: 1,
            },
          ],
        });
      }
    };
    if (userId) fetchData();
  }, [userId]);

  if (!chartData) return <p>Loading...</p>;

  return (
    <div className="chart-container">
      <h3>Spending by Category</h3>
      <div className="canvas-wrapper">
        <Pie 
          data={chartData} 
          options={{
            responsive: true,
            maintainAspectRatio: false, // Crucial for resizing
            plugins: {
              legend: {
                position: 'right', // Legend on side = Bigger Chart
                labels: {
                  boxWidth: 15,
                  padding: 15, // Spaces out the legend items
                  font: { size: 11 }
                }
              }
            },
            layout: {
                padding: 0 // Removes padding so circle hits the edges
            }
          }} 
        />
      </div>
    </div>
  );
}