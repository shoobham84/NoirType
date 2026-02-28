# NoirType
#### Video Demo:  https://youtu.be/xk-oPMpwEFo
#### Description:

## Overview
NoirType is a minimalistic, neo-noir themed, zen-core typing speed application built as a final project for Harvard's CS50x. Designed to help users practice their typing speed without the visual clutter and distractions of traditional typing tests, the app features a sleek, focus-driven interface.

The core philosophy behind NoirType was to build a highly responsive, low-latency web application from the ground up. It intentionally avoids bloated JavaScript frameworks, instead relying on strict, optimized Vanilla JavaScript DOM manipulation on the frontend, paired with a robust Python Flask server and a relational SQLite database on the backend to securely track user progression, historical accuracy, and global leaderboards.

## Features
* **Zero-Latency Word Generation:** Instantaneous loading of localized word batches to ensure the user never has to wait for an API response to start typing.
* **Dynamic Time Modes:** Users can select between 15-second, 30-second, and an "Endless" mode (with a WPM counter for pure zen typing).
* **Live Analytics:** Real-time calculation of Words Per Minute (WPM) and final accuracy tracking based on correct vs. incorrect keystrokes.
* **Cheating Prevention:** Strict frontend validation that disables cutting, copying, pasting, and "Select All" actions inside the typing area.
* **Persistent User Accounts:** Secure Werkzeug-based password hashing for user registration and session management.
* **Global Leaderboard:** A ranked database query showcasing the all-time highest WPMs across the platform.
* **Personal Profiles:** A dedicated dashboard detailing a user's total tests taken, average WPM, all-time max WPM, and a complete chronological history of their typing sessions.

---

## File Structure
The project follows a classic Model-View-Controller (MVC) architecture, heavily separating frontend logic from backend routing.

```text
project/
    flask_session/       # Auto-generated directory storing server-side session files
    static/              # Frontend assets (CSS and modular JavaScript)
        board.js         # Handles clearing the board and mapping new word arrays to the DOM
        main.js          # The core orchestrator: manages event listeners, state, and API fetches
        styles.css       # Custom neo-noir styling, masking gradients, and smooth modal animations
        timer.js         # Abstracted math logic for countdowns and real-time WPM calculation
        words.js         # Local ES6 module containing an array of 500 scraped English words
        templates/           # Jinja2 HTML templates
            index.html       # The main typing interface (board, timer, mode selectors, and results modal)
            layout.html      # The base template establishing the `<head>`, navigation, and flash messages
            leaderboard.html # Renders a dynamic table of the top 10 platform high scores
            login.html       # User authentication interface
            notfound.html    # Custom fallback interface for 404 errors or invalid routes
            profile.html     # User dashboard displaying aggregate stats and chronological test history
            register.html    # Account creation interface
    app.py               # The core Python Flask application handling all routing and backend logic
    helpers.py           # Contains Python helper functions like the `@login_required` decorator
    project.db           # The SQLite database containing `users` and `history` tables
    README.md            # Project documentation
    requirements.txt     # Python dependencies required to run the application
```

---

## Technical Implementation Details

### 1. The Word Generation Engine
Rather than relying on an external API to fetch random words, NoirType prioritizes absolute zero-latency execution. Relying on an external API introduces the risk of network latency, rate-limiting, and asynchronous `Promises` that could delay the start or restart of a rapid-fire typing test.

Instead, local data generation was implemented. A custom script was utilized via Chrome DevTools to scrape the 3,000 most common English words from the EF Global Site, refining them down to an array of 500 distinct words. This dataset is encapsulated in an external ES6 module (`words.js`). When a user starts or restarts a test, the `generateBoard()` function synchronously pulls a shuffled slice of 250 words directly from local memory, ensuring instantaneous replayability.

### 2. The Text Overlay Architecture
Capturing rapid user keyboard input while maintaining custom syntax highlighting (light green for correct keystrokes, dark orange for incorrect keystrokes) presented a significant DOM manipulation challenge. Standard HTML `<textarea>` elements natively accept input but do not support multi-colored text styling on a per-character basis.

To solve this natively without a library, NoirType uses a stacked, invisible DOM architecture:
* **The Invisible Input (`.words-input`):** An HTML `<textarea>` sits at the highest `z-index` with its text color set to transparent and its resize property disabled. It captures raw user input natively, handling keyboards, backspaces, and standard typing events perfectly. Custom JavaScript event listeners strictly `preventDefault()` on `copy`, `paste`, `cut`, and `ctrl+a` to prevent users from artificially inflating their WPM.
* **The Ghost Overlay (`.words-overlay`):** Sitting exactly beneath the invisible textarea is a `div`. JavaScript intercepts every keystroke, dynamically splitting the target words into individual HTML `<span>` elements. As the user types, JavaScript compares the value of the hidden textarea against the inner text of the spans, applying `.correct` or `.incorrect` CSS classes in real-time.
* **Synchronized Scrolling:** A JavaScript event listener syncs the `scrollTop` property of both elements. As the user types multiple lines and forces the invisible textarea to scroll down, the visible ghost overlay scrolls perfectly in tandem (using CSS `top` transformations), creating the seamless illusion of typing directly onto styled text. A CSS `mask-image` linear gradient is applied to the container to smoothly fade out text at the bottom boundary.

### 3. Asynchronous State Management & UI Polish
The application relies heavily on separation of concerns. The countdown math is fully abstracted into `timer.js`, making it reusable. `main.js` acts as the traffic controller.

When a timer hits zero, the game state locks. To prevent the UI from freezing while the browser communicates with the Python database, modern JavaScript `async/await` syntax is heavily utilized. The frontend bundles the user's final WPM, calculated accuracy percentage, and chosen time mode into a JSON payload. It executes a non-blocking `fetch` request (`/api/save_score`) to the backend. While waiting for the SQLite database to find the user's all-time maximum score, the main thread remains unblocked. Once the JSON response is received, the frontend uses CSS transitions (manipulating `opacity`, `visibility`, and `transform: scale`) to smoothly animate a custom results modal onto the screen rather than relying on jarring native popups.

### 4. Relational Database Design
The backend utilizes SQLite3, manipulated via the `cs50.SQL` library, consisting of two primary tables connected via a Foreign Key relationship:
* **`users` Table:** Stores an auto-incrementing integer `id`, a unique `name`, a Werkzeug-generated password `hash`, and a default current timestamp.
* **`history` Table:** Stores an auto-incrementing `id`, the `user_id` (foreign key), the achieved `wpm`, the calculated `accuracy`, the time `mode` played, and the `timestamp`.

### 5. Dynamic Data Rendering (Jinja)
NoirType goes beyond a simple frontend typing script by offering persistent, globally ranked user accounts.
* **The Leaderboard (`/leaderboard`):** To generate the top 10 rankings, the backend utilizes a complex SQL `JOIN` query to combine the `users` and `history` tables. It employs a `GROUP BY users.id` clause to ensure a single user doesn't dominate the entire board, fetching only the `MAX(wpm)` for each individual player before passing the data to Jinja to dynamically generate the HTML table.
* **User Profiles (`/profile`):** The backend queries the database for the logged-in user to calculate aggregate data on the fly. It uses SQL `COUNT()` to determine total tests taken, `AVG()` rounded to calculate overall lifetime accuracy/speed, and pulls a complete, chronologically descending log (`ORDER BY timestamp DESC`) of their typing history to render a personalized dashboard.

## External Sources used:
#### Proper grammar and formatting for some parts of the README.md was done using the help of artificial intelligence.
#### Information about the APIs in javascript was acquired from MDN documentation and The Odin Project's tutorials.


