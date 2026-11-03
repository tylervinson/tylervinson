const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { DOMParser } = require('@xmldom/xmldom');
const xpath = require('xpath');
const os = require('os');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Setup file upload storage
const upload = multer({ 
  dest: path.join(os.tmpdir(), 'sitemap-uploads/'),
  limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB
});

// Serve static files from public directory
app.use(express.static('public'));
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadDir = path.join(os.tmpdir(), 'sitemap-uploads/');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Search a sitemap XML file for URLs that match the search criteria
 * @param {string} sitemapPath - URL or local path to the sitemap XML file
 * @param {string} searchTerm - Term to search for in the URLs
 * @param {boolean} caseSensitive - Whether the search should be case-sensitive
 * @param {boolean} isUrl - Whether the sitemapPath is a URL or local file path
 * @returns {Promise<string[]>} - List of URLs that match the search criteria
 */
async function searchSitemap(sitemapPath, searchTerm, caseSensitive = false, isUrl = true) {
  try {
    // Get the XML content
    let xmlContent;
    if (isUrl) {
      const response = await axios.get(sitemapPath);
      xmlContent = response.data;
    } else {
      xmlContent = fs.readFileSync(sitemapPath, 'utf8');
    }

    // Parse the XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');

    // Create XPath selector with namespaces
    const select = xpath.useNamespaces({
      ns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
      xhtml: 'http://www.w3.org/1999/xhtml',
      video: 'http://www.google.com/schemas/sitemap-video/1.1',
      image: 'http://www.google.com/schemas/sitemap-image/1.1'
    });

    // Find all loc elements
    const locElements = select('//ns:url/ns:loc', doc);

    // Prepare regex for search
    const regex = new RegExp(searchTerm, caseSensitive ? '' : 'i');

    // Filter URLs based on search term
    const matchingUrls = [];
    for (let i = 0; i < locElements.length; i++) {
      const url = locElements[i].textContent;
      if (regex.test(url)) {
        matchingUrls.push(url);
      }
    }

    return matchingUrls;
  } catch (error) {
    console.error(`Error processing sitemap ${sitemapPath}:`, error.message);
    throw error;
  }
}

// API endpoint for searching URL sitemaps
app.post('/api/search-url', async (req, res) => {
  const { url, searchTerm, caseSensitive } = req.body;
  
  if (!url || !searchTerm) {
    return res.status(400).json({ error: 'URL and search term are required' });
  }
  
  try {
    const results = await searchSitemap(url, searchTerm, caseSensitive, true);
    return res.json({ results, count: results.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// API endpoint for uploading and searching XML files
app.post('/api/search-file', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const { searchTerm, caseSensitive } = req.body;
  
  if (!searchTerm) {
    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Search term is required' });
  }
  
  try {
    const results = await searchSitemap(req.file.path, searchTerm, caseSensitive === 'true', false);
    
    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);
    
    return res.json({ results, count: results.length });
  } catch (error) {
    // Clean up the uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Sitemap Search server running at http://localhost:${port}`);
});