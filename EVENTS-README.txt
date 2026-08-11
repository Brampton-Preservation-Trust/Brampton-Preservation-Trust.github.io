EVENTS MAINTENANCE
==================

For ordinary events, edit events.json only.

Fields used by the homepage:
- date: YYYY-MM-DD
- time: e.g. 7:00 pm
- location
- title
- description

Optional fields:
- links: array of {"label": "...", "url": "..."}
- url: link to a dedicated event page, e.g. "events/christmas-concert-2026.html"

If an event later gets a dedicated page, add its relative URL in the optional "url" field. The homepage event title will automatically become a link. Put Event structured data on that dedicated event page rather than on the homepage event list.
