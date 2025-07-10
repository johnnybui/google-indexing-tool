import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { streamSSE } from 'hono/streaming';
import { indexUrls, indexUrlsStream } from './services/googleIndexing';

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
          background: #0d1117;
          color: #e6edf3;
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
          border: 2px solid #30363d;
          border-radius: 10px;
          background: #161b22;
        }
        
        .title {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          color: #58a6ff;
          text-shadow: 0 0 20px rgba(88, 166, 255, 0.3);
        }
        
        .subtitle {
          font-size: 1.2rem;
          color: #79c0ff;
          margin-bottom: 0.5rem;
        }
        
        .description {
          color: #8b949e;
          font-size: 0.9rem;
        }
        
        .main-form {
          background: #161b22;
          border: 1px solid #30363d;
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
          color: #f0f6fc;
        }
        
        .url-input {
          width: 100%;
          min-height: 200px;
          background: #0d1117;
          border: 2px solid #30363d;
          border-radius: 5px;
          padding: 1rem;
          color: #e6edf3;
          font-family: inherit;
          font-size: 0.9rem;
          line-height: 1.5;
          resize: vertical;
        }
        
        .url-input:focus {
          outline: none;
          border-color: #58a6ff;
          box-shadow: 0 0 10px rgba(88, 166, 255, 0.3);
        }
        
        .submit-btn {
          background: linear-gradient(45deg, #238636, #2ea043);
          color: #ffffff;
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
          background: linear-gradient(45deg, #2ea043, #238636);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(46, 160, 67, 0.4);
        }
        
        .submit-btn:disabled {
          background: #30363d;
          color: #8b949e;
          cursor: not-allowed;
          transform: none;
        }
        
        .results {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 10px;
          display: none;
        }
        
        .results.show {
          display: block;
        }
        
        .results h3 {
          color: #58a6ff;
          margin-bottom: 1rem;
          font-size: 1.3rem;
        }
        
        .result-item {
          margin-bottom: 1rem;
          padding: 1rem;
          background: #0d1117;
          border-left: 4px solid #2ea043;
          border-radius: 5px;
        }
        
        .result-item.error {
          border-left-color: #f85149;
          background: #0d1117;
        }
        
        .result-url {
          font-weight: 600;
          color: #79c0ff;
          word-break: break-all;
        }
        
        .result-status {
          margin-top: 0.5rem;
          font-size: 0.9rem;
        }
        
        .success {
          color: #2ea043;
        }
        
        .error {
          color: #f85149;
        }
        
        .summary {
          margin-top: 1.5rem;
          padding: 1rem;
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 5px;
          text-align: center;
        }
        
        .loading {
          display: none;
          text-align: center;
          color: #58a6ff;
          font-size: 1.1rem;
        }
        
        .loading.show {
          display: block;
        }
        
        .footer {
          text-align: center;
          padding: 2rem;
          border-top: 1px solid #30363d;
          color: #8b949e;
          font-size: 0.8rem;
        }
        
        .warning {
          background: #1c2128;
          border: 1px solid #d29922;
          border-radius: 5px;
          padding: 1rem;
          margin-bottom: 2rem;
          color: #e3b341;
        }
        
        .warning strong {
          color: #f2cc60;
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
          
          // Clear previous results
          resultsContent.innerHTML = '';
          
          try {
            // Make streaming request
            const response = await fetch('/api/index/stream', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ urls }),
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to start processing');
            }
            
            // Show results container
            results.classList.add('show');
            
            // Process the streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.substring(6));
                    
                    // Handle different event types based on the data structure
                    if (data.url) {
                      // This is a result for a specific URL
                      addResultItem(data);
                    } else if (data.total !== undefined) {
                      // This is the summary
                      updateSummary(data);
                    } else if (data.message) {
                      // This is a status message
                      console.log('Status:', data.message);
                    }
                  } catch (e) {
                    console.error('Error parsing SSE data:', e);
                  }
                } else if (line.startsWith('event: complete')) {
                  console.log('Processing completed');
                  break;
                }
              }
            }
            
            // Hide loading
            loading.classList.remove('show');
            
          } catch (error) {
            loading.classList.remove('show');
            alert('Error: ' + error.message);
          } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '🚀 Submit URLs for Indexing';
          }
        });
        
        function addResultItem(result) {
          const resultsContent = document.getElementById('resultsContent');
          const isSuccess = result.success;
          
          const resultDiv = document.createElement('div');
          resultDiv.className = \`result-item \${isSuccess ? '' : 'error'}\`;
          resultDiv.innerHTML = \`
            <div class="result-url">\${result.url}</div>
            <div class="result-status \${isSuccess ? 'success' : 'error'}">
              \${isSuccess ? '✅ Success' : '❌ ' + result.error}
            </div>
          \`;
          
          resultsContent.appendChild(resultDiv);
        }
        
        function updateSummary(summary) {
          const resultsContent = document.getElementById('resultsContent');
          
          // Remove existing summary if any
          const existingSummary = resultsContent.querySelector('.summary');
          if (existingSummary) {
            existingSummary.remove();
          }
          
          // Add new summary
          const summaryDiv = document.createElement('div');
          summaryDiv.className = 'summary';
          summaryDiv.innerHTML = \`
            <strong>📈 Summary:</strong> 
            \${summary.successful} successful, 
            \${summary.failed} failed, 
            \${summary.total} total
          \`;
          
          resultsContent.appendChild(summaryDiv);
        }
        
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

// Streaming API endpoint for indexing URLs
app.post('/api/index/stream', async (c) => {
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

    // Set up Server-Sent Events
    return streamSSE(c, async (stream) => {
      try {
        // Send initial message
        await stream.writeSSE({
          event: 'start',
          data: JSON.stringify({ message: `Starting to process ${validUrls.length} URLs...` }),
        });

        // Process URLs with streaming
        for await (const result of indexUrlsStream(validUrls)) {
          if ('type' in result && result.type === 'summary') {
            await stream.writeSSE({
              event: 'summary',
              data: JSON.stringify(result.data),
            });
          } else {
            await stream.writeSSE({
              event: 'result',
              data: JSON.stringify(result),
            });
          }
        }

        // Send completion message
        await stream.writeSSE({
          event: 'complete',
          data: JSON.stringify({ message: 'Processing completed' }),
        });
      } catch (error) {
        console.error('Error in streaming:', error);
        await stream.writeSSE({
          event: 'error',
          data: JSON.stringify({ error: 'Internal server error' }),
        });
      }
    });
  } catch (error) {
    console.error('Error setting up streaming:', error);
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
