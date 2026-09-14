import { useState } from 'react';
import { api } from '../api/client.js';
import { Alert, Icon, Spinner } from './ui.jsx';

const CATEGORIES = [
  'Environment',
  'Education',
  'Health',
  'Animals',
  'Community',
  'Food Security',
  'Seniors',
  'Disaster Relief',
];

export const emptyOpportunity = {
  title: '',
  description: '',
  category: '',
  location: '',
  date: '',
  requiredVolunteers: 10,
};

/** Turns an ISO date from the API into the yyyy-mm-dd a date input expects. */
export const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

/**
 * Shared create/edit form, including the AI description generator.
 * `onSubmit` receives the cleaned payload and may throw to surface an error.
 */
export default function OpportunityForm({
  initialValues = emptyOpportunity,
  submitLabel,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(initialValues);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiNote, setAiNote] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const canGenerate = Boolean(form.title.trim() && form.category && form.location.trim());

  const handleGenerate = async () => {
    setError('');
    setAiNote('');
    setGenerating(true);
    try {
      const res = await api.generateDescription({
        title: form.title,
        category: form.category,
        location: form.location,
      });
      setForm((f) => ({ ...f, description: res.description }));
      setAiNote(
        res.source === 'gemini'
          ? 'Draft written by Gemini — edit it to sound like you.'
          : res.note || 'Draft from the built-in template — edit it to sound like you.'
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      location: form.location.trim(),
      date: form.date,
      requiredVolunteers: Number(form.requiredVolunteers),
    };

    if (
      !payload.title ||
      !payload.description ||
      !payload.category ||
      !payload.location ||
      !payload.date
    ) {
      setError('Please fill in every field before saving.');
      return;
    }
    if (!Number.isInteger(payload.requiredVolunteers) || payload.requiredVolunteers < 1) {
      setError('Number of volunteers must be a whole number of at least 1.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <Alert type="error" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* ---------------------------------------------------------- basics */}
      <section className="card p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink-900">The basics</h2>
        <p className="mt-1 text-sm text-ink-500">
          This is what volunteers see on the card before they click through.
        </p>

        <div className="mt-5 space-y-5">
          <div>
            <label className="label" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              className="input"
              placeholder="e.g. Saturday morning beach clean-up"
              value={form.title}
              onChange={set('title')}
              maxLength={120}
              required
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                className="input"
                value={form.category}
                onChange={set('category')}
                required
              >
                <option value="">Choose a category…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                className="input"
                placeholder="e.g. Portland, OR"
                value={form.location}
                onChange={set('location')}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="date">
                Date
              </label>
              <input
                id="date"
                type="date"
                className="input"
                value={form.date}
                onChange={set('date')}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="requiredVolunteers">
                Volunteers needed
              </label>
              <input
                id="requiredVolunteers"
                type="number"
                min="1"
                max="10000"
                className="input"
                value={form.requiredVolunteers}
                onChange={set('requiredVolunteers')}
                required
              />
              <p className="hint mt-1.5">Sign-ups stop automatically once this many join.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- description */}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink-900">Description</h2>
            <p className="mt-1 text-sm text-ink-500">
              What volunteers will actually do, and what to bring.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className="btn-secondary btn-sm"
            title={
              canGenerate
                ? 'Draft a description from the details above'
                : 'Add a title, category and location first'
            }
          >
            {generating ? <Spinner className="h-3.5 w-3.5" /> : <Icon name="sparkle" className="h-3.5 w-3.5" />}
            {generating ? 'Generating…' : 'Generate description'}
          </button>
        </div>

        <textarea
          id="description"
          rows={9}
          className="input mt-5 resize-y leading-relaxed"
          placeholder="Describe the shift: what volunteers will be doing, what to wear or bring, and who to look for when they arrive…"
          value={form.description}
          onChange={set('description')}
          maxLength={4000}
          required
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="hint">
            {!canGenerate && 'Fill in title, category and location to enable the generator.'}
          </p>
          <p className="hint tabular-nums">{form.description.length}/4000</p>
        </div>

        {aiNote && (
          <div className="mt-3">
            <Alert type="info" onDismiss={() => setAiNote('')}>
              {aiNote}
            </Alert>
          </div>
        )}
      </section>

      {/* --------------------------------------------------------- actions */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <button type="button" className="btn-outline" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Spinner className="h-4 w-4" />}
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
