require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { generateCoverLetter, generateFromResume } = require('./generator');
const { extractTextFromFile } = require('./resumeParser');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Multer Config ───────────────────────────────────────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  },
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const mode = process.env.GENERATION_MODE || 'template';
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  res.json({ status: 'ok', mode, hasGemini, hasOpenAI });
});

// ─── Generate cover letter (original text-based) ────────────────────────────
app.post('/api/generate', async (req, res) => {
  try {
    const { fullName, jobTitle, companyName, jobDescription, skills, experience } = req.body;

    // Validation
    const errors = [];
    if (!fullName || !fullName.trim()) errors.push('Full Name is required');
    if (!jobTitle || !jobTitle.trim()) errors.push('Job Title is required');
    if (!companyName || !companyName.trim()) errors.push('Company Name is required');
    if (!jobDescription || !jobDescription.trim()) errors.push('Job Description is required');
    if (!skills || !skills.trim()) errors.push('Skills are required');

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const coverLetter = await generateCoverLetter({
      fullName: fullName.trim(),
      jobTitle: jobTitle.trim(),
      companyName: companyName.trim(),
      jobDescription: jobDescription.trim(),
      skills: skills.trim(),
      experience: experience ? experience.trim() : '',
    });

    res.json({ success: true, coverLetter });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({
      success: false,
      errors: ['Failed to generate cover letter. Please try again.'],
    });
  }
});

// ─── Generate from Resume Upload ─────────────────────────────────────────────
app.post('/api/generate-from-resume', upload.single('resume'), async (req, res) => {
  try {
    // Check that a file was uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, errors: ['Resume file is required'] });
    }

    const { jobTitle, companyName, jobDescription } = req.body;

    // Validation
    const errors = [];
    if (!jobTitle || !jobTitle.trim()) errors.push('Job Title is required');
    if (!companyName || !companyName.trim()) errors.push('Company Name is required');
    if (!jobDescription || !jobDescription.trim()) errors.push('Job Description is required');

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // Extract text from the uploaded resume
    console.log(`📎 Parsing resume: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);
    const resumeText = await extractTextFromFile(req.file.buffer, req.file.mimetype);

    if (!resumeText || resumeText.trim().length < 20) {
      return res.status(400).json({
        success: false,
        errors: ['Could not extract meaningful text from the resume. Please check the file.'],
      });
    }

    console.log(`✅ Extracted ${resumeText.length} characters from resume`);

    // Generate cover letter using resume + job details
    const coverLetter = await generateFromResume({
      resumeText: resumeText.trim(),
      jobTitle: jobTitle.trim(),
      companyName: companyName.trim(),
      jobDescription: jobDescription.trim(),
    });

    res.json({ success: true, coverLetter, resumeExtracted: true });
  } catch (error) {
    console.error('Resume generation error:', error);

    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, errors: ['File too large. Maximum size is 5 MB.'] });
      }
      return res.status(400).json({ success: false, errors: [error.message] });
    }

    if (error.message.includes('Only PDF and DOCX')) {
      return res.status(400).json({ success: false, errors: [error.message] });
    }

    res.status(500).json({
      success: false,
      errors: ['Failed to generate cover letter from resume. Please try again.'],
    });
  }
});

// ─── Multer error handler middleware ─────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, errors: ['File too large. Maximum size is 5 MB.'] });
    }
    return res.status(400).json({ success: false, errors: [err.message] });
  }
  if (err.message && err.message.includes('Only PDF and DOCX')) {
    return res.status(400).json({ success: false, errors: [err.message] });
  }
  next(err);
});

// ─── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const mode = process.env.GENERATION_MODE || 'template';
  console.log(`✅ Cover Letter Generator API running on http://localhost:${PORT}`);
  console.log(`📝 Mode: ${mode}`);
  if (mode === 'gemini' && process.env.GEMINI_API_KEY) {
    console.log('🤖 Gemini AI: Connected');
  } else if (mode === 'gemini') {
    console.log('⚠️  Gemini API key not set — will fall back to template mode');
  }
});
