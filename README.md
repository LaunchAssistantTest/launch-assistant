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

1. Select a Company and Property from the dropdowns
2. Use the Search tab to find rules by name or keyword
3. Use the Extension Filter to view rules by installed extensions
4. Open a rule to inspect conditions, actions, and components
5. Use Export to download configuration data (beta)

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
