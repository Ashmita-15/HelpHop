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
  venue: '',
  date: '',
  startTime: '',
  endTime: '',
  requiredVolunteers: 10,
  gigMode: 'none',
  gigAmount: '',
  gigCurrency: 'INR',
  perkTitle: '',
  perkDescription: '',
};

const GIG_MODES = [
  { value: 'none', label: 'Nothing', hint: 'People come for the cause alone' },
  { value: 'paid', label: 'A payment', hint: 'A fixed amount for each volunteer' },
  { value: 'perk', label: 'A thank-you', hint: 'Lunch, travel costs, a voucher' },
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
 * Shared create/edit form, including the description generator.
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
        venue: form.venue,
        startTime: form.startTime,
        endTime: form.endTime,
      });
      setForm((f) => ({ ...f, description: res.description }));
      setAiNote(
        res.source === 'gemini'
          ? 'Here is a first draft. Edit it until it sounds like you.'
          : res.note || 'A draft from the built-in template. Edit it until it sounds like you.'
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
        setError('Give the thank-you a name, for example “Lunch and ₹200 towards travel”.');
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
      venue: form.venue.trim(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      requiredVolunteers: Number(form.requiredVolunteers),
      gig,
    };

    if (payload.endTime && !payload.startTime) {
      setError('Add a start time before an end time.');
      return;
    }
    if (payload.startTime && payload.endTime && payload.endTime <= payload.startTime) {
      setError('The end time needs to be after the start time.');
      return;
    }

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
      setError('The number of volunteers needs to be a whole number, at least 1.');
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
    <form onSubmit={handleSubmit} className="space-y-14" noValidate>
      {error && (
        <Alert type="error" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* ------------------------------------------------------- the basics */}
      <Fieldset
        step="01"
        legend="When and where"
        note="This is what people see on the card before they click through."
      >
        <div>
          <label className="label" htmlFor="title">
            What is it called?
          </label>
          <input
            id="title"
            className="input"
            placeholder="Saturday morning at the allotment"
            value={form.title}
            onChange={set('title')}
            maxLength={120}
            required
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="category">
              Cause
            </label>
            <select
              id="category"
              className="input"
              value={form.category}
              onChange={set('category')}
              required
            >
              <option value="">Choose a cause…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="location">
              Town or area
            </label>
            <input
              id="location"
              className="input"
              placeholder="Bandra West, Mumbai"
              value={form.location}
              onChange={set('location')}
              required
            />
            <p className="hint mt-2">This is what people search by.</p>
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="venue">
              Exact meeting point <span className="normal-case tracking-normal text-bark-400">(optional)</span>
            </label>
            <input
              id="venue"
              className="input"
              placeholder="Gate 3, Riverside Park — look for the green gazebo"
              maxLength={200}
              value={form.venue}
              onChange={set('venue')}
            />
            <p className="hint mt-2">Where to go once they arrive, and who to look for.</p>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="startTime">
                Starts
              </label>
              <input
                id="startTime"
                type="time"
                className="input"
                value={form.startTime}
                onChange={set('startTime')}
              />
            </div>
            <div>
              <label className="label" htmlFor="endTime">
                Ends
              </label>
              <input
                id="endTime"
                type="time"
                className="input"
                value={form.endTime}
                onChange={set('endTime')}
                disabled={!form.startTime}
                title={form.startTime ? undefined : 'Set a start time first'}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="requiredVolunteers">
              How many people do you need?
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
            <p className="hint mt-2">Sign-ups close on their own once this many have joined.</p>
          </div>
        </div>
      </Fieldset>

      {/* ------------------------------------------------------ description */}
      <Fieldset
        step="02"
        legend="What it actually involves"
        note="Be specific. People decide on this paragraph more than anything else."
        action={
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className="btn-outline btn-sm"
            title={
              canGenerate
                ? 'Draft something from the details above'
                : 'Add a title, cause and town first'
            }
          >
            {generating ? (
              <Spinner className="h-3.5 w-3.5" />
            ) : (
              <Icon name="sparkle" className="h-3.5 w-3.5" />
            )}
            {generating ? 'Writing…' : 'Draft it for me'}
          </button>
        }
      >
        <div>
          <label className="sr-only" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={10}
            className="input resize-y leading-[1.8]"
            placeholder="What volunteers will be doing, what to wear or bring, and who to look for when they arrive…"
            value={form.description}
            onChange={set('description')}
            maxLength={4000}
            required
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="hint">
              {!canGenerate && 'Fill in the title, cause and town to use the drafting button.'}
            </p>
            <p className="hint tabular-nums">{form.description.length}/4000</p>
          </div>
        </div>

        {aiNote && (
          <Alert type="info" onDismiss={() => setAiNote('')}>
            {aiNote}
          </Alert>
        )}
      </Fieldset>

      {/* -------------------------------------------------------- thank-you */}
      <Fieldset
        step="03"
        legend="What volunteers get"
        note="Everyone marked present receives a certificate. Anything else you offer is recorded here and settled by you directly."
      >
        <fieldset>
          <legend className="sr-only">Reward type</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {GIG_MODES.map((mode) => {
              const active = form.gigMode === mode.value;
              return (
                <label
                  key={mode.value}
                  className={`cursor-pointer rounded-card border p-4 transition-all duration-200 ease-natural ${
                    active
                      ? 'border-sage-500 bg-sage-50'
                      : 'border-bark-200 bg-paper hover:border-bark-300'
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
                  <span className="flex items-center gap-2 font-serif text-base text-bark-700">
                    {mode.value !== 'none' && (
                      <Icon
                        name={mode.value === 'paid' ? 'wallet' : 'gift'}
                        className={`h-4 w-4 ${active ? 'text-sage-600' : 'text-bark-400'}`}
                      />
                    )}
                    {mode.label}
                  </span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-bark-500">
                    {mode.hint}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {form.gigMode === 'paid' && (
          <div className="grid gap-6 sm:grid-cols-[1fr_9rem]">
            <div>
              <label className="label" htmlFor="gigAmount">
                Amount for each volunteer
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
              HelpHop records what you owe and marks it off when you say it is settled. The money
              never passes through us — you pay people your usual way.
            </p>
          </div>
        )}

        {form.gigMode === 'perk' && (
          <div className="space-y-6">
            <div>
              <label className="label" htmlFor="perkTitle">
                What are you offering?
              </label>
              <input
                id="perkTitle"
                className="input"
                placeholder="Lunch and ₹200 towards travel"
                maxLength={120}
                value={form.perkTitle}
                onChange={set('perkTitle')}
              />
            </div>
            <div>
              <label className="label" htmlFor="perkDescription">
                Any details <span className="normal-case tracking-normal text-bark-400">(optional)</span>
              </label>
              <textarea
                id="perkDescription"
                rows={3}
                className="input resize-y"
                placeholder="How people claim it, when it is handed over, anything they should bring…"
                maxLength={1000}
                value={form.perkDescription}
                onChange={set('perkDescription')}
              />
            </div>
          </div>
        )}
      </Fieldset>

      {/* ---------------------------------------------------------- actions */}
      <div className="flex flex-col-reverse gap-3 border-t border-bark-200/70 pt-8 sm:flex-row sm:justify-end">
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={saving}>
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

/**
 * One numbered section of the form. The step numeral and the ruled heading are
 * what keep a long form feeling like a page rather than a settings screen.
 */
function Fieldset({ step, legend, note, action, children }) {
  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-bark-200/70 pb-5">
        <div className="flex gap-5">
          <span className="font-serif text-xl italic text-sage-500">{step}</span>
          <div>
            <h2 className="font-serif text-xl text-bark-700">{legend}</h2>
            {note && <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-bark-500">{note}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-7 space-y-6">{children}</div>
    </section>
  );
}
