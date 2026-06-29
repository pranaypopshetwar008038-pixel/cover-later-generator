/**
 * Cover Letter Generator
 * Supports three modes:
 *   1. Template-based (default) — no API key required
 *   2. AI-powered (OpenAI) — requires OPENAI_API_KEY in .env
 *   3. Gemini AI (Google) — requires GEMINI_API_KEY in .env
 */

// ─── Template-based generation ───────────────────────────────────────────────

function generateFromTemplate({ fullName, jobTitle, companyName, jobDescription, skills, experience }) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const skillsList = skills
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const skillsFormatted = formatList(skillsList);

  // Extract key phrases from job description for personalization
  const keyPhrases = extractKeyPhrases(jobDescription);

  const experienceBlock = experience
    ? `\nWith ${experience}, I have developed a strong foundation that aligns well with the demands of this role. My background has equipped me with practical insights and a proven ability to deliver results in dynamic environments.\n`
    : '';

  const coverLetter = `${today}

Dear Hiring Manager,

I am writing to express my enthusiastic interest in the ${jobTitle} position at ${companyName}. After carefully reviewing the job description, I am confident that my skills, experience, and passion make me an excellent candidate for this opportunity.

${keyPhrases.length > 0 ? `Your emphasis on ${formatList(keyPhrases)} resonates strongly with my professional background and career aspirations. ` : ''}I bring a proven track record of delivering high-quality results, and I am eager to contribute to ${companyName}'s continued success.
${experienceBlock}
My key competencies include ${skillsFormatted}. These skills, combined with my dedication to continuous learning and professional growth, position me well to make meaningful contributions to your team from day one.

I am particularly drawn to ${companyName} because of its reputation for innovation and excellence. I am excited about the prospect of bringing my unique blend of skills and experience to your organization, and I am confident that I can add significant value to your team.

I would welcome the opportunity to discuss how my background, skills, and enthusiasm align with the goals of ${companyName}. I am available for an interview at your earliest convenience and look forward to the possibility of contributing to your team.

Thank you for considering my application. I look forward to hearing from you.

Sincerely,
${fullName}`;

  return coverLetter;
}

function extractKeyPhrases(description) {
  const keywords = [
    'team collaboration', 'leadership', 'problem solving', 'communication',
    'innovation', 'customer focus', 'agile', 'data driven', 'strategic thinking',
    'project management', 'technical expertise', 'attention to detail',
    'fast-paced environment', 'cross-functional', 'stakeholder management',
    'continuous improvement', 'analytical skills', 'creative solutions',
  ];

  const lower = description.toLowerCase();
  return keywords.filter(kw => lower.includes(kw)).slice(0, 3);
}

function formatList(items) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

// ─── AI-powered generation (OpenAI) ─────────────────────────────────────────

