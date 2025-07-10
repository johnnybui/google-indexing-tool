import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { indexUrls } from './services/googleIndexing';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Serve static files (HTML, CSS, JS)
app.use('/static/*', serveStatic({ root: './src/public' }));

// Main page route
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Google Indexing Tool</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
          background: #0a0a0a;
          color: #00ff00;
          line-height: 1.6;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          flex-grow: 1;
        }
        
        .header {
          text-align: center;
          margin-bottom: 3rem;
          padding: 2rem;
          border: 2px solid #00ff00;
          border-radius: 10px;
          background: rgba(0, 255, 0, 0.05);
        }
        
        .title {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          text-shadow: 0 0 10px #00ff00;
        }
        
        .subtitle {
          font-size: 1.2rem;
          color: #00aa00;
          margin-bottom: 0.5rem;
        }
        
        .description {
          color: #888;
          font-size: 0.9rem;
        }
        
        .main-form {
          background: rgba(0, 255, 0, 0.03);
          border: 1px solid #00ff00;
          border-radius: 10px;
          padding: 2rem;
          margin-bottom: 2rem;
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #00ff00;
        }
        
        .url-input {
          width: 100%;
          min-height: 200px;
          background: #111;
          border: 2px solid #333;
          border-radius: 5px;
          padding: 1rem;
          color: #00ff00;
          font-family: inherit;
          font-size: 0.9rem;
          line-height: 1.5;
          resize: vertical;
        }
        
        .url-input:focus {
          outline: none;
          border-color: #00ff00;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        }
        
        .submit-btn {
          background: linear-gradient(45deg, #00ff00, #00aa00);
          color: #000;
          border: none;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .submit-btn:hover {
          background: linear-gradient(45deg, #00aa00, #008800);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 255, 0, 0.4);
        }
        
        .submit-btn:disabled {
          background: #333;
          color: #666;
          cursor: not-allowed;
          transform: none;
        }
        
        .results {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #111;
          border: 1px solid #333;
          border-radius: 10px;
          display: none;
        }
        
        .results.show {
          display: block;
        }
        
        .results h3 {
          color: #00ff00;
          margin-bottom: 1rem;
          font-size: 1.3rem;
        }
        
        .result-item {
          margin-bottom: 1rem;
          padding: 1rem;
          background: rgba(0, 255, 0, 0.05);
          border-left: 4px solid #00ff00;
          border-radius: 5px;
        }
        
        .result-item.error {
          border-left-color: #ff4444;
          background: rgba(255, 68, 68, 0.05);
        }
        
        .result-url {
          font-weight: 600;
          color: #00ff00;
          word-break: break-all;
        }
        
        .result-status {
          margin-top: 0.5rem;
          font-size: 0.9rem;
        }
        
        .success {
          color: #00ff00;
        }
        
        .error {
          color: #ff4444;
        }
        
        .summary {
          margin-top: 1.5rem;
          padding: 1rem;
          background: rgba(0, 255, 0, 0.1);
          border-radius: 5px;
          text-align: center;
        }
        
        .loading {
          display: none;
          text-align: center;
          color: #00ff00;
          font-size: 1.1rem;
        }
        
        .loading.show {
          display: block;
        }
        
        .footer {
          text-align: center;
          padding: 2rem;
          border-top: 1px solid #333;
          color: #666;
          font-size: 0.8rem;
        }
        
        .warning {
          background: rgba(255, 165, 0, 0.1);
          border: 1px solid #ffa500;
          border-radius: 5px;
          padding: 1rem;
          margin-bottom: 2rem;
          color: #ffa500;
        }
        
        .warning strong {
          color: #ff8c00;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        .pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @media (max-width: 768px) {
          .container {
            padding: 1rem;
          }
          
          .title {
            font-size: 2rem;
          }
          
          .subtitle {
            font-size: 1rem;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">⚡ Google Indexing Tool</h1>
          <p class="subtitle">Bulk URL Submission for Google Indexing API</p>
          <p class="description">Submit up to 200 URLs per day • Developer-friendly interface</p>
        </div>
        
        <div class="warning">
          <strong>⚠️ Important:</strong> This tool is for educational/development purposes. Google officially recommends using the Indexing API only for JobPosting and BroadcastEvent content. Daily limit: 200 URLs.
        </div>
        
        <form id="indexingForm" class="main-form">
          <div class="form-group">
            <label for="urls">Enter URLs (one per line):</label>
            <textarea 
              id="urls" 
              name="urls" 
              class="url-input" 
              placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/page3"
              required
            ></textarea>
          </div>
          
          <button type="submit" class="submit-btn" id="submitBtn">
            🚀 Submit URLs for Indexing
          </button>
        </form>
        
        <div class="loading" id="loading">
          <div class="pulse">⏳ Processing URLs... Please wait</div>
        </div>
        
        <div class="results" id="results">
          <h3>📊 Results</h3>
          <div id="resultsContent"></div>
        </div>
      </div>
      
      <div class="footer">
        <p>Made with ❤️ for developers • Built with Bun + Hono</p>
        <p>⚠️ Use responsibly and follow Google's API terms of service</p>
      </div>
      
      <script>
        document.getElementById('indexingForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const urlsTextarea = document.getElementById('urls');
          const submitBtn = document.getElementById('submitBtn');
          const loading = document.getElementById('loading');
          const results = document.getElementById('results');
          const resultsContent = document.getElementById('resultsContent');
          
          // Get URLs and clean them
          const urlsText = urlsTextarea.value.trim();
          if (!urlsText) {
            alert('Please enter at least one URL');
            return;
          }
          
          const urls = urlsText.split('\\n')
            .map(url => url.trim())
            .filter(url => url.length > 0);
          
          if (urls.length === 0) {
            alert('Please enter at least one valid URL');
            return;
          }
          
          // Show loading state
          submitBtn.disabled = true;
          submitBtn.textContent = 'Processing...';
          loading.classList.add('show');
          results.classList.remove('show');
          
          try {
            const response = await fetch('/api/index', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ urls }),
            });
            
            const data = await response.json();
            
            // Hide loading
            loading.classList.remove('show');
            
            if (response.ok) {
              // Show results
              displayResults(data);
              results.classList.add('show');
            } else {
              throw new Error(data.error || 'Failed to process URLs');
            }
            
          } catch (error) {
            loading.classList.remove('show');
            alert('Error: ' + error.message);
          } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '🚀 Submit URLs for Indexing';
          }
        });
        
        function displayResults(data) {
          const resultsContent = document.getElementById('resultsContent');
          
          let html = '';
          
          data.results.forEach(result => {
            const isSuccess = result.success;
            html += \`
              <div class="result-item \${isSuccess ? '' : 'error'}">
                <div class="result-url">\${result.url}</div>
                <div class="result-status \${isSuccess ? 'success' : 'error'}">
                  \${isSuccess ? '✅ Success' : '❌ ' + result.error}
                </div>
              </div>
            \`;
          });
          
          html += \`
            <div class="summary">
              <strong>📈 Summary:</strong> 
              \${data.summary.successful} successful, 
              \${data.summary.failed} failed, 
              \${data.summary.total} total
            </div>
          \`;
          
          resultsContent.innerHTML = html;
        }
      </script>
    </body>
    </html>
  `);
});

// API endpoint for indexing URLs
app.post('/api/index', async (c) => {
  try {
    const body = await c.req.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return c.json({ error: 'No URLs provided' }, 400);
    }

    // Validate URLs
    const validUrls = urls.filter((url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });

    if (validUrls.length === 0) {
      return c.json({ error: 'No valid URLs provided' }, 400);
    }

    // Process URLs with Google Indexing API
    const results = await indexUrls(validUrls);

    return c.json({
      results,
      summary: {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    });
  } catch (error) {
    console.error('Error processing indexing request:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const port = 7920;
console.log(`🚀 Google Indexing Tool running on http://localhost:${port}`);
console.log('📝 Make sure to place your service_account.json file in the project root');

export default {
  port,
  fetch: app.fetch,
};
