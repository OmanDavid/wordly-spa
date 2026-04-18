/**
 * Wordly — Dictionary SPA
 * app.js
 *
 * Features:
 *  - Search words via Free Dictionary API
 *  - Display definitions, phonetics, part of speech, examples
 *  - Audio pronunciation playback
 *  - Synonym tags (clickable to search)
 *  - Save / unsave favourite words (localStorage)
 *  - Light / dark theme toggle
 *  - Full error handling & input validation
 */

"use strict";

/* =============================================
   CONSTANTS & STATE
   ============================================= */

const API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en/";

const state = {
  currentWord: null,
  currentAudio: null,
  savedWords: [],
};

/* =============================================
   DOM REFERENCES
   ============================================= */

const searchForm       = document.getElementById("searchForm");
const wordInput        = document.getElementById("wordInput");
const inputError       = document.getElementById("inputError");

const loadingState     = document.getElementById("loadingState");
const errorState       = document.getElementById("errorState");
const errorMessage     = document.getElementById("errorMessage");

const resultsSection   = document.getElementById("resultsSection");
const wordTitle        = document.getElementById("wordTitle");
const wordPhonetic     = document.getElementById("wordPhonetic");
const audioBtn         = document.getElementById("audioBtn");
const saveBtn          = document.getElementById("saveBtn");
const meaningsContainer = document.getElementById("meaningsContainer");
const synonymsSection  = document.getElementById("synonymsSection");
const synonymsList     = document.getElementById("synonymsList");
const sourceSection    = document.getElementById("sourceSection");
const sourceLink       = document.getElementById("sourceLink");

const savedSection     = document.getElementById("savedSection");
const savedList        = document.getElementById("savedList");
const clearSavedBtn    = document.getElementById("clearSavedBtn");

const themeToggle      = document.getElementById("themeToggle");

/* =============================================
   UTILITY FUNCTIONS
   ============================================= */

/**
 * Show/hide elements using the HTML hidden attribute.
 * @param {HTMLElement} el
 * @param {boolean} visible
 */
function setVisible(el, visible) {
  if (visible) {
    el.removeAttribute("hidden");
  } else {
    el.setAttribute("hidden", "");
  }
}

/**
 * Reset all result/loading/error UI panels to hidden.
 */
function resetUI() {
  setVisible(loadingState, false);
  setVisible(errorState, false);
  setVisible(resultsSection, false);
  inputError.textContent = "";
}

/**
 * Sanitise user input: trim whitespace, lowercase.
 * @param {string} raw
 * @returns {string}
 */
function sanitiseInput(raw) {
  return raw.trim().toLowerCase();
}

/* =============================================
   THEME
   ============================================= */

function initTheme() {
  const saved = localStorage.getItem("wordly-theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  themeToggle.setAttribute("aria-pressed", saved === "dark");
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("wordly-theme", next);
  themeToggle.setAttribute("aria-pressed", next === "dark");
}

themeToggle.addEventListener("click", toggleTheme);

/* =============================================
   SAVED WORDS (localStorage)
   ============================================= */

function loadSavedWords() {
  try {
    const stored = localStorage.getItem("wordly-saved");
    state.savedWords = stored ? JSON.parse(stored) : [];
  } catch {
    state.savedWords = [];
  }
}

function persistSavedWords() {
  localStorage.setItem("wordly-saved", JSON.stringify(state.savedWords));
}

function isWordSaved(word) {
  return state.savedWords.includes(word);
}

function saveWord(word) {
  if (!isWordSaved(word)) {
    state.savedWords.unshift(word);
    persistSavedWords();
    renderSavedWords();
  }
}

function removeWord(word) {
  state.savedWords = state.savedWords.filter((w) => w !== word);
  persistSavedWords();
  renderSavedWords();

  // Update save button if this is the current result
  if (state.currentWord === word) {
    updateSaveBtn(word);
  }
}

function updateSaveBtn(word) {
  const saved = isWordSaved(word);
  saveBtn.querySelector(".save-icon").textContent = saved ? "♥" : "♡";
  saveBtn.querySelector("span:last-child").textContent = saved ? "Saved" : "Save";
  saveBtn.classList.toggle("saved", saved);
}

function renderSavedWords() {
  if (state.savedWords.length === 0) {
    setVisible(savedSection, false);
    return;
  }

  setVisible(savedSection, true);
  savedList.innerHTML = "";

  state.savedWords.forEach((word) => {
    const tag = document.createElement("div");
    tag.className = "saved-word-tag";
    tag.setAttribute("role", "button");
    tag.setAttribute("tabindex", "0");
    tag.setAttribute("aria-label", `Look up ${word}`);

    const wordSpan = document.createElement("span");
    wordSpan.textContent = word;

    const removeBtn = document.createElement("button");
    removeBtn.className = "saved-word-remove";
    removeBtn.textContent = "×";
    removeBtn.setAttribute("aria-label", `Remove ${word} from saved`);

    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeWord(word);
    });

    // Click the tag itself → search the word
    tag.addEventListener("click", () => {
      wordInput.value = word;
      searchWord(word);
    });

    tag.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        wordInput.value = word;
        searchWord(word);
      }
    });

    tag.appendChild(wordSpan);
    tag.appendChild(removeBtn);
    savedList.appendChild(tag);
  });
}

