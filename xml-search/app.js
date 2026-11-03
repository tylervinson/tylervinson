document.addEventListener('DOMContentLoaded', () => {
  // Tab functionality
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and panes
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      // Add active class to clicked button and corresponding pane
      button.classList.add('active');
      document.getElementById(button.dataset.tab).classList.add('active');
    });
  });
  
  // URL form submission
  const urlForm = document.getElementById('url-form');
  urlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const sitemapUrl = document.getElementById('sitemap-url').value;
    const searchTerm = document.getElementById('url-search-term').value;
    const caseSensitive = document.getElementById('url-case-sensitive').checked;
    
    await performUrlSearch(sitemapUrl, searchTerm, caseSensitive);
  });
  
  // File form submission
  const fileForm = document.getElementById('file-form');
  fileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('sitemap-file');
    
    if (!fileInput.files || fileInput.files.length === 0) {
      showError('Please select an XML file to upload');
      return;
    }
    
    const file = fileInput.files[0];
    const searchTerm = document.getElementById('file-search-term').value;
    const caseSensitive = document.getElementById('file-case-sensitive').checked;
    
    await performFileSearch(file, searchTerm, caseSensitive);
  });
  
  // Copy results button
  const copyButton = document.getElementById('copy-results');
  copyButton.addEventListener('click', () => {
    const resultItems = document.querySelectorAll('.result-item');
    const text = Array.from(resultItems)
      .map(item => item.textContent)
      .join('\n');
    
    navigator.clipboard.writeText(text)
      .then(() => {
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
          copyButton.textContent = originalText;
        }, 2000);
      })
      .catch(err => {
        showError('Failed to copy results: ' + err.message);
      });
  });
  
  // Download results button
  const downloadButton = document.getElementById('download-results');
  downloadButton.addEventListener('click', () => {
    const resultItems = document.querySelectorAll('.result-item');
    const text = Array.from(resultItems)
      .map(item => item.textContent)
      .join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap-search-results.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  
  // Function to perform URL search
  async function performUrlSearch(url, searchTerm, caseSensitive) {
    showLoading(true);
    clearResults();
    
    try {
      const response = await fetch('/api/search-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          searchTerm,
          caseSensitive
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to perform search');
      }
      
      const data = await response.json();
      displayResults(data.results);
    } catch (error) {
      showError(error.message);
    } finally {
      showLoading(false);
    }
  }
  
  // Function to perform file search
  async function performFileSearch(file, searchTerm, caseSensitive) {
    showLoading(true);
    clearResults();
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('searchTerm', searchTerm);
      formData.append('caseSensitive', caseSensitive);
      
      const response = await fetch('/api/search-file', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to perform search');
      }
      
      const data = await response.json();
      displayResults(data.results);
    } catch (error) {
      showError(error.message);
    } finally {
      showLoading(false);
    }
  }
  
  // Function to display results
  function displayResults(results) {
    const resultsElement = document.getElementById('results');
    const resultCountElement = document.getElementById('result-count');
    resultCountElement.textContent = `(${results.length})`;
    
    if (results.length === 0) {
      resultsElement.innerHTML = '<div class="result-item">No matching URLs found.</div>';
      document.getElementById('copy-results').disabled = true;
      document.getElementById('download-results').disabled = true;
      return;
    }
    
    results.forEach(url => {
      const resultItem = document.createElement('div');
      resultItem.className = 'result-item';
      
      const link = document.createElement('a');
      link.href = url;
      link.textContent = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      resultItem.appendChild(link);
      resultsElement.appendChild(resultItem);
    });
    
    document.getElementById('copy-results').disabled = false;
    document.getElementById('download-results').disabled = false;
  }
  
  // Function to show/hide loading spinner
  function showLoading(isLoading) {
    document.getElementById('loading').style.display = isLoading ? 'flex' : 'none';
  }
  
  // Function to clear results
  function clearResults() {
    const resultsElement = document.getElementById('results');
    resultsElement.innerHTML = '';
    
    const resultCountElement = document.getElementById('result-count');
    resultCountElement.textContent = '(0)';
    
    document.getElementById('copy-results').disabled = true;
    document.getElementById('download-results').disabled = true;
    
    const existingError = document.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
  }
  
  // Function to show error message
  function showError(message) {
    // Remove any existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    const resultsContainer = document.querySelector('.results-container');
    resultsContainer.insertBefore(errorElement, document.getElementById('results'));
  }
});