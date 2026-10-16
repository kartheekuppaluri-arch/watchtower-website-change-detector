# WatchTower --- Website Change Detection & Diff Engine

**Track website changes without checking every page manually.**

WatchTower is a full-stack web application for monitoring public web
pages, comparing captured versions, and highlighting changes that may
matter. It brings together a web dashboard, a crawling and comparison
pipeline, noise-filtering logic, and monitor history.

**Live Application (Vercel):** [https://watchtower-website-change-detector.vercel.app/](https://watchtower-website-change-detector.vercel.app/)  
**Backend API (Render):** [https://watchtower-website-change-detector-v2.onrender.com](https://watchtower-website-change-detector-v2.onrender.com)  
**Repository:** [GitHub](https://github.com/kartheekuppaluri-arch/watchtower-website-change-detector)

------------------------------------------------------------------------

## Why WatchTower?

Website content can change without notice. Checking pages manually is
repetitive, and basic page comparisons can produce noisy results when
content includes clocks, timestamps, rotating banners, or other dynamic
elements.

WatchTower explores how to automate this workflow by fetching page
content, normalizing it, comparing versions, and presenting differences
through a dashboard.

## Features

The repository includes modules and UI for the following capabilities.
Individual workflows should be tested in the local application before
relying on them in a live environment.

-   **Website monitors** --- create and manage monitored URLs.
-   **Content crawling** --- retrieve page content for analysis.
-   **Change comparison** --- compare versions and highlight additions
    or removals.
-   **Noise filtering** --- ignore selected page regions and normalize
    common dynamic values.
-   **Monitor history** --- view recorded versions and related change
    information.
-   **Visual selector tools** --- configure regions to watch or ignore,
    where supported by the current workflow.
-   **Testing Studio** --- mock targets for experimenting with store,
    news, and status-page scenarios.
-   **Alert and digest components** --- code for processing change
    notifications and summaries.
-   **API endpoints** --- backend routes for monitor management and
    related operations.

## How It Works

At a high level, the monitoring pipeline is designed to:

1.  Accept a website monitor configuration.
2.  Fetch the target page.
3.  Extract and normalize relevant content.
4.  Compare the new content with a previously captured version.
5.  Filter likely noise and determine whether a meaningful difference
    exists.
6.  Record the result and pass detected changes to the alert-processing
    logic.
7.  Present monitor status and change history in the dashboard.

The exact behavior depends on the configured monitor and the target
website. Some pages may block automated requests or rely on client-side
JavaScript to render their content.

## Architecture

``` text
┌──────────────────────────────────────────────────┐
│                  React Frontend                  │
│             Dashboard and Components             │
└────────────────────────┬─────────────────────────┘
                         │ HTTP requests
                         ▼
┌──────────────────────────────────────────────────┐
│                 Backend API                      │
│            Node.js / Express routes              │
└────────────────────────┬─────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────┐
│               Monitoring Pipeline                │
│                                                  │
│  Crawler → Content Extraction → Noise Filtering  │
│                         → Diff Engine             │
└────────────────────────┬─────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────┐
│          Data Layer, History and Alerts           │
└──────────────────────────────────────────────────┘
```

The codebase separates the UI, API, crawler, comparison logic, noise
filtering, scheduling, and data-layer code into distinct modules.

## Technology Stack

-   **Frontend:** React, Vite, JavaScript, CSS, Lucide icons
-   **Backend:** Node.js, Express
-   **Crawling and parsing:** Cheerio and Puppeteer-related tooling
-   **Comparison:** `jsdiff`, `pixelmatch`, and `pngjs`
-   **Data layer:** Implemented in `server/db.js`
-   **Development and version control:** npm, Git, GitHub
-   **Deployment exploration:** Vercel

The crawler's capabilities can differ between local and serverless
environments. For example, local browser-based rendering may depend on
an installed Chrome or Edge browser, while serverless execution has
different runtime and filesystem constraints.

## Run Locally

### Prerequisites

-   Node.js 18 or later
-   npm
-   Google Chrome or Microsoft Edge if using browser-based screenshot
    functionality

### Setup

Clone the repository:

``` bash
git clone https://github.com/kartheekuppaluri-arch/watchtower-website-change-detector.git
cd watchtower-website-change-detector
```

Install dependencies:

``` bash
npm install
```

Start the development environment:

``` bash
npm run dev
```

The project is configured to run the frontend and backend together in
development. If startup fails, check the scripts in `package.json` and
the terminal output for the exact error.

Common local addresses:

-   **Frontend:** `http://localhost:5173`
-   **Backend API:** `http://localhost:3001`
-   **Mock store:** `http://localhost:3001/mock/store`
-   **Mock news page:** `http://localhost:3001/mock/news`
-   **Mock status page:** `http://localhost:3001/mock/status`

These addresses assume the development server uses the default ports
configured in the project.

### Build Check

To verify that the frontend production build completes:

``` bash
npm run build
```

A successful build checks compilation and bundling; it does not, by
itself, verify that every API route or monitoring workflow works.

## API Overview

The backend code includes routes intended for these operations:

  ----------------------------------------------------------------------------
  Endpoint                     Method                  Purpose
  ---------------------------- ----------------------- -----------------------
  `/api/monitors`              `GET`                   List monitors

  `/api/monitors`              `POST`                  Create a monitor

  `/api/monitors/:id`          `GET`                   Retrieve monitor
                                                       details and history

  `/api/monitors/:id`          `PUT`                   Update monitor settings

  `/api/monitors/:id`          `DELETE`                Delete a monitor

  `/api/monitors/:id/check`    `POST`                  Trigger a manual check

  `/api/monitors/check-all`    `POST` / `GET`          Trigger checks across
                                                       active monitors

  `/api/diff/compare`          `POST`                  Compare snapshots

  `/api/picker/inspect`        `POST`                  Inspect page structure
                                                       for selector
                                                       configuration

  `/api/alerts/test-webhook`   `POST`                  Test webhook delivery

  `/api/monitors/:id/rss`      `GET`                   Return a monitor RSS
                                                       feed

  `/api/digest`                `GET`                   Retrieve a change
                                                       digest
  ----------------------------------------------------------------------------

**Note:** This table documents the intended API surface in the codebase;
it should not be interpreted as confirmation that these routes are
currently reachable in the Vercel deployment.

## Deployment Status

The project has been deployed to Vercel as an experiment in hosting the
frontend and backend together. The current hosted version has an
unresolved API routing issue: requests to the monitor API return
`404 Not Found`.

The local development environment is the current demonstration
environment.

Before treating the hosted version as production-ready, the following
still need to be verified:

-   Correct routing for every required API endpoint.
-   Reliable persistent storage across serverless invocations.
-   Scheduled monitoring under the hosting platform's execution model.
-   Crawler behavior and time limits in the deployed runtime.
-   End-to-end monitor creation, checking, and history retrieval.

A serverless function's temporary filesystem or in-memory state should
not be assumed to provide durable storage. A production deployment may
require a managed database and suitable scheduling configuration.

## Known Limitations

-   The hosted monitor API currently returns 404 errors.
-   Persistence and scheduled execution need validation in the
    deployment environment.
-   Some websites may block crawlers, rate-limit requests, or render
    content dynamically.
-   A successful frontend build does not guarantee that the complete
    full-stack workflow is operational.

## Possible Next Steps

-   Resolve Vercel API routing and add deployment smoke tests.
-   Configure durable storage for production.
-   Add automated tests for crawler, diff, and noise-filter behavior.
-   Improve retry handling, observability, and error reporting.
-   Validate the scheduler and alert delivery in a persistent
    environment.

## Project Structure

``` text
watchtower-website-change-detector/
├── api/                    # Serverless API entry points
├── server/
│   ├── engine/
│   │   ├── alerts.js       # Alert-processing logic
│   │   ├── crawler.js      # Website retrieval
│   │   ├── differ.js       # Content comparison
│   │   ├── noiseFilter.js  # Noise filtering
│   │   └── scheduler.js    # Scheduling logic
│   ├── db.js               # Data-layer logic
│   ├── index.js            # Express server
│   └── mockServer.js       # Local mock targets
├── src/
│   ├── components/         # UI components
│   └── App.jsx             # Main React application
├── package.json
├── vite.config.js
└── README.md
```

## Author

**Kartheek Uppaluri**\
Computer Science and Engineering, VIT Vellore

-   **GitHub:**
    [kartheekuppaluri-arch](https://github.com/kartheekuppaluri-arch)

------------------------------------------------------------------------

*WatchTower is a learning and development project. Verify the current
implementation and deployment status before relying on it for production
monitoring.*