async function generateWithOpenAI({ fullName, jobTitle, companyName, jobDescription, skills, experience }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const fetchFn = globalThis.fetch || (await import('node-fetch')).default;

  const prompt = `Write a professional cover letter for the following:
- Applicant Name: ${fullName}
- Job Title: ${jobTitle}
- Company: ${companyName}
- Job Description: ${jobDescription}
- Key Skills: ${skills}
${experience ? `- Experience: ${experience}` : ''}

Requirements:
- Professional tone, confident but not arrogant
- Mention the company name and role naturally
- Highlight relevant skills
- Include a strong opening and closing
- Format with proper date, greeting, body paragraphs, and sign-off
- Do NOT include any placeholders like [Your Address]`;

  const response = await fetchFn('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a professional cover letter writer. Write polished, personalized cover letters.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'OpenAI API request failed');
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// ─── AI-powered generation (Google Gemini) ──────────────────────────────────

async function callGeminiAPI(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const fetchFn = globalThis.fetch || (await import('node-fetch')).default;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetchFn(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `Gemini API error (${response.status})`;
    throw new Error(msg);
  }

  const data = await response.json();

  // Extract text from Gemini response
  const candidate = data.candidates?.[0];
  if (!candidate || !candidate.content?.parts?.[0]?.text) {
    throw new Error('No content returned from Gemini API');
  }

  return candidate.content.parts[0].text.trim();
}

async function generateWithGemini({ fullName, jobTitle, companyName, jobDescription, skills, experience }) {
  const prompt = `You are a professional cover letter writer. Write a polished, personalized cover letter based on the following details:

- Applicant Name: ${fullName}
- Job Title: ${jobTitle}
- Company: ${companyName}
- Job Description: ${jobDescription}
- Key Skills: ${skills}
${experience ? `- Experience: ${experience}` : ''}

Requirements:
- Professional tone, confident but not arrogant
- Mention the company name and job title naturally throughout
- Highlight the most relevant skills for this specific role
- Include a compelling opening paragraph and a strong closing
- Format with today's date, a professional greeting, 3-4 body paragraphs, and a sign-off
- Do NOT include any placeholders like [Your Address] or [Company Address]
- Do NOT use markdown formatting — output plain text only`;

  return callGeminiAPI(prompt);
}

// ─── Generate from Resume (Gemini AI) ───────────────────────────────────────

async function generateFromResume({ resumeText, jobTitle, companyName, jobDescription }) {
  const mode = process.env.GENERATION_MODE || 'template';
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;

  if ((mode === 'gemini' || mode === 'ai') && hasGeminiKey) {
    console.log('🤖 Generating from resume with Gemini AI...');
    return generateFromResumeWithGemini({ resumeText, jobTitle, companyName, jobDescription });
  }

  // Fallback: generate a template-based letter from resume text
  console.log('📝 Generating from resume with template fallback...');
  return generateFromResumeTemplate({ resumeText, jobTitle, companyName, jobDescription });
}

async function generateFromResumeWithGemini({ resumeText, jobTitle, companyName, jobDescription }) {
  const prompt = `You are an expert cover letter writer. Using the candidate's resume and the job details below, write a highly personalized, professional cover letter.

=== CANDIDATE'S RESUME ===
${resumeText.substring(0, 4000)}

=== JOB DETAILS ===
- Job Title: ${jobTitle}
- Company: ${companyName}
- Job Description: ${jobDescription}

=== INSTRUCTIONS ===
1. Extract the candidate's name, skills, experience, education, and achievements from the resume.
2. Match the candidate's qualifications to the job requirements.
3. Write a compelling, personalized cover letter that:
   - Uses the candidate's actual name (from the resume) for the sign-off
   - Highlights their most relevant experience and skills for THIS specific role
   - References specific achievements or projects from the resume that align with the job
   - Mentions the company name and role naturally
   - Has a strong, attention-grabbing opening
   - Includes 3-4 well-structured body paragraphs
   - Ends with a confident closing and call to action
4. Format with today's date at the top, professional greeting, body, and sign-off
5. Use a professional but warm tone — confident, not arrogant
6. Do NOT include placeholders like [Your Address] or [Phone Number]
7. Do NOT use markdown formatting — output plain text only`;

  return callGeminiAPI(prompt);
}

function generateFromResumeTemplate({ resumeText, jobTitle, companyName, jobDescription }) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Try to extract name from first line of resume
  const firstLine = resumeText.split('\n').find(l => l.trim().length > 0) || 'Applicant';
  const name = firstLine.trim().split(/[\n|,;]/).shift().trim();

  return `${today}

Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position at ${companyName}. Based on my background and qualifications, I am confident that I would be a valuable addition to your team.

My resume reflects a diverse skill set and relevant experience that aligns well with the requirements outlined in the job description. I bring a proven track record of delivering results and am eager to contribute to ${companyName}'s continued growth and success.

I am particularly excited about this opportunity because it aligns with my career goals and allows me to leverage my experience in a meaningful way. I am drawn to ${companyName}'s reputation for excellence and innovation.

I would welcome the opportunity to discuss how my qualifications align with your needs. I am available for an interview at your earliest convenience.

Thank you for considering my application. I look forward to hearing from you.

Sincerely,
${name}`;
}

// ─── Exported functions ──────────────────────────────────────────────────────

async function generateCoverLetter(inputs) {
  const mode = process.env.GENERATION_MODE || 'template';
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

  if (mode === 'gemini' && hasGeminiKey) {
    console.log('🤖 Generating with Gemini AI...');
    return generateWithGemini(inputs);
  }

  if (mode === 'ai' && hasOpenAIKey) {
    console.log('🤖 Generating with OpenAI...');
    return generateWithOpenAI(inputs);
  }

  console.log('📝 Generating with template...');
  return generateFromTemplate(inputs);
}

module.exports = { generateCoverLetter, generateFromResume };