/* =============================================
   AUDIO PLAYBACK
   ============================================= */

function setupAudio(audioUrl) {
  if (!audioUrl) {
    setVisible(audioBtn, false);
    return;
  }

  setVisible(audioBtn, true);
  state.currentAudio = new Audio(audioUrl);

  audioBtn.onclick = () => {
    if (state.currentAudio) {
      state.currentAudio.currentTime = 0;
      audioBtn.classList.add("playing");
      state.currentAudio.play().catch(() => {
        // Autoplay blocked or network error — fail silently
        audioBtn.classList.remove("playing");
      });
      state.currentAudio.onended = () => audioBtn.classList.remove("playing");
    }
  };
}

/* =============================================
   API FETCH
   ============================================= */

/**
 * Fetch word data from the Free Dictionary API.
 * @param {string} word
 * @returns {Promise<Array>} Array of entry objects
 * @throws {Error} On network failure or word-not-found
 */
async function fetchWordData(word) {
  const response = await fetch(`${API_BASE}${encodeURIComponent(word)}`);

  if (response.status === 404) {
    throw new Error(`"${word}" was not found in the dictionary.`);
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/* =============================================
   RENDER RESULTS
   ============================================= */

/**
 * Extract the best phonetic text and audio URL from entries.
 * @param {Array} entries
 * @returns {{ text: string, audioUrl: string|null }}
 */
function extractPhonetics(entries) {
  for (const entry of entries) {
    for (const phonetic of entry.phonetics || []) {
      if (phonetic.text && phonetic.audio) {
        return { text: phonetic.text, audioUrl: phonetic.audio };
      }
    }
  }
  // Fallback: phonetic text only
  for (const entry of entries) {
    if (entry.phonetic) return { text: entry.phonetic, audioUrl: null };
    for (const phonetic of entry.phonetics || []) {
      if (phonetic.text) return { text: phonetic.text, audioUrl: null };
    }
  }
  return { text: "", audioUrl: null };
}

/**
 * Collect all unique synonyms across all meanings.
 * @param {Array} entries
 * @returns {string[]}
 */
function collectSynonyms(entries) {
  const seen = new Set();
  const synonyms = [];
  for (const entry of entries) {
    for (const meaning of entry.meanings || []) {
      for (const syn of meaning.synonyms || []) {
        if (!seen.has(syn)) {
          seen.add(syn);
          synonyms.push(syn);
        }
      }
      for (const def of meaning.definitions || []) {
        for (const syn of def.synonyms || []) {
          if (!seen.has(syn)) {
            seen.add(syn);
            synonyms.push(syn);
          }
        }
      }
    }
  }
  return synonyms.slice(0, 15); // Cap display at 15
}

/**
 * Render a single meaning block (part of speech + definitions).
 * @param {Object} meaning
 * @param {number} index  Used for animation delay
 * @returns {HTMLElement}
 */
function createMeaningBlock(meaning, index) {
  const block = document.createElement("div");
  block.className = "meaning-block";
  block.style.animationDelay = `${index * 0.07}s`;

  // Part of speech badge
  const pos = document.createElement("span");
  pos.className = "part-of-speech";
  pos.textContent = meaning.partOfSpeech || "unknown";

  // Definitions list
  const list = document.createElement("ul");
  list.className = "definitions-list";
  list.setAttribute("aria-label", `${meaning.partOfSpeech} definitions`);

  const defs = meaning.definitions || [];
  const limit = Math.min(defs.length, 4); // Show up to 4 definitions per part of speech

  for (let i = 0; i < limit; i++) {
    const def = defs[i];
    const item = document.createElement("li");
    item.className = "definition-item";

    const defText = document.createElement("p");
    defText.className = "definition-text";
    defText.textContent = def.definition || "";

    item.appendChild(defText);

    if (def.example) {
      const example = document.createElement("p");
      example.className = "definition-example";
      example.textContent = def.example;
      item.appendChild(example);
    }

    list.appendChild(item);
  }

  block.appendChild(pos);
  block.appendChild(list);
  return block;
}

/**
 * Populate and show the results section.
 * @param {Array} entries  Parsed API response
 * @param {string} word    The searched word
 */
function renderResults(entries, word) {
  state.currentWord = word;

  // Word title
  wordTitle.textContent = entries[0].word || word;

  // Phonetics
  const { text: phoneticText, audioUrl } = extractPhonetics(entries);
  wordPhonetic.textContent = phoneticText || "";
  setupAudio(audioUrl);

  // Save button state
  updateSaveBtn(word);
  saveBtn.onclick = () => {
    if (isWordSaved(word)) {
      removeWord(word);
    } else {
      saveWord(word);
    }
    updateSaveBtn(word);
  };

  // Meanings
  meaningsContainer.innerHTML = "";
  let meaningIndex = 0;
  for (const entry of entries) {
    for (const meaning of entry.meanings || []) {
      meaningsContainer.appendChild(createMeaningBlock(meaning, meaningIndex));
      meaningIndex++;
    }
  }

  // Synonyms
  const synonyms = collectSynonyms(entries);
  if (synonyms.length > 0) {
    synonymsList.innerHTML = "";
    synonyms.forEach((syn) => {
      const tag = document.createElement("button");
      tag.className = "synonym-tag";
      tag.textContent = syn;
      tag.setAttribute("aria-label", `Search synonym: ${syn}`);
      tag.addEventListener("click", () => {
        wordInput.value = syn;
        searchWord(syn);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      synonymsList.appendChild(tag);
    });
    setVisible(synonymsSection, true);
  } else {
    setVisible(synonymsSection, false);
  }

  // Source URL
  const sources = entries.flatMap((e) => e.sourceUrls || []);
  if (sources.length > 0) {
    sourceLink.href = sources[0];
    sourceLink.textContent = sources[0];
    setVisible(sourceSection, true);
  } else {
    setVisible(sourceSection, false);
  }

  setVisible(resultsSection, true);
}

/* =============================================
   SEARCH ORCHESTRATION
   ============================================= */

/**
 * Main search function — validates, fetches, renders.
 * @param {string} raw  The raw user input
 */
async function searchWord(raw) {
  const word = sanitiseInput(raw);

  // Input validation
  if (!word) {
    inputError.textContent = "Please enter a word to search.";
    wordInput.focus();
    return;
  }

  if (!/^[a-zA-Z'-]+$/.test(word)) {
    inputError.textContent = "Please enter a valid English word (letters only).";
    wordInput.focus();
    return;
  }

  resetUI();
  setVisible(loadingState, true);

  try {
    const entries = await fetchWordData(word);
    setVisible(loadingState, false);
    renderResults(entries, word);
  } catch (err) {
    setVisible(loadingState, false);
    errorMessage.textContent = err.message || "Something went wrong. Please try again.";
    setVisible(errorState, true);
  }
}

/* =============================================
   EVENT LISTENERS
   ============================================= */

// Form submit
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  searchWord(wordInput.value);
});

// Clear saved words
clearSavedBtn.addEventListener("click", () => {
  state.savedWords = [];
  persistSavedWords();
  renderSavedWords();
});

// Clear inline error when user types
wordInput.addEventListener("input", () => {
  inputError.textContent = "";
});

/* =============================================
   INIT
   ============================================= */

(function init() {
  initTheme();
  loadSavedWords();
  renderSavedWords();
})();