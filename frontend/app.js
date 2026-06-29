/* ═══════════════════════════════════════════════════════════════════════════
   CoverCraft — Cover Letter Generator Application Logic
   v2.0 — Now with Resume Upload & Gemini AI
   ═══════════════════════════════════════════════════════════════════════════ */

const API_BASE = 'http://localhost:3000/api';
const STORAGE_KEY = 'covercraft_history';

// ─── Current Mode ────────────────────────────────────────────────────────────
let currentMode = 'manual'; // 'manual' or 'resume'
let selectedFile = null;    // The selected resume File object

// ─── DOM Elements ────────────────────────────────────────────────────────────

const form = document.getElementById('coverLetterForm');
const btnGenerate = document.getElementById('btnGenerate');
const outputCard = document.getElementById('outputCard');
const coverLetterOutput = document.getElementById('coverLetterOutput');

const btnCopy = document.getElementById('btnCopy');
const btnDownloadTxt = document.getElementById('btnDownloadTxt');
const btnDownloadPdf = document.getElementById('btnDownloadPdf');

const btnHistory = document.getElementById('btnHistory');
const btnCloseHistory = document.getElementById('btnCloseHistory');
const historyPanel = document.getElementById('historyPanel');
const historyOverlay = document.getElementById('historyOverlay');
const historyList = document.getElementById('historyList');
const historyBadge = document.getElementById('historyBadge');
const btnClearHistory = document.getElementById('btnClearHistory');

const btnTheme = document.getElementById('btnTheme');
const toastContainer = document.getElementById('toastContainer');
const bgParticles = document.getElementById('bgParticles');

// Mode tabs
const tabManual = document.getElementById('tabManual');
const tabResume = document.getElementById('tabResume');
const manualMode = document.getElementById('manualMode');
const resumeMode = document.getElementById('resumeMode');

// Upload elements
const uploadZone = document.getElementById('uploadZone');
const resumeFileInput = document.getElementById('resumeFileInput');
const uploadProgress = document.getElementById('uploadProgress');
const uploadProgressBar = document.getElementById('uploadProgressBar');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const btnRemoveFile = document.getElementById('btnRemoveFile');

// ─── Field Config ────────────────────────────────────────────────────────────

const manualFields = [
  { id: 'fullName', label: 'Full Name', required: true },
  { id: 'jobTitle', label: 'Job Title', required: true },
  { id: 'companyName', label: 'Company Name', required: true },
  { id: 'skills', label: 'Skills', required: true },
  { id: 'jobDescription', label: 'Job Description', required: true },
  { id: 'experience', label: 'Experience', required: false },
];

const resumeFields = [
  { id: 'resumeJobTitle', label: 'Job Title', required: true },
  { id: 'resumeCompanyName', label: 'Company Name', required: true },
  { id: 'resumeJobDescription', label: 'Job Description', required: true },
];

// ─── Init ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  createParticles();
  updateHistoryBadge();
  setupEventListeners();
});

// ─── Event Listeners ─────────────────────────────────────────────────────────

function setupEventListeners() {
  // Form submit
  form.addEventListener('submit', handleGenerate);

  // Copy
  btnCopy.addEventListener('click', handleCopy);

  // Downloads
  btnDownloadTxt.addEventListener('click', handleDownloadTxt);
  btnDownloadPdf.addEventListener('click', handleDownloadPdf);

  // History
  btnHistory.addEventListener('click', openHistory);
  btnCloseHistory.addEventListener('click', closeHistory);
  historyOverlay.addEventListener('click', closeHistory);
  btnClearHistory.addEventListener('click', handleClearHistory);

  // Theme
  btnTheme.addEventListener('click', toggleTheme);

  // Clear validation on input (manual fields)
  manualFields.forEach(f => {
    const el = document.getElementById(f.id);
    el.addEventListener('input', () => clearFieldError(f.id));
  });

  // Clear validation on input (resume fields)
  resumeFields.forEach(f => {
    const el = document.getElementById(f.id);
    el.addEventListener('input', () => clearFieldError(f.id));
  });

  // ─── Mode Tabs ───────────────────────────────────────────────────────────
  tabManual.addEventListener('click', (e) => {
    e.preventDefault();
    switchMode('manual');
  });

  tabResume.addEventListener('click', (e) => {
    e.preventDefault();
    switchMode('resume');
  });

  // ─── Drag & Drop ─────────────────────────────────────────────────────────
  uploadZone.addEventListener('click', () => resumeFileInput.click());

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadZone.classList.add('drag-over');
  });

  uploadZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadZone.classList.remove('drag-over');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadZone.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  });

  // File input change
  resumeFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });

  // Remove file button
  btnRemoveFile.addEventListener('click', (e) => {
    e.preventDefault();
    removeSelectedFile();
  });
}

