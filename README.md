# Google Indexing Tool

A modern, dark-themed web application built with Bun for bulk Google Indexing API requests. This tool allows developers to submit multiple URLs for Google indexing through a clean, hacker-style interface.

## Features

- 🚀 **Bulk URL Processing**: Submit multiple URLs (up to 200 per day)
- 🌙 **Dark Theme**: Modern, developer-friendly interface
- ⚡ **Bun Runtime**: Fast TypeScript execution
- 🎯 **Individual API Calls**: Each URL processed separately for reliable results
- 🔧 **Developer-Friendly**: Clear error messages and detailed responses
- 📝 **Code Quality**: Biome for formatting and linting

## Prerequisites

- [Bun](https://bun.sh/) v1.0.0 or higher
- Google Cloud Platform account
- Google Search Console property verification

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd google-indexing-tool
```

2. Install dependencies:
```bash
bun install
```

3. Set up your Google service account (see [Google API Setup](#google-api-setup))

4. Place your `service_account.json` file in the project root

5. Start the development server:
```bash
bun run dev
```

6. Open your browser and navigate to `http://localhost:7920`

## Google API Setup

### Step 1: Create a Google Cloud Platform Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Indexing API**:
   - Navigate to APIs & Services > Library
   - Search for "Indexing API"
   - Click "Enable"

### Step 2: Create a Service Account

1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - **Name**: `google-indexing-tool`
   - **Description**: `Service account for Google Indexing API`
4. Click "Create and Continue"
5. Set the role to **Owner**
6. Click "Done"

### Step 3: Generate Service Account Key

1. In the Credentials page, find your service account
2. Click on the service account email
3. Go to the "Keys" tab
4. Click "Add Key" > "Create New Key"
5. Select **JSON** format
6. Download the key file
7. **Rename it to `service_account.json`** and place it in your project root

### Step 4: Add Service Account to Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your verified property
3. Click "Settings" (gear icon)
4. Click "Users and permissions"
5. Click "Add user"
6. Enter the **service account email** (from the JSON file)
7. Set permission level to **Owner**
8. Click "Add"

## Usage

1. Start the application:
```bash
bun run start
```

2. Open your browser and go to `http://localhost:7920`

3. In the textarea, enter your URLs (one per line):
```
https://example.com/page1
https://example.com/page2
https://example.com/page3
```

4. Click "Submit URLs for Indexing"

5. View the results for each URL submission

## API Endpoints

- `GET /` - Serve the main application
- `POST /api/index` - Submit URLs for Google indexing

### Request Format

```json
{
  "urls": [
    "https://example.com/page1",
    "https://example.com/page2"
  ]
}
```

### Response Format

```json
{
  "results": [
    {
      "url": "https://example.com/page1",
      "success": true,
      "response": { ... }
    },
    {
      "url": "https://example.com/page2",
      "success": false,
      "error": "Error message"
    }
  ],
  "summary": {
    "total": 2,
    "successful": 1,
    "failed": 1
  }
}
```

## Development

### Scripts

- `bun run dev` - Start development server with hot reload
- `bun run start` - Start production server
- `bun run build` - Build for production
- `bun run lint` - Run Biome linting
- `bun run format` - Format code with Biome
- `bun run check` - Run Biome checks
- `bun run type-check` - TypeScript type checking

### Code Quality

This project uses [Biome](https://biomejs.dev/) for code formatting and linting. Run `bun run check` to ensure your code meets the project standards.

## Important Notes

- **Daily Limit**: Google Indexing API has a limit of 200 URLs per day
- **Official Use**: Google recommends using this API only for JobPosting and BroadcastEvent content
- **Rate Limiting**: The API may rate limit requests; the tool handles this gracefully
- **No Guarantees**: Submitting URLs doesn't guarantee they will be indexed

## Security

- Never commit your `service_account.json` file to version control
- The `.gitignore` file includes patterns to prevent accidental commits
- Keep your service account credentials secure

## Troubleshooting

### Common Errors

1. **403 Permission Denied**: Make sure your service account is added as an owner in Google Search Console
2. **404 Not Found**: Enable the Google Indexing API in your Google Cloud project
3. **Rate Limiting**: Wait a few minutes between large batches of requests

### Debug Mode

Set the `DEBUG` environment variable to see detailed API responses:
```bash
DEBUG=true bun run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `bun run check` to ensure code quality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This tool is for educational and development purposes. Use responsibly and in accordance with Google's Terms of Service and API usage policies. 