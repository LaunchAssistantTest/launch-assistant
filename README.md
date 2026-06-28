# Launch Assistant

Launch Assistant is a lightweight, client-side web tool for exploring and managing
Adobe Launch (Tags) properties, rules, data elements, and extensions. It provides
a simple UI to search, filter, inspect, and export Launch configuration data
directly from the Adobe Reactor API.

> Client-side only. No build step required — open `index.html` in your browser.

## Key Features

- Company & property browser — switch between companies and properties
- Rule search and filter with live highlighting
- Extension filter and usage view
- Publish history inspection for rules
- Relationship viewer for data elements and extensions
- Code formatting for rule components (JavaScript/JSON)
- Export tools (beta)

## Quick Start

Prerequisites

- A modern browser (Chrome, Firefox, Safari, Edge) with JavaScript enabled
- An Adobe Launch account and API credentials (Access Token, Org ID, Client ID, Client Secret)

Run locally

Option A — Open directly

1. Clone or download the repository
2. Open `index.html` in your browser

Option B — Serve via a simple local server (recommended for CORS consistency)

```bash
# Python 3
python -m http.server 8000

# or Node.js (http-server)
npx http-server -p 8000

# then open http://localhost:8000 in your browser
```

## Configuration

1. Open Launch Assistant in the browser
2. Open the **Configuration** section
3. Paste your Adobe Launch API credentials:
   - Access Token
   - Org ID
   - Client ID
   - Client Secret
4. Click **Update Settings**

Credentials are stored in browser session storage and cleared when the tab is closed.

Security note: credentials are used only for direct requests from your browser to Adobe's API. Do not commit or share secrets.

## Usage

Follow these steps to configure, explore, and export data with Launch Assistant.

1) Start the app

- Open `index.html` in your browser (or serve the directory via a local server).
- If served at `http://localhost:8000`, open that URL.

2) Configure API credentials

- Open the **Configuration** panel in the UI.
- Paste your Adobe Launch API credentials (Access Token, Org ID, Client ID, Client Secret).
- Click **Update Settings**. Credentials are stored in session storage for the current tab.

Tip: If you see authentication errors, confirm the token has the required scopes and has not expired.

3) Select Company & Property

- Use the Company dropdown to pick the organization. Launch Assistant will load available Properties.
- Choose a Property to load its Rules, Data Elements, Extensions, and Publish History.

4) Searching and filtering

- Use the **Search** tab to find rules by name, description, or code. Search supports simple keywords and partial matches.
- Use the **Extension Filter** to restrict results to rules that reference a specific extension.
- Combine filters (search term + extension + property) to narrow results.

Examples:
- Search: `checkout`, `utm`, `setCookie`
- Extension filter: select `Adobe Analytics` to show rules that use that extension

5) Inspecting a rule

- Click any rule in the results list to open the detail view.
- The detail view shows rule metadata, conditions, actions, and code components (formatted as JavaScript/JSON).
- Expand components to view full source and any referenced Data Elements or Extensions.

6) Relationship Viewer

- Open the Relationship Viewer to see connections between Data Elements, Rules, and Extensions.
- Use this to find where a given Data Element is used across rules and extensions.

7) Exporting configuration

- Use the **Download Excel** control after **Get Details** to download configuration data for the selected Property.
- The workbook includes a Rules sheet with one row per rule, including that rule's components and component values, plus Data Elements and Extensions sheets.
- Note: Export is labeled beta — verify exported data before using it elsewhere.

8) Troubleshooting & tips

- If lists are empty or requests fail, check browser console (F12) for network errors.
- CORS: prefer serving the files with a local server to avoid cross-origin issues.
- Session storage is cleared on tab close — save exported credentials or JSON before closing the tab.

9) Example workflows

- Audit: select a Property, filter by extension, review rules and export a JSON snapshot for offline review.
- Impact analysis: search for a Data Element, open Relationship Viewer, and identify all rules that use it.

If you'd like, I can also add screenshots or short GIFs to illustrate the UI flows.

## Troubleshooting

- "Error fetching companies": verify credentials and API permissions
- No properties appear: confirm selected company and that you have read permissions
- Check browser console (F12) for network and scripting errors

## Browser Requirements

- Chrome, Firefox, Safari, or Edge with ES6 + Fetch API support
- Session Storage must be enabled
- Internet Explorer is not supported

## Security & Privacy

- Credentials are stored only in session storage and not transmitted to third parties
- All API requests are made directly to `https://reactor.adobe.io`

## Contributing

See `CONTRIBUTING.md` for contribution guidelines. No build tools are required — edit files and refresh the browser.

## Project Structure

```
launch-assistant/
├── index.html        # Main UI
├── app.js            # Application logic and API integration
├── style.css         # Styling
├── README.md         # This file
└── CONTRIBUTING.md   # Contribution guide
```

## License

This repository currently does not include a LICENSE file. If you want a
license added, please open an issue or request MIT / Apache-2.0 / GPL-3.0.
