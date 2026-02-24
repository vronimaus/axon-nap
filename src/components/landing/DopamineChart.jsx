import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DopamineChart() {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            family: "'Inter', sans-serif",
            size: 11
          }
        }
      },
      y: {
        display: false,
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const data = {
    labels: ['Woche 1', 'Woche 2', 'Woche 3', 'Woche 4', 'Woche 5'],
    datasets: [
      {
        label: 'AXON (Lifetime)',
        data: [8, 9, 9.5, 9.8, 10],
        borderColor: '#F59E0B',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(245, 158, 11, 0.2)');
          gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#F59E0B',
        pointBorderColor: '#000',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Normales Training (Abo)',
        data: [6, 7, 8, 5, 4], // Adjusted to show drop-off mentioned in text
        borderColor: '#334155',
        borderDash: [5, 5],
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0
      }
    ],
  };

  return (
    <div className="w-full h-full min-h-[250px]">
      <Line options={options} data={data} />
    </div>
  );
}