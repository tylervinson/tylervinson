function renderDailyTrendsGraph(data) {
    const ctx = document.getElementById("dailyTrendsChart").getContext("2d");

    // Group submissions by date
    const dailyCounts = data.reduce((acc, row) => {
        const date = row.date;
        if (date) {
            acc[date] = (acc[date] || 0) + 1;
        }
        return acc;
    }, {});

    const labels = Object.keys(dailyCounts).sort();
    const values = labels.map((date) => dailyCounts[date]);

    new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Daily Submissions",
                    data: values,
                    borderColor: "rgba(75, 192, 192, 1)",
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    borderWidth: 1,
                    fill: true,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Date",
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: "Number of Submissions",
                    },
                    beginAtZero: true,
                },
            },
        },
    });
}
