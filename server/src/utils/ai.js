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

/** Human-readable reason for a failed call, for the note shown in the form. */
class AiError extends Error {
  constructor(message, note) {
    super(message);
    this.note = note;
  }
}

async function geminiDescription({ title, category, location, venue, startTime, endTime }) {
  // 2.5-flash is what the old 'gemini-2.0-flash' alias already resolves to.
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  // Only send the optional fields that are actually set, so the model never
  // writes around an empty "Venue:" line.
  const facts = [
    `Title: ${title}`,
    `Category: ${category}`,
    `Location: ${location}`,
    venue ? `Venue: ${venue}` : null,
    startTime ? `Time: ${startTime}${endTime ? ` to ${endTime}` : ''}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const prompt =
    `Write a concise, engaging description for a volunteer opportunity.\n\n` +
    `${facts}\n\n` +
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
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 800,
          // Gemini 2.5 bills internal reasoning against maxOutputTokens. Left
          // on, thinking eats the whole budget and the description comes back
          // truncated or empty. We don't need reasoning for a short blurb.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      // The body can echo request details, so keep it out of the user's note.
      const note =
        res.status === 429
          ? 'The AI service is rate-limited right now — generated with the built-in template.'
          : res.status === 400 || res.status === 403
            ? 'The AI key was rejected — check GEMINI_API_KEY. Generated with the built-in template.'
            : 'The AI service was unavailable — generated with the built-in template.';
      throw new AiError(`Gemini responded ${res.status}: ${body.slice(0, 200)}`, note);
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts
      ?.map((p) => p.text || '')
      .join('')
      .trim();

    // A description cut off mid-sentence is worse than the template, so treat
    // truncation as a failure even when some text came back.
    if (candidate?.finishReason === 'MAX_TOKENS') {
      throw new AiError(
        `Gemini hit the output cap (thinking tokens: ${data?.usageMetadata?.thoughtsTokenCount ?? 0})`,
        'The AI reply was cut short — generated with the built-in template.'
      );
    }
    if (!text) {
      throw new AiError(
        `Gemini returned no text (finishReason: ${candidate?.finishReason || 'unknown'})`,
        'The AI returned nothing usable — generated with the built-in template.'
      );
    }

    return text.replace(/\s+/g, ' ').trim();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * @returns {Promise<{description: string, source: 'gemini'|'mock', note?: string}>}
 */
export async function generateDescription({
  title,
  category,
  location,
  venue,
  startTime,
  endTime,
}) {
  // The template only ever needs these three; venue and time are a bonus for
  // the model, never a requirement.
  const fallback = () => mockDescription({ title, category, location });

  if (!process.env.GEMINI_API_KEY) {
    return {
      description: fallback(),
      source: 'mock',
      note: 'GEMINI_API_KEY is not set — generated with the built-in template.',
    };
  }

  try {
    const description = await geminiDescription({
      title,
      category,
      location,
      venue,
      startTime,
      endTime,
    });
    return { description, source: 'gemini' };
  } catch (err) {
    const timedOut = err.name === 'AbortError';
    // err.message can carry API detail; the note is what the organizer sees.
    console.warn('[ai] Gemini call failed, falling back to template:', err.message);
    return {
      description: fallback(),
      source: 'mock',
      note: timedOut
        ? 'The AI service took too long to answer — generated with the built-in template.'
        : err.note || 'The AI service was unavailable — generated with the built-in template.',
    };
  }
}
