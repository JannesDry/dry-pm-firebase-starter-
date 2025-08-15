Setmore Staff Embed in Appointments Page
----------------------------------------
This patch changes your /appointments page to display the Setmore staff/admin view using https://go.setmore.com.

Configuration:
- No environment variables needed. The URL is hardcoded to https://go.setmore.com.
- Deploy and open /appointments in your app.

Notes:
- If the browser blocks the iframe (due to X-Frame-Options/CSP), the page will show a button to open Setmore in a new tab.
- The embed uses a sandboxed iframe with necessary allowances.
