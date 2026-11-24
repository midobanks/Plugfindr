'use client';

import { REQUEST_CATEGORIES, REQUEST_SCOPE_TYPES } from '@plugfindr/domain';
import type { RequestCategory, RequestScopeType } from '@plugfindr/domain';
import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { enNG } from '../i18n/messages/en-NG';

type FormState = {
  readonly brief: string;
  readonly category: RequestCategory;
  readonly scopeType: RequestScopeType;
  readonly timeline: string;
  readonly budgetMin: string;
  readonly budgetMax: string;
  readonly budgetIsFlexible: boolean;
  readonly location: string;
  readonly mustHave: string;
  readonly niceToHave: string;
  readonly links: string;
};

const initialForm: FormState = {
  brief: '',
  category: 'design',
  scopeType: 'not_sure',
  timeline: '',
  budgetMin: '',
  budgetMax: '',
  budgetIsFlexible: false,
  location: '',
  mustHave: '',
  niceToHave: '',
  links: '',
};

function toList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toKobo(value: string): number | null {
  if (value.trim().length === 0) {
    return null;
  }
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}

export default function RequestForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState('');
  const [receiptId, setReceiptId] = useState('');
  const [isSending, setIsSending] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSending(true);
    setStatus('');

    try {
      const response = await fetch('/v1/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          brief: form.brief,
          category: form.category,
          scopeType: form.scopeType,
          timeline: form.timeline,
          budgetMinKobo: form.budgetIsFlexible ? null : toKobo(form.budgetMin),
          budgetMaxKobo: form.budgetIsFlexible ? null : toKobo(form.budgetMax),
          budgetIsFlexible: form.budgetIsFlexible,
          locationPreference: form.location.trim().length === 0 ? null : form.location.trim(),
          mustHaveSkills: toList(form.mustHave),
          niceToHaveSkills: toList(form.niceToHave),
          attachmentLinks: toList(form.links),
        }),
      });

      if (response.status === 401) {
        setStatus(enNG.request.status.signingIn);
        return;
      }

      const body: { data?: { id?: string }; code?: string } = await response.json();
      if (!response.ok) {
        if (body.code === 'RATE_LIMITED') {
          setStatus(enNG.errors.rateLimited);
        } else if (body.code === 'SERVICE_UNAVAILABLE') {
          setStatus(enNG.errors.unavailable);
        } else {
          setStatus(enNG.errors.validation);
        }
        return;
      }

      setReceiptId(body.data?.id ?? '');
      setStatus(enNG.request.status.sentSupport);
    } catch {
      setStatus(enNG.errors.internal);
    } finally {
      setIsSending(false);
    }
  }

  if (status === enNG.request.status.sentSupport) {
    return (
      <section className="request-confirmation" aria-live="polite">
        <h2>{enNG.request.status.sent}</h2>
        <p>{status}</p>
        {receiptId.length > 0 ? (
          <>
            <p className="receipt">{receiptId}</p>
            <Link className="text-link" href={`/requests/${encodeURIComponent(receiptId)}/matches`}>
              {enNG.matches.viewShortlist}
            </Link>
          </>
        ) : null}
      </section>
    );
  }

  return (
    <form className="request-form" onSubmit={handleSubmit}>
      <p className="step-label" aria-live="polite">
        {enNG.request.steps.label.replace('{current}', String(step + 1)).replace('{total}', '3')}
      </p>
      <div className="progress-track" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span className={index <= step ? 'is-active' : undefined} key={index} />
        ))}
      </div>

      {step === 0 ? (
        <fieldset>
          <legend>{enNG.request.fields.category}</legend>
          <label htmlFor="category">{enNG.request.fields.category}</label>
          <select
            id="category"
            value={form.category}
            onChange={(event) => update('category', event.target.value as RequestCategory)}
          >
            {REQUEST_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {enNG.request.categories[category]}
              </option>
            ))}
          </select>

          <label htmlFor="brief">{enNG.request.fields.brief}</label>
          <p className="field-hint" id="brief-hint">
            {enNG.request.fields.briefHint}
          </p>
          <textarea
            id="brief"
            aria-describedby="brief-hint"
            required
            minLength={20}
            maxLength={2000}
            rows={5}
            value={form.brief}
            onChange={(event) => update('brief', event.target.value)}
          />
        </fieldset>
      ) : null}

      {step === 1 ? (
        <fieldset>
          <legend>{enNG.request.fields.scope}</legend>
          <label htmlFor="scope">{enNG.request.fields.scope}</label>
          <select
            id="scope"
            value={form.scopeType}
            onChange={(event) => update('scopeType', event.target.value as RequestScopeType)}
          >
            {REQUEST_SCOPE_TYPES.map((scope) => (
              <option key={scope} value={scope}>
                {enNG.request.scopes[scope]}
              </option>
            ))}
          </select>

          <label htmlFor="timeline">{enNG.request.fields.timeline}</label>
          <p className="field-hint" id="timeline-hint">
            {enNG.request.fields.timelineHint}
          </p>
          <input
            id="timeline"
            aria-describedby="timeline-hint"
            required
            maxLength={120}
            value={form.timeline}
            onChange={(event) => update('timeline', event.target.value)}
          />

          <fieldset className="nested-fieldset">
            <legend>{enNG.request.fields.budget}</legend>
            <label className="checkbox-label" htmlFor="budget-flexible">
              <input
                id="budget-flexible"
                type="checkbox"
                checked={form.budgetIsFlexible}
                onChange={(event) => update('budgetIsFlexible', event.target.checked)}
              />
              {enNG.request.fields.budgetFlexible}
            </label>
            {!form.budgetIsFlexible ? (
              <div className="budget-range">
                <label htmlFor="budget-min">{enNG.request.fields.budgetMin}</label>
                <input
                  id="budget-min"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  value={form.budgetMin}
                  onChange={(event) => update('budgetMin', event.target.value)}
                />
                <label htmlFor="budget-max">{enNG.request.fields.budgetMax}</label>
                <input
                  id="budget-max"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  value={form.budgetMax}
                  onChange={(event) => update('budgetMax', event.target.value)}
                />
              </div>
            ) : null}
          </fieldset>
        </fieldset>
      ) : null}

      {step === 2 ? (
        <fieldset>
          <legend>{enNG.request.fields.mustHave}</legend>
          <label htmlFor="location">{enNG.request.fields.location}</label>
          <input
            id="location"
            maxLength={120}
            value={form.location}
            onChange={(event) => update('location', event.target.value)}
          />

          <label htmlFor="must-have">{enNG.request.fields.mustHave}</label>
          <p className="field-hint" id="skills-hint">
            {enNG.request.fields.skillsHint}
          </p>
          <input
            id="must-have"
            aria-describedby="skills-hint"
            required
            value={form.mustHave}
            onChange={(event) => update('mustHave', event.target.value)}
          />

          <label htmlFor="nice-to-have">{enNG.request.fields.niceToHave}</label>
          <input
            id="nice-to-have"
            value={form.niceToHave}
            onChange={(event) => update('niceToHave', event.target.value)}
          />

          <label htmlFor="links">{enNG.request.fields.links}</label>
          <p className="field-hint" id="links-hint">
            {enNG.request.fields.linksHint}
          </p>
          <input
            id="links"
            aria-describedby="links-hint"
            value={form.links}
            onChange={(event) => update('links', event.target.value)}
          />
        </fieldset>
      ) : null}

      <p className="form-status" role="status" aria-live="polite">
        {status}
      </p>

      <div className="form-actions">
        {step > 0 ? (
          <button type="button" className="secondary-button" onClick={() => setStep(step - 1)}>
            {enNG.request.steps.back}
          </button>
        ) : null}
        {step < 2 ? (
          <button type="button" className="primary-button" onClick={() => setStep(step + 1)}>
            {enNG.request.steps.next}
          </button>
        ) : (
          <button type="submit" className="primary-button" disabled={isSending}>
            {isSending ? enNG.request.status.busy : enNG.request.steps.submit}
          </button>
        )}
      </div>
    </form>
  );
}
