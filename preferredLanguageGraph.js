function renderPreferredLanguageGraph(data) {
    const ctx = document.getElementById("preferredLanguageChart").getContext("2d");

    // Group submissions by preferred language
    const languageCounts = data.reduce((acc, row) => {
        const language = row["Preferred Language"] || "Unknown";
        acc[language] = (acc[language] || 0) + 1;
        return acc;
    }, {});

    const labels = Object.keys(languageCounts);
    const values = Object.values(languageCounts);

    new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Preferred Language Distribution",
                    data: values,
                    backgroundColor: [
                        "rgba(255, 99, 132, 0.2)",
                        "rgba(54, 162, 235, 0.2)",
                        "rgba(255, 206, 86, 0.2)",
                        "rgba(75, 192, 192, 0.2)",
                        "rgba(153, 102, 255, 0.2)",
                    ],
                    borderColor: [
                        "rgba(255, 99, 132, 1)",
                        "rgba(54, 162, 235, 1)",
                        "rgba(255, 206, 86, 1)",
                        "rgba(75, 192, 192, 1)",
                        "rgba(153, 102, 255, 1)",
                    ],
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "top",
                },
            },
        },
    });
}
