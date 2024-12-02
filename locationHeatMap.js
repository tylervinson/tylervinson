function renderLocationHeatMap(data) {
    // Initialize the map
    const map = L.map("map").setView([37.7749, -122.4194], 5); // Default center (USA)

    // Add base tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Collect latitude and longitude from the data
    const heatPoints = data
        .filter((row) => row.Latitude && row.Longitude) // Ensure coordinates exist
        .map((row) => [parseFloat(row.Latitude), parseFloat(row.Longitude), 1]); // Format: [lat, lng, intensity]

    if (heatPoints.length > 0) {
        // Add heat map layer
        L.heatLayer(heatPoints, {
            radius: 20,
            blur: 15,
            maxZoom: 10,
        }).addTo(map);
    } else {
        console.warn("No valid location data available for the heat map.");
    }
}
