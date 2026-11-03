let formData = {}; // Store datasets for multiple forms
let currentForm = null; // Track the currently selected form

// Preprocess data to ensure a consistent "date" field
function preprocessData(data) {
    const timestampFields = ["Time", "Date", "Submission Time"]; // Possible column names
    let dateField = "date"; // Default to "date"

    // Detect the appropriate column
    for (const field of timestampFields) {
        if (data.length > 0 && data[0][field]) {
            dateField = field;
            break;
        }
    }

    console.log("Detected Date Field:", dateField); // Debug log

    return data.map((row, index) => {
        if (row[dateField]) {
            row.date = row[dateField]; // Map detected column to "date"
        } else {
            console.warn(`Row ${index} missing a date field:`, row); // Log any rows missing a date
        }
        return row;
    });
}

// Analyze form data (basic functionality without date filters)
function analyzeFormData(formName) {
    const originalData = formData[formName];
    if (!originalData) {
        console.error("No data found for the selected form.");
        return;
    }

    console.log(`Analyzing data for ${formName}:`, originalData);
    alert(`Data for ${formName}: ${originalData.length} entries found.`);
}

// Update form selector
function updateFormSelector(formName) {
    const selector = document.getElementById("formSelector");

    // Add the form name to the dropdown
    const option = document.createElement("option");
    option.value = formName;
    option.textContent = formName;
    selector.appendChild(option);

    if (!currentForm) {
        currentForm = formName;
        analyzeFormData(formName);
    }

    selector.addEventListener("change", (event) => {
        currentForm = event.target.value;
        analyzeFormData(currentForm);
    });
}

// Load CSV data
document.getElementById("loadData").addEventListener("click", () => {
    const fileInput = document.getElementById("formFile").files[0];
    if (fileInput) {
        Papa.parse(fileInput, {
            header: true,
            complete: (result) => {
                const formName = fileInput.name.split(".")[0];
                formData[formName] = preprocessData(result.data);
                updateFormSelector(formName);
                alert(`Data for ${formName} loaded!`);
            },
        });
    } else {
        alert("Please upload a CSV file.");
    }
});
