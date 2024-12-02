function renderCampaignPerformanceGraph(data) {
    const ctx = document.getElementById("campaignPerformanceChart").getContext("2d");

    // Group submissions by campaign name
    const campaignCounts = data.reduce((acc, row) => {
        const campaignName = row["Campaign Name"] || "Unknown Campaign";
        acc[campaignName] = (acc[campaignName] || 0) + 1;
        return acc;
    }, {});

    const labels = Object.keys(campaignCounts);
    const values = Object.values(campaignCounts);

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Submissions by Campaign",
                    data: values,
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                },
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Campaign Name",
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
