import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Analytics = ({ guests }) => {
  // Process data for monthly bookings
  const processMonthlyData = () => {
    const monthlyData = new Array(12).fill(0);
    const monthlyGuests = new Array(12).fill(0);

    guests.forEach(guest => {
      if (guest.registrationDate) {
        const date = guest.registrationDate.toDate();
        const month = date.getMonth();
        monthlyData[month]++;
        // Add primary guest
        monthlyGuests[month]++;
        // Add additional guests if any
        if (guest.additionalGuests) {
          monthlyGuests[month] += guest.additionalGuests.length;
        }
      }
    });

    return { monthlyData, monthlyGuests };
  };

  // Process data for current month's daily bookings
  const processCurrentMonthData = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Initialize arrays for the current month
    const dailyBookings = new Array(daysInMonth).fill(0);
    const dailyGuests = new Array(daysInMonth).fill(0);

    guests.forEach(guest => {
      if (guest.registrationDate) {
        const date = guest.registrationDate.toDate();
        // Check if booking is from current month
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          const day = date.getDate() - 1; // Arrays are 0-based
          dailyBookings[day]++;
          // Add primary guest
          dailyGuests[day]++;
          // Add additional guests if any
          if (guest.additionalGuests) {
            dailyGuests[day] += guest.additionalGuests.length;
          }
        }
      }
    });

    return { dailyBookings, dailyGuests, daysInMonth };
  };

  const { monthlyData, monthlyGuests } = processMonthlyData();
  const { dailyBookings, dailyGuests, daysInMonth } = processCurrentMonthData();

  // Bar chart data for monthly bookings
  const bookingsData = {
    labels: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    datasets: [
      {
        label: 'Number of Bookings',
        data: monthlyData,
        backgroundColor: 'rgba(102, 126, 234, 0.6)',
        borderColor: 'rgb(102, 126, 234)',
        borderWidth: 1,
      },
      {
        label: 'Total Guests',
        data: monthlyGuests,
        backgroundColor: 'rgba(237, 100, 166, 0.6)',
        borderColor: 'rgb(237, 100, 166)',
        borderWidth: 1,
      }
    ],
  };

  // Current month's daily bookings data
  const currentMonthData = {
    labels: Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`),
    datasets: [
      {
        label: 'Daily Bookings',
        data: dailyBookings,
        backgroundColor: 'rgba(72, 187, 120, 0.6)',
        borderColor: 'rgb(72, 187, 120)',
        borderWidth: 1,
      },
      {
        label: 'Daily Guests',
        data: dailyGuests,
        backgroundColor: 'rgba(246, 173, 85, 0.6)',
        borderColor: 'rgb(246, 173, 85)',
        borderWidth: 1,
      }
    ],
  };

  // Bar chart options
  const bookingsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Bookings & Guest Count',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  // Current month chart options
  const currentMonthOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Bookings for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  // Process data for guest nationality distribution
  const processNationalityData = () => {
    const nationalityCount = {};
    
    guests.forEach(guest => {
      // Count primary guest
      if (guest.nationality) {
        nationalityCount[guest.nationality] = (nationalityCount[guest.nationality] || 0) + 1;
      }
      
      // Count additional guests
      if (guest.additionalGuests) {
        guest.additionalGuests.forEach(additionalGuest => {
          if (additionalGuest.nationality) {
            nationalityCount[additionalGuest.nationality] = 
              (nationalityCount[additionalGuest.nationality] || 0) + 1;
          }
        });
      }
    });

    return nationalityCount;
  };

  const nationalityData = processNationalityData();

  // Pie chart data for nationality distribution
  const nationalityChartData = {
    labels: Object.keys(nationalityData),
    datasets: [
      {
        data: Object.values(nationalityData),
        backgroundColor: [
          'rgba(102, 126, 234, 0.6)',
          'rgba(237, 100, 166, 0.6)',
          'rgba(72, 187, 120, 0.6)',
          'rgba(246, 173, 85, 0.6)',
          'rgba(79, 209, 197, 0.6)',
          'rgba(159, 122, 234, 0.6)',
        ],
        borderColor: [
          'rgb(102, 126, 234)',
          'rgb(237, 100, 166)',
          'rgb(72, 187, 120)',
          'rgb(246, 173, 85)',
          'rgb(79, 209, 197)',
          'rgb(159, 122, 234)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Pie chart options
  const nationalityOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Guest Nationality Distribution',
        font: {
          size: 16,
        },
      },
    },
  };

  return (
    <div className="analytics-container">
      <div className="chart-container">
        <div className="bar-chart">
          <Bar data={bookingsData} options={bookingsOptions} />
        </div>
        <div className="pie-chart">
          <Pie data={nationalityChartData} options={nationalityOptions} />
        </div>
      </div>
      <div className="current-month-chart">
        <Bar data={currentMonthData} options={currentMonthOptions} />
      </div>
    </div>
  );
};

export default Analytics; 