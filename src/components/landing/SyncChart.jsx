import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SyncChart() {
  const data = {
    labels: ['Flow', 'Rest'],
    datasets: [
      {
        data: [78, 22],
        backgroundColor: ['#06B6D4', '#1e293b'], // Cyan-500, Slate-800
        borderWidth: 0,
        borderRadius: 20,
        cutout: '85%',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        callbacks: {
            label: (item) => ` ${item.label}: ${item.raw}%`
        }
      },
    },
  };

  return (
    <div className="relative w-full h-40">
      <Doughnut data={data} options={options} />
      {/* Center Text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-black text-white">78%</span>
        <span className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Flow</span>
      </div>
    </div>
  );
}