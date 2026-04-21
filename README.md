# Wordly — Dictionary SPA

A single-page dictionary application built with vanilla HTML, CSS, and JavaScript.  
Users can search for any English word and instantly retrieve its definitions, phonetic pronunciation, part of speech, usage examples, and synonyms — all without a page reload.

---

## Live Demo

[Live Demo](https://omandavid.github.io/wordly-spa/)

---

## Screenshot

> Add a screenshot of the app here.

---

## Features

| Feature | Description |

|---|---|
| 🔍 Word Search | Search any English word via the Free Dictionary API |
| 📖 Definitions | Displays definitions grouped by part of speech (noun, verb, etc.) |
| 🔊 Audio Playback | One-click pronunciation audio where available |
| 🗒 Usage Examples | Contextual example sentences shown under each definition |
| 🔗 Synonyms | Clickable synonym tags that trigger a new search |
| ❤️ Save Words | Save favourite words to localStorage for later reference |
| 🌙 Dark Mode | Toggle between light and dark themes (preference persisted) |
| ⚠️ Error Handling | Friendly messages for unknown words and API failures |
| ♿ Accessibility | Semantic HTML, ARIA labels, keyboard navigation throughout |
| 📱 Responsive | Works across desktop, tablet, and mobile |

---

## Tech Stack

- **HTML5** — semantic structure, ARIA accessibility attributes  
- **CSS3** — CSS custom properties (variables), Flexbox, animations, responsive design  
- **JavaScript (ES6+)** — Fetch API, async/await, DOM manipulation, localStorage  
- **[Free Dictionary API](https://dictionaryapi.dev)** — open-source dictionary data, no API key required  
- **Google Fonts** — Playfair Display, DM Sans, DM Mono  

No frameworks, no build tools, no dependencies. Pure vanilla web technologies.

---

## Project Structure

```
wordly/
├── index.html    # Single HTML file — app shell and structure
├── style.css     # All styles — layout, theme variables, animations
├── app.js        # All JavaScript — fetch, DOM, state, events
└── README.md     # This file
```

---

## Getting Started

### Run Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/YOUR_USERNAME/wordly.git
   cd wordly
   ```

2. Open `index.html` in your browser directly, or use a local dev server:

   ```bash
   # Using VS Code Live Server extension — right-click index.html → Open with Live Server
   
   # Or using Python
   python3 -m http.server 5500
   ```

3. Navigate to `http://localhost:5500` in your browser.

> No npm install or build step required.

### Deploy to GitHub Pages

1. Push your project to a GitHub repository.
2. Go to **Settings → Pages**.
3. Set source to `main` branch, `/ (root)`.
4. GitHub will provide a live URL within a few minutes.

---

## API Reference

This project uses the **[Free Dictionary API](https://dictionaryapi.dev/)**.

**Endpoint:**

```
GET https://api.dictionaryapi.dev/api/v2/entries/en/{word}
```

**Example response shape (simplified):**

```json
[
  {
    "word": "hello",
    "phonetic": "/həˈloʊ/",
    "phonetics": [
      { "text": "/həˈloʊ/", "audio": "https://..." }
    ],
    "meanings": [
      {
        "partOfSpeech": "exclamation",
        "definitions": [
          {
            "definition": "Used as a greeting.",
            "example": "Hello there, Katie!"
          }
        ],
        "synonyms": ["hi", "hey"]
      }
    ],
    "sourceUrls": ["https://en.wiktionary.org/wiki/hello"]
  }
]
```

**Error case (404):**

```json
{
  "title": "No Definitions Found",
  "message": "...",
  "resolution": "..."
}
```

---

## JavaScript Architecture

The app is organized into clear, single-responsibility sections:

| Section | Responsibility |

|---|---|
| `state` object | Single source of truth for current word, audio, saved words |
| `fetchWordData()` | Async fetch with error handling (404 vs network errors) |
| `extractPhonetics()` | Parses phonetic text and audio URL from API response |
| `collectSynonyms()` | Aggregates unique synonyms across all meanings |
| `createMeaningBlock()` | Builds a DOM element for one part-of-speech group |
| `renderResults()` | Orchestrates populating the full results section |
| `searchWord()` | Validates input → shows loading → calls fetch → renders |
| Saved words helpers | `saveWord`, `removeWord`, `renderSavedWords` (localStorage) |
| Theme helpers | `initTheme`, `toggleTheme` (localStorage) |

---

## Error Handling

| Scenario | Handling |

|---|---|
| Empty search input | Inline validation message, focus returned to input |
| Non-alphabetic input | Inline validation message |
| Word not found (API 404) | Friendly "not found" error panel |
| API server error (5xx) | Generic error panel with status code |
| Network failure | Catch block surfaces the error message |
| Missing audio | Audio button hidden gracefully |
| Missing phonetics | Phonetic field left blank |
| Missing synonyms | Synonyms section hidden |
| Missing source URL | Source section hidden |

---

## Rubric Alignment

| Criterion | Implementation |

|---|---|
| Search Functionality | Form with validation, async fetch, edge cases handled |
| Data Display | Word, phonetics, part of speech, definitions, examples, synonyms, source |
| Form & Event Handling | `submit` event listener, `input` event for error clearing, keyboard accessible |
| DOM Manipulation | Dynamic content injection, show/hide sections, theme class toggling |
| Fetch API Usage | `async/await` fetch with full error handling for 404 and network errors |
| Code Syntax | Strict mode, JSDoc comments, single-responsibility functions, clear naming |
| Styling & UX | Editorial theme, dark mode, animations, responsive layout, accessible |

---

## Author

**Oman David**  
Moringa School — Full Stack Software Development  
GitHub: [github.com/OmanDavid](https://github.com/OmanDavid)

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Acknowledgements

- [Free Dictionary API](https://dictionaryapi.dev) — free, open, no key required  
- [Google Fonts](https://fonts.google.com) — Playfair Display, DM Sans, DM Mono  
- Moringa School — for the project brief and curriculum
