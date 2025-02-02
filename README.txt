SCRAPER SERVICE
===============

A Node.js + TypeScript service that:

1. Accepts a URL to scrape (in the background).
2. Extracts <link> tags from the page.
3. Supports checking the scrape status and retrieving the discovered links.
4. Allows canceling a running scrape job.

It uses SQLite as the database, Express for the API, and cheerio + axios for scraping HTML pages.
You can run it locally or in any Node.js environment.

-----------------------------------------------------------------------
TABLE OF CONTENTS
-----------------------------------------------------------------------
1. Features
2. Prerequisites
3. Installation
4. Project Structure
5. Usage
   - Start the Service
   - Endpoints
   - Examples
6. Testing

-----------------------------------------------------------------------
1. FEATURES
-----------------------------------------------------------------------
- POST a URL to start scraping it in the background.
- Returns a numeric ID for the new request immediately.
- Check the status (pending, done, failed, canceled).
- Retrieve link tags if the scrape is done.
- Cancel a pending scrape.
- Uses SQLite for persistence (file named scraper.db).
- Clean, layered architecture (routes, use cases, services, repositories).

-----------------------------------------------------------------------
2. PREREQUISITES
-----------------------------------------------------------------------
- Node.js (version 18+ is needed).
- npm for package management.
- Windows, macOS, or Linux environment.

-----------------------------------------------------------------------
3. INSTALLATION
-----------------------------------------------------------------------
1) Download or extract the project folder.
2) Open a terminal and navigate into the folder.
3) Run:
   npm install
4) Build the TypeScript code:
   npm run build

-----------------------------------------------------------------------
4. PROJECT STRUCTURE
-----------------------------------------------------------------------
scraper-service/
├─ README.txt
├─ jest.config.js
├─ package.json
├─ package-lock.json
├─ tsconfig.json
├─ scraper.db                // SQLite data file (will appear only after the first run)
├─ src/
│  ├─ transactionHelper.ts   
│  ├─ db.ts                  // SQLite init
│  ├─ server.ts              // Main Express server setup
│  ├─ routes.ts              // Defines endpoints
│  ├─ abortSignalStore.ts    // Global scrapers map
│  ├─ models/
│  │  ├─ enums.ts            // Enums (statuses, results)
│  │  └─ index.ts            // Interfaces & types
│  ├─ repositories/
│  │  ├─ requestRepository.ts
│  │  └─ linkRepository.ts
│  ├─ services/
│  │  └─ scrapingService.ts 
│  └─ useCases/
│     ├─ handlePostUrl.ts
│     ├─ handleGetLinks.ts
│     └─ handleCancelScrape.ts
└─ test/
   ├─ handlePostUrl.test.ts
   ├─ handleGetLinks.test.ts
   └─ handleCancelScrape.test.ts

-----------------------------------------------------------------------
5. USAGE
-----------------------------------------------------------------------
START THE SERVICE
-----------------
npm run build
npm start

You should see:
"Server listening on http://localhost:3000"
"Connected to SQLite database at: ..."

ENDPOINTS
---------
1) POST /links?url={the-url}
   Creates a new scrape request, returns { id: number }.

2) GET /links/:id
   Returns { status, links[]? } if found, or 404 if not.
   Status can be pending, done, failed, or canceled.

3) POST /links/:id/cancel
   Cancels a pending scrape.
   Returns { message: "Request canceled" } if canceled.

EXAMPLES
--------
1) Create a new scrape:
   curl -X POST "http://localhost:3000/links?url=https://example.com"
   => { "id": 1 }

2) Check status:
   curl "http://localhost:3000/links/1"
   => { "status": "pending" }
   or => { "status": "done", "links": [ ... ] }

3) Cancel a pending request:
   curl -X POST "http://localhost:3000/links/1/cancel"
   => { "message": "Request canceled" }

-----------------------------------------------------------------------
6. TESTING
-----------------------------------------------------------------------
Run all tests:
npm test

To run a specific test file:
npm test handlePostUrl