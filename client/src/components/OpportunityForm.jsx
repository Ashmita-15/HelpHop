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
  gigMode: 'none',
  gigAmount: '',
  gigCurrency: 'INR',
  perkTitle: '',
  perkDescription: '',
};

const GIG_MODES = [
  { value: 'none', label: 'Nothing', hint: 'Volunteers take part for the cause alone' },
  { value: 'paid', label: 'Payment', hint: 'A fixed amount per volunteer' },
  { value: 'perk', label: 'Reward', hint: 'A voucher, kit, meal or other perk' },
];

/** Flattens the API's nested gig object into the flat shape this form edits. */
export const gigToForm = (gig) => ({
  gigMode: gig?.mode || 'none',
  gigAmount: gig?.amount ?? '',
  gigCurrency: gig?.currency || 'INR',
  perkTitle: gig?.perkTitle || '',
  perkDescription: gig?.perkDescription || '',
});

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

    let gig = { mode: 'none' };
    if (form.gigMode === 'paid') {
      const amount = Number(form.gigAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setError('Enter how much each volunteer will be paid.');
        return;
      }
      gig = { mode: 'paid', amount, currency: (form.gigCurrency || 'INR').toUpperCase() };
    } else if (form.gigMode === 'perk') {
      if (!form.perkTitle.trim()) {
        setError('Give the reward a name, e.g. "Lunch + ₹200 travel voucher".');
        return;
      }
      gig = {
        mode: 'perk',
        perkTitle: form.perkTitle.trim(),
        perkDescription: form.perkDescription.trim(),
      };
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      location: form.location.trim(),
      date: form.date,
      requiredVolunteers: Number(form.requiredVolunteers),
      gig,
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

      {/* ------------------------------------------------------------- gig */}
      <section className="card p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink-900">What volunteers get</h2>
        <p className="mt-1 text-sm text-ink-500">
          Issued automatically to everyone marked present when you complete the event. Everyone who
          attends receives a certificate either way.
        </p>

        <fieldset className="mt-5">
          <legend className="sr-only">Reward type</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {GIG_MODES.map((mode) => {
              const active = form.gigMode === mode.value;
              return (
                <label
                  key={mode.value}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    active
                      ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500'
                      : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="gigMode"
                    value={mode.value}
                    checked={active}
                    onChange={set('gigMode')}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                    {mode.value !== 'none' && (
                      <Icon
                        name={mode.value === 'paid' ? 'wallet' : 'gift'}
                        className={`h-4 w-4 ${active ? 'text-brand-600' : 'text-ink-400'}`}
                      />
                    )}
                    {mode.label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-ink-500">{mode.hint}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {form.gigMode === 'paid' && (
          <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_8rem]">
            <div>
              <label className="label" htmlFor="gigAmount">
                Amount per volunteer
              </label>
              <input
                id="gigAmount"
                type="number"
                min="1"
                step="1"
                className="input"
                placeholder="500"
                value={form.gigAmount}
                onChange={set('gigAmount')}
              />
            </div>
            <div>
              <label className="label" htmlFor="gigCurrency">
                Currency
              </label>
              <input
                id="gigCurrency"
                className="input uppercase"
                maxLength={3}
                value={form.gigCurrency}
                onChange={set('gigCurrency')}
              />
            </div>
            <p className="hint sm:col-span-2">
              VolunteerConnect records what you owe and tracks it as paid — it never handles the
              money itself. You pay volunteers your usual way.
            </p>
          </div>
        )}

        {form.gigMode === 'perk' && (
          <div className="mt-5 space-y-5">
            <div>
              <label className="label" htmlFor="perkTitle">
                Reward
              </label>
              <input
                id="perkTitle"
                className="input"
                placeholder="e.g. Lunch + ₹200 travel voucher"
                maxLength={120}
                value={form.perkTitle}
                onChange={set('perkTitle')}
              />
            </div>
            <div>
              <label className="label" htmlFor="perkDescription">
                Details <span className="font-normal text-ink-400">(optional)</span>
              </label>
              <textarea
                id="perkDescription"
                rows={3}
                className="input resize-y"
                placeholder="How volunteers claim it, when it's handed over, anything they should bring…"
                maxLength={1000}
                value={form.perkDescription}
                onChange={set('perkDescription')}
              />
            </div>
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