// ─── Mode Switching ──────────────────────────────────────────────────────────

function switchMode(mode) {
  currentMode = mode;

  if (mode === 'manual') {
    tabManual.classList.add('active');
    tabResume.classList.remove('active');
    manualMode.classList.remove('hidden');
    resumeMode.classList.add('hidden');
  } else {
    tabManual.classList.remove('active');
    tabResume.classList.add('active');
    manualMode.classList.add('hidden');
    resumeMode.classList.remove('hidden');
  }
}

// ─── File Handling ───────────────────────────────────────────────────────────

function handleFileSelect(file) {
  // Validate file type
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  const validExts = ['.pdf', '.docx'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();

  if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
    showToast('Only PDF and DOCX files are allowed', 'error');
    showResumeError('Please upload a PDF or DOCX file');
    return;
  }

  // Validate file size (5 MB)
  if (file.size > 5 * 1024 * 1024) {
    showToast('File is too large. Maximum size is 5 MB', 'error');
    showResumeError('File exceeds 5 MB limit');
    return;
  }

  selectedFile = file;
  clearResumeError();

  // Show file info
  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);
  fileInfo.classList.remove('hidden');
  uploadZone.classList.add('has-file');

  // Simulate upload progress
  simulateProgress();

  showToast(`📎 ${file.name} selected`, 'success');
}

function removeSelectedFile() {
  selectedFile = null;
  resumeFileInput.value = '';
  fileInfo.classList.add('hidden');
  uploadZone.classList.remove('has-file');
  uploadProgress.classList.add('hidden');
  uploadProgressBar.style.width = '0%';
  uploadProgressBar.classList.remove('animated');
  clearResumeError();
  showToast('File removed', 'info');
}

function simulateProgress() {
  uploadProgress.classList.remove('hidden');
  uploadProgressBar.style.width = '0%';
  uploadProgressBar.classList.remove('animated');

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 30 + 10;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => {
        uploadProgress.classList.add('hidden');
      }, 500);
    }
    uploadProgressBar.style.width = `${progress}%`;
  }, 100);
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function showResumeError(msg) {
  const errEl = document.getElementById('errResume');
  errEl.textContent = msg;
  errEl.classList.add('visible');
}

function clearResumeError() {
  const errEl = document.getElementById('errResume');
  errEl.textContent = '';
  errEl.classList.remove('visible');
}

// ─── Form Validation ─────────────────────────────────────────────────────────

function validateForm() {
  let isValid = true;
  const fields = currentMode === 'manual' ? manualFields : resumeFields;

  fields.forEach(f => {
    if (!f.required) return;
    const el = document.getElementById(f.id);
    const errEl = document.getElementById(`err${capitalize(f.id)}`);

    if (!el.value.trim()) {
      el.classList.add('input-error');
      if (errEl) {
        errEl.textContent = `${f.label} is required`;
        errEl.classList.add('visible');
      }
      isValid = false;
    }
  });

  // In resume mode, also check that a file is selected
  if (currentMode === 'resume' && !selectedFile) {
    showResumeError('Please upload your resume (PDF or DOCX)');
    isValid = false;
  }

  return isValid;
}

function clearFieldError(id) {
  const el = document.getElementById(id);
  const errEl = document.getElementById(`err${capitalize(id)}`);
  el.classList.remove('input-error');
  if (errEl) {
    errEl.textContent = '';
    errEl.classList.remove('visible');
  }
}

