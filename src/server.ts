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

// Serve static files
app.use(
  '/static/*',
  serveStatic({
    root: './',
    rewriteRequestPath: (path) => path.replace(/^\/static/, '/public'),
  })
);

// Main page route - serve index.html
app.get('/', serveStatic({ path: './public/index.html' }));

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
