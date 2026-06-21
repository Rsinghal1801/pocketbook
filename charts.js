const Charts = (() => {
  let flow, donut;

  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  function gridColor() { return css('--line'); }
  function tickColor() { return css('--text-faint'); }

  function baseOpts() {
    Chart.defaults.font.family = "'Inter', sans-serif";
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    };
  }

  function renderFlow(months, income, expense) {
    const ctx = document.getElementById('flowChart');
    if (flow) flow.destroy();
    flow = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { label: 'Income',   data: income,  backgroundColor: css('--up'),  borderRadius: 6, maxBarThickness: 22 },
          { label: 'Spending', data: expense, backgroundColor: css('--down'), borderRadius: 6, maxBarThickness: 22 },
        ],
      },
      options: {
        ...baseOpts(),
        scales: {
          x: { grid: { display: false }, ticks: { color: tickColor() } },
          y: {
            grid: { color: gridColor() },
            border: { display: false },
            ticks: { color: tickColor(), callback: v => '$' + (v / 1000).toFixed(1) + 'k' },
          },
        },
        plugins: {
          ...baseOpts().plugins,
          tooltip: { callbacks: { label: c => ` ${c.dataset.label}: $${c.raw.toLocaleString()}` } },
        },
      },
    });
  }

  function renderDonut(labels, values, colors) {
    const ctx = document.getElementById('categoryChart');
    if (donut) donut.destroy();
    donut = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }] },
      options: {
        ...baseOpts(),
        cutout: '72%',
        plugins: {
          ...baseOpts().plugins,
          tooltip: { callbacks: { label: c => ` ${c.label}: $${c.raw.toLocaleString(undefined,{minimumFractionDigits:2})}` } },
        },
      },
    });
  }

  function retheme(payload) { if (payload) { renderFlow(payload.months, payload.income, payload.expense); renderDonut(payload.donutLabels, payload.donutValues, payload.donutColors); } }

  return { renderFlow, renderDonut, retheme };
})();
