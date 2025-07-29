# LinkedIn Display Date and Time Chrome Extension

Convert LinkedIn’s short relative timestamps (like `3d`, `5mo`, `1h`) shown on posts and comments into full, human-readable absolute timestamps in your local timezone.

---

## Overview

LinkedIn displays timestamps on posts and comments in a shortened relative format like `3d` (3 days ago), `5mo` (5 months ago), or `1h` (1 hour ago). While this is concise, it can make it difficult to know the exact date and time of when content was posted. Moreover, hovering over these relative timestamps in LinkedIn does not reveal the full date and time, limiting users from easily accessing precise information.

This extension solves that problem by:

- Extracting LinkedIn's internal 19-digit timestamp IDs embedded in post and comment elements.
- Decoding these IDs to retrieve the precise creation timestamp.
- Formatting the timestamp into a full, human-readable date and time string based on your local timezone.
- Displaying the full date and time alongside the relative timestamp on LinkedIn posts and comments.
- Supporting customization of the time format, timezone display, and year visibility via popup settings.
- Automatically updating timestamps dynamically as new content loads.
- Reacting immediately to user setting changes via messaging between popup and content scripts.

---

## Features

- Decode LinkedIn internal IDs to exact timestamps.
- Show full local date and time with configurable options:
  - 12-hour or 24-hour clock
  - Show/hide time
  - Show/hide timezone abbreviation
  - Show/hide year
- Auto-update timestamps on dynamically loaded posts/comments.
- Persist user settings with Chrome storage sync.
- Real-time updates via messaging between popup and content scripts.
- Avoid duplicate timestamp badges on the same posts/comments.

---

## Settings (via Popup)

- **Enabled**: Turn the extension on or off.
- **Show Time**: Show or hide the time portion.
- **24-Hour Format**: Toggle 24-hour vs 12-hour time.
- **Show Timezone**: Show or hide timezone abbreviation.
- **Show Year**: Display or hide the year.

---
