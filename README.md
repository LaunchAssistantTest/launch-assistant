# Launch Assistant

Launch Assistant is a lightweight, client-side web tool for exploring and managing
Adobe Launch (Tags) properties, rules, data elements, and extensions. It provides
a simple UI to search, filter, inspect, and export Launch configuration data
directly from the Adobe Reactor API.

> Client-side only. No build step required — open `index.html` in your browser.

## Key Features

- Company & property browser — switch between companies and properties
- Rule search and filter with live highlighting
- Code formatting for rule components (JavaScript/JSON)
- Excel export of Rules, Data Elements, and Extensions (beta)

Planned, not yet implemented (the Extension Filter, Publish History, and
Relationships tabs currently exist as empty placeholders in the UI):

- Extension filter and usage view
- Publish history inspection for rules
- Relationship viewer for data elements and extensions

## Quick Start

Prerequisites

- A modern browser (Chrome, Firefox, Safari, Edge) with JavaScript enabled
- An Adobe Launch Access Token, generated via [Adobe Developer Console](https://developer.adobe.com/console)'s
  Server-to-Server credential for this org (Org ID and Client ID are already
  built into the app — see Configuration below)

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

1. In [Adobe Developer Console](https://developer.adobe.com/console), open this
   app's project → the **OAuth Server-to-Server** credential → click
   **Generate access token** and copy it.
2. Open Launch Assistant in the browser and open the **Configuration** section.
3. Paste the token into **Access Token** and click **Update Settings**.

Org ID and Client ID are fixed for this deployment (they identify this app's
Developer Console project, not you personally) and are baked in — see
`js/config.js` if you fork this app under a different Adobe org/project.

Credentials are stored in browser session storage and cleared when the tab is closed.

Security note: credentials are used only for direct requests from your browser to Adobe's API. Do not commit or share secrets.

> Note: Adobe Developer Console also offers an "Admin Authentication" (OAuth,
> 3-legged) credential type that would let users sign in with their own Adobe
> ID directly in the browser instead of pasting a token. That type requires
> an Adobe license this org doesn't currently have — worth revisiting if that
> license is ever added.

## Usage

Follow these steps to configure, explore, and export data with Launch Assistant.

1) Start the app

- Open `index.html` in your browser (or serve the directory via a local server).
- If served at `http://localhost:8000`, open that URL.

2) Configure API credentials

- Open the **Configuration** panel in the UI.
- Paste your Access Token (see Configuration above for how to generate one) and click **Update Settings**.
- The token is stored in session storage for the current tab.

Tip: If you see authentication errors, confirm the token has the required scopes and has not expired.

3) Select Company & Property

- Use the Company dropdown to pick the organization. Launch Assistant will load available Properties.
- Choose a Property, then click **Get Details** to load its Rules, Data Elements, and Extensions.

4) Searching and filtering

- Use the **Search** tab to find rules by name before clicking **Get Details** to narrow what's fetched.
- After details are loaded, typing a term live-highlights matches across rule names, settings, and components.

Examples:
- Search: `checkout`, `utm`, `setCookie`

5) Inspecting a rule

- Click any rule in the results list to open the detail view.
- The detail view shows rule metadata, conditions, actions, and code components (formatted as JavaScript/JSON).
- Expand components to view full source and any referenced Data Elements or Extensions.

6) Exporting configuration

- Use the **Download Excel** control after **Get Details** to download configuration data for the selected Property.
- The workbook includes a Rules sheet with one row per rule, including that rule's components and component values, plus Data Elements and Extensions sheets.
- Note: Export is labeled beta — verify exported data before using it elsewhere.

7) Troubleshooting & tips

- If lists are empty or requests fail, check browser console (F12) for network errors.
- CORS: prefer serving the files with a local server to avoid cross-origin issues.
- Session storage is cleared on tab close — save exported credentials or JSON before closing the tab.

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

## Testing

Pure logic (Excel export data-shaping, search highlighting/escaping, the
request concurrency helper) has a Vitest suite. It's optional — the app
itself still needs no build step and no `npm install` to run in a browser.

```bash
npm install
npm test
```

## Contributing

See `CONTRIBUTING.md` for contribution guidelines. No build tools are required to run the app — edit files and refresh the browser.

## Project Structure

```
launch-assistant/
├── index.html        # Main UI
├── js/
│   ├── app.js         # Event wiring / controller
│   ├── config.js      # Credential storage (ConfigManager)
│   ├── api.js          # Adobe Reactor API client (APIService)
│   ├── ui.js            # DOM/rendering utilities (UIUtils)
│   ├── render.js        # Rules/Data Elements/Extensions rendering
│   └── excel.js          # Excel export (workbook building)
├── tests/             # Vitest unit tests for the modules above
├── style.css          # Styling
├── package.json        # Dev-only: test tooling (not needed to run the app)
├── README.md           # This file
└── CONTRIBUTING.md      # Contribution guide
```

## License

This repository currently does not include a LICENSE file. If you want a
license added, please open an issue or request MIT / Apache-2.0 / GPL-3.0.
