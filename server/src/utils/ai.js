/**
 * Description generation for the Create Opportunity form.
 *
 * Uses the Gemini REST API when GEMINI_API_KEY is set. When the key is missing
 * — or the call fails for any reason — it falls back to a local template
 * generator so the feature always returns something usable.
 */

const CATEGORY_FLAVOUR = {
  Environment: {
    impact: 'protecting green spaces and keeping our shared environment healthy',
    task: 'clearing litter, planting, and caring for the site',
  },
  Education: {
    impact: 'helping learners build confidence and reach their goals',
    task: 'tutoring, reading with students, and supporting classroom activities',
  },
  Health: {
    impact: 'making care and wellbeing more accessible to everyone',
    task: 'greeting visitors, organising supplies, and assisting staff',
  },
  Animals: {
    impact: 'giving rescued animals the care and attention they deserve',
    task: 'feeding, walking, socialising animals, and cleaning enclosures',
  },
  Community: {
    impact: 'bringing neighbours together and strengthening local ties',
    task: 'setting up, welcoming guests, and helping the day run smoothly',
  },
  'Food Security': {
    impact: 'making sure no neighbour goes hungry',
    task: 'sorting donations, packing hampers, and serving meals',
  },
  Seniors: {
    impact: 'keeping older neighbours connected and supported',
    task: 'sharing conversation, running errands, and helping with activities',
  },
  'Disaster Relief': {
    impact: 'helping families recover and rebuild after a crisis',
    task: 'distributing supplies, staffing relief points, and assisting with clean-up',
  },
};

function mockDescription({ title, category, location }) {
  const flavour = CATEGORY_FLAVOUR[category] || {
    impact: 'making a real difference in the local community',
    task: 'lending a hand wherever the team needs support',
  };

  return (
    `Join us in ${location} for "${title}" — a hands-on ${category.toLowerCase()} ` +
    `opportunity focused on ${flavour.impact}. ` +
    `Volunteers will spend the day ${flavour.task}, working alongside a friendly team ` +
    `that will show you the ropes. ` +
    `No previous experience is needed — just bring comfortable clothes, a water bottle, ` +
    `and your enthusiasm. ` +
    `Whether you can give a couple of hours or the whole session, your time directly ` +
    `supports the people and places that need it most. Sign up today and be part of it!`
  );
}

async function geminiDescription({ title, category, location }) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const prompt =
    `Write a concise, engaging description for a volunteer opportunity.\n\n` +
    `Title: ${title}\nCategory: ${category}\nLocation: ${location}\n\n` +
    `Requirements:\n` +
    `- 3 to 5 sentences, 60-110 words, single paragraph.\n` +
    `- Warm and welcoming; explain the impact volunteers will have and what they will do.\n` +
    `- Mention that no prior experience is required.\n` +
    `- End with a short call to action.\n` +
    `- Plain text only. No markdown, no headings, no bullet points, no quotes.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 400 },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini responded ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || '')
      .join('')
      .trim();

    if (!text) throw new Error('Gemini returned an empty response');
    return text.replace(/\s+/g, ' ').trim();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * @returns {Promise<{description: string, source: 'gemini'|'mock', note?: string}>}
 */
export async function generateDescription({ title, category, location }) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      description: mockDescription({ title, category, location }),
      source: 'mock',
      note: 'GEMINI_API_KEY is not set — generated with the built-in template.',
    };
  }

  try {
    const description = await geminiDescription({ title, category, location });
    return { description, source: 'gemini' };
  } catch (err) {
    console.warn('[ai] Gemini call failed, falling back to template:', err.message);
    return {
      description: mockDescription({ title, category, location }),
      source: 'mock',
      note: 'The AI service was unavailable — generated with the built-in template.',
    };
  }
}