function clearAllErrors() {
  manualFields.forEach(f => clearFieldError(f.id));
  resumeFields.forEach(f => clearFieldError(f.id));
  clearResumeError();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Generate Cover Letter ──────────────────────────────────────────────────

async function handleGenerate(e) {
  e.preventDefault();
  clearAllErrors();

  if (!validateForm()) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  // Show loading state
  btnGenerate.classList.add('loading');
  btnGenerate.disabled = true;

  try {
    let result;

    if (currentMode === 'manual') {
      result = await generateManual();
    } else {
      result = await generateFromResume();
    }

    if (!result.success) {
      const errorMsg = result.errors ? result.errors.join(', ') : 'Generation failed';
      throw new Error(errorMsg);
    }

    // Display the result
    coverLetterOutput.textContent = result.coverLetter;
    outputCard.classList.remove('hidden');
    outputCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Save to history
    const historyData = currentMode === 'manual'
      ? {
          jobTitle: document.getElementById('jobTitle').value.trim(),
          companyName: document.getElementById('companyName').value.trim(),
          fullName: document.getElementById('fullName').value.trim(),
        }
      : {
          jobTitle: document.getElementById('resumeJobTitle').value.trim(),
          companyName: document.getElementById('resumeCompanyName').value.trim(),
          fullName: selectedFile ? `📎 ${selectedFile.name}` : 'Resume Upload',
        };

    saveToHistory(historyData, result.coverLetter);
    updateHistoryBadge();

    showToast('Cover letter generated successfully! 🎉', 'success');
  } catch (error) {
    console.error('Error:', error);

    if (currentMode === 'manual' &&
        (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      // Fallback: generate client-side if server is unreachable (manual mode only)
      const data = {};
      manualFields.forEach(f => {
        data[f.id] = document.getElementById(f.id).value.trim();
      });

      const fallbackLetter = generateClientSide(data);
      coverLetterOutput.textContent = fallbackLetter;
      outputCard.classList.remove('hidden');
      outputCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

      saveToHistory(data, fallbackLetter);
      updateHistoryBadge();

      showToast('Generated offline (server not running)', 'info');
    } else {
      showToast(error.message, 'error');
    }
  } finally {
    btnGenerate.classList.remove('loading');
    btnGenerate.disabled = false;
  }
}

// ─── API Calls ───────────────────────────────────────────────────────────────

async function generateManual() {
  const data = {};
  manualFields.forEach(f => {
    data[f.id] = document.getElementById(f.id).value.trim();
  });

  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return await response.json();
}

async function generateFromResume() {
  const formData = new FormData();
  formData.append('resume', selectedFile);
  formData.append('jobTitle', document.getElementById('resumeJobTitle').value.trim());
  formData.append('companyName', document.getElementById('resumeCompanyName').value.trim());
  formData.append('jobDescription', document.getElementById('resumeJobDescription').value.trim());

  // Show progress animation during upload
  uploadProgress.classList.remove('hidden');
  uploadProgressBar.style.width = '30%';
  uploadProgressBar.classList.add('animated');

  try {
    const response = await fetch(`${API_BASE}/generate-from-resume`, {
      method: 'POST',
      body: formData,
    });

    uploadProgressBar.style.width = '100%';
    uploadProgressBar.classList.remove('animated');

    setTimeout(() => {
      uploadProgress.classList.add('hidden');
      uploadProgressBar.style.width = '0%';
    }, 500);

    return await response.json();
  } catch (err) {
    uploadProgress.classList.add('hidden');
    uploadProgressBar.style.width = '0%';
    uploadProgressBar.classList.remove('animated');
    throw err;
  }
}

// ─── Client-side Fallback Generator ─────────────────────────────────────────

function generateClientSide({ fullName, jobTitle, companyName, jobDescription, skills, experience }) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
  const skillsStr = formatList(skillList);

  const expBlock = experience
    ? `\nWith ${experience}, I have developed a strong foundation that aligns well with the demands of this role. My background has equipped me with practical insights and a proven ability to deliver results in dynamic environments.\n`
    : '';

  return `${today}

Dear Hiring Manager,

I am writing to express my enthusiastic interest in the ${jobTitle} position at ${companyName}. After carefully reviewing the job description, I am confident that my skills, experience, and passion make me an excellent candidate for this opportunity.

I bring a proven track record of delivering high-quality results, and I am eager to contribute to ${companyName}'s continued success.
${expBlock}
My key competencies include ${skillsStr}. These skills, combined with my dedication to continuous learning and professional growth, position me well to make meaningful contributions to your team from day one.

I am particularly drawn to ${companyName} because of its reputation for innovation and excellence. I am excited about the prospect of bringing my unique blend of skills and experience to your organization, and I am confident that I can add significant value to your team.

I would welcome the opportunity to discuss how my background, skills, and enthusiasm align with the goals of ${companyName}. I am available for an interview at your earliest convenience and look forward to the possibility of contributing to your team.

Thank you for considering my application. I look forward to hearing from you.

Sincerely,
${fullName}`;
}

function formatList(items) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

// ─── Copy to Clipboard ──────────────────────────────────────────────────────

async function handleCopy() {
  const text = coverLetterOutput.textContent;
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Copied to clipboard!', 'success');
  }
}

