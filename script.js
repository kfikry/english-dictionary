let dictionary = [];
const listEl = document.getElementById('list');
const searchEl = document.getElementById('search');
const speakAllBtn = document.getElementById('speakAll');
const addWordBtn = document.getElementById('addWordBtn');
const downloadBtn = document.getElementById('downloadBtn');

// Load dictionary from localStorage or JSON
async function loadDictionary() {
  const saved = localStorage.getItem('myDictionary');
  if (saved) {
    dictionary = JSON.parse(saved);
    renderDictionary();
    return;
  }

  try {
    const res = await fetch('dictionary.json');
    const data = await res.json();
    dictionary = data;
    saveToLocal();
    renderDictionary();
  } catch (err) {
    console.error('Error loading dictionary:', err);
    listEl.innerHTML = `<div style="color:red;">Failed to load dictionary.json</div>`;
  }
}

// Render words
function renderDictionary(filter = '') {
  const q = filter.trim().toLowerCase();
  const filtered = dictionary.filter(item =>
    item.word.toLowerCase().includes(q) ||
    item.def.toLowerCase().includes(q) ||
    item.examples.join(' ').toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    listEl.innerHTML = `<div style="color:var(--muted);padding:18px;background:#fff;border-radius:12px">No results found.</div>`;
    return;
  }

  listEl.innerHTML = filtered.map(item => `
    <div class="card">
      <div class="word">${item.word}</div>
      <div class="meta">${item.pos || ''} • <span>${item.pron || ''}</span></div>
      <div>${item.def}</div>
      <div class="example">${item.examples.map(e => `• ${e}`).join('<br>')}</div>
      <div class="actions" style="margin-top:8px;">
        <button class="play" onclick="speak('${item.word}')">🔊 Word</button>
        <button class="play" onclick="speak('${item.examples.join('. ')}')">🔉 Examples</button>
      </div>
    </div>
  `).join('');
}

// Speak function
function speak(text) {
  if (!('speechSynthesis' in window)) {
    alert('Speech synthesis not supported.');
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) {
    utter.voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
  }
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

async function speakVisible() {
  const words = Array.from(listEl.querySelectorAll('.word')).map(w => w.textContent);
  for (const w of words) {
    speak(w);
    await waitForSpeechEnd();
  }
}

function waitForSpeechEnd() {
  return new Promise(res => {
    const id = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(id);
        setTimeout(res, 120);
      }
    }, 100);
  });
}

// Add new word
addWordBtn.onclick = () => {
  const word = document.getElementById('wordInput').value.trim();
  const pos = document.getElementById('posInput').value.trim();
  const pron = document.getElementById('pronInput').value.trim();
  const def = document.getElementById('defInput').value.trim();
  const examples = document.getElementById('examplesInput').value.split(',').map(e => e.trim()).filter(Boolean);

  if (!word || !def) {
    alert('Please enter at least a word and definition.');
    return;
  }

  dictionary.push({ word, pos, pron, def, examples });
  saveToLocal();
  renderDictionary();
  alert(`✅ Word "${word}" added!`);
  clearInputs();
};

function clearInputs() {
  document.getElementById('wordInput').value = '';
  document.getElementById('posInput').value = '';
  document.getElementById('pronInput').value = '';
  document.getElementById('defInput').value = '';
  document.getElementById('examplesInput').value = '';
}

// Save to localStorage
function saveToLocal() {
  localStorage.setItem('myDictionary', JSON.stringify(dictionary));
}

// Download updated JSON
downloadBtn.onclick = () => {
  const blob = new Blob([JSON.stringify(dictionary, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dictionary.json';
  a.click();
};

// Event listeners
searchEl.addEventListener('input', e => renderDictionary(e.target.value));
speakAllBtn.addEventListener('click', speakVisible);

// Initialize
loadDictionary();
