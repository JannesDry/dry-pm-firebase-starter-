Setmore Staff Embed in Appointments Page
----------------------------------------
This patch changes your /appointments page to display the Setmore staff/admin view.

Configuration:
1) Set the environment variable NEXT_PUBLIC_SETMORE_ADMIN_URL in your .env or Vercel environment settings:
   NEXT_PUBLIC_SETMORE_ADMIN_URL=https://app.setmore.com/

   You can replace the URL with a specific deep link to your staff calendar from Setmore.

2) Deploy and open /appointments in your app.

Notes:
- If the browser blocks the iframe (due to X-Frame-Options/CSP), the page will show a button to open Setmore in a new tab.
- The embed uses a sandboxed iframe with necessary allowances.