// ─── Download as .txt ────────────────────────────────────────────────────────

function handleDownloadTxt() {
  const text = coverLetterOutput.textContent;
  const blob = new Blob([text], { type: 'text/plain' });
  downloadBlob(blob, 'cover-letter.txt');
  showToast('Downloaded as .txt', 'success');
}

// ─── Download as .pdf ────────────────────────────────────────────────────────

function handleDownloadPdf() {
  const text = coverLetterOutput.textContent;

  // Create a hidden iframe for printing as PDF
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cover Letter</title>
      <style>
        body {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.6;
          max-width: 700px;
          margin: 40px auto;
          padding: 20px;
          color: #1a1a1a;
        }
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
        }
        @media print {
          body { margin: 0; padding: 20mm; }
        }
      </style>
    </head>
    <body>
      <pre>${escapeHtml(text)}</pre>
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() { window.close(); };
        };
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();

  showToast('PDF print dialog opened', 'info');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Local Storage History ──────────────────────────────────────────────────

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveToHistory(data, coverLetter) {
  const history = getHistory();
  history.unshift({
    id: Date.now(),
    jobTitle: data.jobTitle,
    companyName: data.companyName,
    fullName: data.fullName,
    coverLetter,
    createdAt: new Date().toISOString(),
  });

  // Keep only last 20 entries
  if (history.length > 20) history.length = 20;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function updateHistoryBadge() {
  const count = getHistory().length;
  historyBadge.textContent = count;
  historyBadge.style.display = count > 0 ? 'inline-block' : 'none';
}

function renderHistory() {
  const history = getHistory();

  if (history.length === 0) {
    historyList.innerHTML = '<p class="history-empty">No saved letters yet.</p>';
    return;
  }

  historyList.innerHTML = history.map(item => {
    const date = new Date(item.createdAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    return `
      <div class="history-item" data-id="${item.id}">
        <div class="history-item-title">${escapeHtml(item.jobTitle)} @ ${escapeHtml(item.companyName)}</div>
        <div class="history-item-meta">${escapeHtml(item.fullName)} — ${date}</div>
        <div class="history-item-actions">
          <button class="btn btn-icon" onclick="loadHistoryItem(${item.id})">📄 View</button>
          <button class="btn btn-icon" onclick="deleteHistoryItem(${item.id})">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function openHistory() {
  renderHistory();
  historyPanel.classList.remove('hidden');
  historyOverlay.classList.remove('hidden');
  // Trigger animation
  requestAnimationFrame(() => {
    historyPanel.classList.add('visible');
    historyOverlay.classList.add('visible');
  });
}

function closeHistory() {
  historyPanel.classList.remove('visible');
  historyOverlay.classList.remove('visible');
  setTimeout(() => {
    historyPanel.classList.add('hidden');
    historyOverlay.classList.add('hidden');
  }, 400);
}

// These are called from HTML onclick attributes
window.loadHistoryItem = function (id) {
  const history = getHistory();
  const item = history.find(h => h.id === id);
  if (item) {
    coverLetterOutput.textContent = item.coverLetter;
    outputCard.classList.remove('hidden');
    closeHistory();
    outputCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('Loaded saved letter', 'info');
  }
};

window.deleteHistoryItem = function (id) {
  let history = getHistory();
  history = history.filter(h => h.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  updateHistoryBadge();
  renderHistory();
  showToast('Letter deleted', 'info');
};

function handleClearHistory() {
  if (getHistory().length === 0) return;
  localStorage.removeItem(STORAGE_KEY);
  updateHistoryBadge();
  renderHistory();
  showToast('All history cleared', 'info');
}

// ─── Theme Toggle ───────────────────────────────────────────────────────────

function initTheme() {
  const saved = localStorage.getItem('covercraft_theme');
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';

  if (next === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }

  localStorage.setItem('covercraft_theme', next);
}

// ─── Background Particles ───────────────────────────────────────────────────

function createParticles() {
  const colors = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#14b8a6'];

  for (let i = 0; i < 25; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');

    const size = Math.random() * 6 + 2;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const duration = Math.random() * 20 + 15;
    const delay = Math.random() * 20;

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.background = color;
    particle.style.left = `${left}%`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${delay}s`;

    bgParticles.appendChild(particle);
  }
}

// ─── Toast Notifications ────────────────────────────────────────────────────

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
