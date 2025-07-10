import { google } from 'googleapis';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { IndexingResult, ServiceAccountCredentials } from '../types';

const SERVICE_ACCOUNT_FILE = 'service_account.json';
const SCOPES = ['https://www.googleapis.com/auth/indexing'];

/**
 * Load service account credentials from file
 */
function loadServiceAccountCredentials(): ServiceAccountCredentials {
  const credentialsPath = join(process.cwd(), SERVICE_ACCOUNT_FILE);

  if (!existsSync(credentialsPath)) {
    throw new Error(
      `Service account file not found at ${credentialsPath}. Please place your service_account.json file in the project root.`
    );
  }

  try {
    const credentialsData = readFileSync(credentialsPath, 'utf8');
    return JSON.parse(credentialsData) as ServiceAccountCredentials;
  } catch (error) {
    throw new Error(
      `Failed to read or parse service account file: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Create authenticated Google client
 */
function createGoogleClient() {
  const credentials = loadServiceAccountCredentials();

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  return google.indexing({ version: 'v3', auth });
}

/**
 * Submit a single URL to Google Indexing API
 */
async function indexSingleUrl(url: string): Promise<IndexingResult> {
  try {
    const indexingService = createGoogleClient();

    const response = await indexingService.urlNotifications.publish({
      requestBody: {
        url: url,
        type: 'URL_UPDATED',
      },
    });

    return {
      url,
      success: true,
      response: response.data,
    };
  } catch (error) {
    console.error(`Error indexing URL ${url}:`, error);

    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      // Handle Google API errors
      if ('response' in error && error.response) {
        const apiError = error.response as any;
        errorMessage = apiError.data?.error?.message || apiError.statusText || 'API Error';
      } else if ('message' in error) {
        errorMessage = (error as any).message;
      }
    }

    return {
      url,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Submit multiple URLs to Google Indexing API
 * Each URL is processed individually due to API limitations
 */
export async function indexUrls(urls: string[]): Promise<IndexingResult[]> {
  console.log(`📋 Processing ${urls.length} URLs for indexing...`);

  const results: IndexingResult[] = [];

  // Process URLs one by one to avoid rate limiting
  for (const url of urls) {
    console.log(`🔄 Processing: ${url}`);

    try {
      const result = await indexSingleUrl(url);
      results.push(result);

      if (result.success) {
        console.log(`✅ Successfully submitted: ${url}`);
      } else {
        console.log(`❌ Failed to submit: ${url} - ${result.error}`);
      }
    } catch (error) {
      console.error(`💥 Unexpected error processing ${url}:`, error);
      results.push({
        url,
        success: false,
        error: 'Unexpected error occurred',
      });
    }

    // Add a small delay between requests to be respectful to the API
    if (urls.indexOf(url) < urls.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`📊 Results: ${successful} successful, ${failed} failed, ${results.length} total`);

  return results;
}

/**
 * Check if service account credentials are properly configured
 */
export function checkServiceAccountSetup(): {
  isValid: boolean;
  error?: string;
} {
  try {
    const credentials = loadServiceAccountCredentials();

    // Basic validation
    if (!credentials.client_email || !credentials.private_key) {
      return {
        isValid: false,
        error:
          'Service account credentials are missing required fields (client_email, private_key)',
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get the status of a URL from Google Indexing API
 */
export async function getUrlStatus(url: string): Promise<IndexingResult> {
  try {
    const indexingService = createGoogleClient();

    const response = await indexingService.urlNotifications.getMetadata({
      url: url,
    });

    return {
      url,
      success: true,
      response: response.data,
    };
  } catch (error) {
    console.error(`Error getting status for URL ${url}:`, error);

    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      url,
      success: false,
      error: errorMessage,
    };
  }
}
