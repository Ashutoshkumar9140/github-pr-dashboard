# GitHub PR Dashboard

A React-based dashboard that analyzes pull requests from a public GitHub repository and presents useful PR and review information in one place.

## Features

* Total, open, closed, merged and unmerged PRs
* Draft and ready-for-review PRs
* Stale PRs and old open PRs
* PRs that have never been reviewed
* Average time to first review
* Average time to merge
* Review activity
* Top reviewers
* Top PR authors
* Responsive design for desktop and mobile
* Loading and error handling

## Tech Stack

* React.js
* JavaScript
* React Router
* CSS
* Vite
* GitHub REST API

## How to Run

```bash
npm install
npm run dev
```

Add your GitHub token to `.env`:

```env
VITE_GITHUB_TOKEN=your_github_token
```

Then enter a public repository URL, for example:

```text
https://github.com/facebook/react
```

and click **Analyze Repository**.

## Current Limitations

* Currently analyzes up to 100 recent pull requests.
* Designed for public GitHub repositories.
* GitHub API rate limits can affect requests.
* Review analysis requires additional API requests.

## Project Goal

The main goal of this project is to make GitHub PR activity easier to understand by showing important information about PR status, review speed, old PRs, reviewers and contributors in one dashboard.

## Future Improvements

* PR pagination
* Charts and graphs
* Advanced filtering
* Date range analysis
* More detailed reviewer statistics
* Export dashboard data

> This is a personal project built using the GitHub REST API for learning and demonstration purposes.
