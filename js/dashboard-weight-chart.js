function updateWeightChart() {
  const ex = document.getElementById('exercise-select').value;
  if (typeof Chart === 'undefined') {
    const el = document.getElementById('weight-chart');
    if (el) {
      const cx = el.getContext('2d');
      cx.clearRect(0, 0, el.width, el.height);
      cx.fillStyle = '#666';
      cx.font = '13px sans-serif';
      cx.textAlign = 'center';
      cx.fillText('Charts unavailable offline', el.width / 2, el.height / 2 || 110);
    }
    return;
  }
  if (wgtChart) {
    wgtChart.destroy();
    wgtChart = null;
  }
  if (!ex) return;
  const data = workouts.filter(w => w.exercise === ex)
    .map(w => ({
      date: new Date(w.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
      max: Math.max(...w.sets.map(s => s.weight))
    }));
  const ctx = document.getElementById('weight-chart').getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 220);
  grad.addColorStop(0, 'rgba(57,255,143,.25)');
  grad.addColorStop(1, 'rgba(57,255,143,0)');
  wgtChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.date),
      datasets: [{
        label: 'Max Weight',
        data: data.map(d => d.max),
        borderColor: '#39ff8f',
        borderWidth: 2.5,
        backgroundColor: grad,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#39ff8f',
        pointBorderColor: '#080c09',
        pointRadius: 5,
        pointHoverRadius: 9
      }]
    },
    options: mkChartOpts()
  });
}

function mkChartOpts() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeInOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0d1410',
        borderColor: '#1e2e1f',
        borderWidth: 1,
        titleColor: '#2ecc71',
        bodyColor: '#7a9e7e',
        callbacks: { label: c => ' ' + c.raw }
      }
    },
    scales: {
      x: { grid: { color: '#1e2e1f' }, ticks: { color: '#4a6a4e', font: { family: 'DM Mono', size: 9 }, maxTicksLimit: 6 } },
      y: { grid: { color: '#1e2e1f' }, ticks: { color: '#4a6a4e', font: { family: 'DM Mono', size: 9 } }, beginAtZero: true }
    }
  };
}
