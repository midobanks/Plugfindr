'use client';

import {
  asKobo,
  AVAILABILITY_STATUSES,
  ENGAGEMENT_TYPES,
  profileCompleteness,
  RATE_VISIBILITIES,
  SPECIALIST_CATEGORIES,
} from '@plugfindr/domain';
import type {
  AvailabilityStatus,
  EngagementType,
  Kobo,
  RateVisibility,
  SpecialistCategory,
  SpecialistProfileDraft,
} from '@plugfindr/domain';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { enNG } from '../i18n/messages/en-NG';

type FormState = {
  readonly name: string;
  readonly headline: string;
  readonly category: SpecialistCategory | '';
  readonly skillsText: string;
  readonly bio: string;
  readonly yearsExperience: string;
  readonly location: string;
  readonly timeZone: string;
  readonly languagesText: string;
  readonly availability: AvailabilityStatus | '';
  readonly engagementTypes: readonly EngagementType[];
  readonly rateVisibility: RateVisibility;
  readonly rateMin: string;
  readonly rateMax: string;
  readonly hideEmployer: boolean;
};

const initialForm: FormState = {
  name: '',
  headline: '',
  category: '',
  skillsText: '',
  bio: '',
  yearsExperience: '',
  location: '',
  timeZone: 'Africa/Lagos',
  languagesText: '',
  availability: '',
  engagementTypes: [],
  rateVisibility: 'range',
  rateMin: '',
  rateMax: '',
  hideEmployer: true,
};

function toList(value: string): readonly string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toKobo(value: string): Kobo | null {
  if (value.trim().length === 0) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return asKobo(Math.round(amount * 100));
}

function toDraft(form: FormState): SpecialistProfileDraft {
  const years = Number(form.yearsExperience);
  return {
    name: form.name,
    headline: form.headline,
    category: form.category,
    skills: toList(form.skillsText),
    bio: form.bio,
    yearsExperience: form.yearsExperience.trim().length === 0 ? null : years,
    location: form.location,
    timeZone: form.timeZone,
    languages: toList(form.languagesText),
    availability: form.availability,
    engagementTypes: form.engagementTypes,
    rateVisibility: form.rateVisibility,
    rateMinKobo: form.rateVisibility === 'range' ? toKobo(form.rateMin) : null,
    rateMaxKobo: form.rateVisibility === 'range' ? toKobo(form.rateMax) : null,
    hideEmployer: form.hideEmployer,
  };
}

function toggleEngagement(
  current: readonly EngagementType[],
  value: EngagementType,
): readonly EngagementType[] {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

export default function SpecialistProfileForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState('');
  const [isSending, setIsSending] = useState(false);

  const completeness = profileCompleteness(toDraft(form));

  function update<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSending(true);
    setStatus('');

    try {
      const response = await fetch('/v1/specialists/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(toDraft(form)),
      });

      if (response.status === 401) {
        setStatus(enNG.specialist.status.signingIn);
        return;
      }
      if (response.status === 403) {
        setStatus(enNG.errors.forbidden);
        return;
      }

      const body: { code?: string } = await response.json();
      if (!response.ok) {
        if (body.code === 'RATE_LIMITED') setStatus(enNG.errors.rateLimited);
        else if (body.code === 'SERVICE_UNAVAILABLE') setStatus(enNG.errors.unavailable);
        else setStatus(enNG.errors.validation);
        return;
      }

      setStatus(enNG.specialist.status.submittedSupport);
    } catch {
      setStatus(enNG.errors.internal);
    } finally {
      setIsSending(false);
    }
  }

  if (status === enNG.specialist.status.submittedSupport) {
    return (
      <section className="request-confirmation" aria-live="polite">
        <h2>{enNG.specialist.status.submitted}</h2>
        <p>{status}</p>
      </section>
    );
  }

  return (
    <form className="request-form" onSubmit={handleSubmit}>
      <p className="step-label" aria-live="polite">
        {enNG.specialist.steps.label.replace('{current}', String(step + 1)).replace('{total}', '3')}
        {' · '}
        {enNG.specialist.steps.completeness.replace('{value}', String(completeness))}
      </p>
      <div className="progress-track" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span className={index <= step ? 'is-active' : undefined} key={index} />
        ))}
      </div>

      {step === 0 ? (
        <fieldset>
          <legend>{enNG.specialist.fields.name}</legend>
          <label htmlFor="specialist-name">{enNG.specialist.fields.name}</label>
          <input
            id="specialist-name"
            required
            minLength={2}
            maxLength={120}
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
          />

          <label htmlFor="specialist-headline">{enNG.specialist.fields.headline}</label>
          <p className="field-hint" id="headline-hint">
            {enNG.specialist.fields.headlineHint}
          </p>
          <input
            id="specialist-headline"
            aria-describedby="headline-hint"
            required
            minLength={20}
            maxLength={160}
            value={form.headline}
            onChange={(event) => update('headline', event.target.value)}
          />

          <label htmlFor="specialist-category">{enNG.specialist.fields.category}</label>
          <select
            id="specialist-category"
            required
            value={form.category}
            onChange={(event) => update('category', event.target.value as SpecialistCategory)}
          >
            <option value="" disabled>
              {enNG.specialist.fields.category}
            </option>
            {SPECIALIST_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {enNG.request.categories[category]}
              </option>
            ))}
          </select>

          <label htmlFor="specialist-skills">{enNG.specialist.fields.skills}</label>
          <p className="field-hint" id="skills-hint">
            {enNG.specialist.fields.skillsHint}
          </p>
          <input
            id="specialist-skills"
            aria-describedby="skills-hint"
            required
            value={form.skillsText}
            onChange={(event) => update('skillsText', event.target.value)}
          />
        </fieldset>
      ) : null}

      {step === 1 ? (
        <fieldset>
          <legend>{enNG.specialist.fields.bio}</legend>
          <label htmlFor="specialist-bio">{enNG.specialist.fields.bio}</label>
          <p className="field-hint" id="bio-hint">
            {enNG.specialist.fields.bioHint}
          </p>
          <textarea
            id="specialist-bio"
            aria-describedby="bio-hint"
            required
            minLength={80}
            maxLength={1200}
            rows={6}
            value={form.bio}
            onChange={(event) => update('bio', event.target.value)}
          />

          <label htmlFor="specialist-years">{enNG.specialist.fields.yearsExperience}</label>
          <input
            id="specialist-years"
            type="number"
            inputMode="numeric"
            min={0}
            max={50}
            required
            value={form.yearsExperience}
            onChange={(event) => update('yearsExperience', event.target.value)}
          />

          <label htmlFor="specialist-location">{enNG.specialist.fields.location}</label>
          <input
            id="specialist-location"
            required
            maxLength={120}
            value={form.location}
            onChange={(event) => update('location', event.target.value)}
          />

          <label htmlFor="specialist-timezone">{enNG.specialist.fields.timeZone}</label>
          <p className="field-hint" id="timezone-hint">
            {enNG.specialist.fields.timeZoneHint}
          </p>
          <input
            id="specialist-timezone"
            aria-describedby="timezone-hint"
            required
            maxLength={64}
            value={form.timeZone}
            onChange={(event) => update('timeZone', event.target.value)}
          />

          <label htmlFor="specialist-languages">{enNG.specialist.fields.languages}</label>
          <input
            id="specialist-languages"
            required
            value={form.languagesText}
            onChange={(event) => update('languagesText', event.target.value)}
          />
        </fieldset>
      ) : null}

      {step === 2 ? (
        <fieldset>
          <legend>{enNG.specialist.fields.availability}</legend>
          <label htmlFor="specialist-availability">{enNG.specialist.fields.availability}</label>
          <select
            id="specialist-availability"
            required
            value={form.availability}
            onChange={(event) => update('availability', event.target.value as AvailabilityStatus)}
          >
            <option value="" disabled>
              {enNG.specialist.fields.availability}
            </option>
            {AVAILABILITY_STATUSES.map((statusValue) => (
              <option key={statusValue} value={statusValue}>
                {enNG.specialist.availability[statusValue]}
              </option>
            ))}
          </select>

          <fieldset className="nested-fieldset">
            <legend>{enNG.specialist.fields.engagementTypes}</legend>
            {ENGAGEMENT_TYPES.map((type) => (
              <label className="checkbox-label" htmlFor={`engagement-${type}`} key={type}>
                <input
                  id={`engagement-${type}`}
                  type="checkbox"
                  checked={form.engagementTypes.includes(type)}
                  onChange={() =>
                    update('engagementTypes', toggleEngagement(form.engagementTypes, type))
                  }
                />
                {enNG.specialist.engagements[type]}
              </label>
            ))}
          </fieldset>

          <fieldset className="nested-fieldset">
            <legend>{enNG.specialist.fields.rateVisibility}</legend>
            {RATE_VISIBILITIES.map((visibility) => (
              <label className="checkbox-label" htmlFor={`rate-${visibility}`} key={visibility}>
                <input
                  id={`rate-${visibility}`}
                  type="radio"
                  name="rateVisibility"
                  checked={form.rateVisibility === visibility}
                  onChange={() => update('rateVisibility', visibility)}
                />
                {enNG.specialist.rateVisibility[visibility]}
              </label>
            ))}
            {form.rateVisibility === 'range' ? (
              <div className="budget-range">
                <label htmlFor="specialist-rate-min">{enNG.specialist.fields.rateMin}</label>
                <input
                  id="specialist-rate-min"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  value={form.rateMin}
                  onChange={(event) => update('rateMin', event.target.value)}
                />
                <label htmlFor="specialist-rate-max">{enNG.specialist.fields.rateMax}</label>
                <input
                  id="specialist-rate-max"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  value={form.rateMax}
                  onChange={(event) => update('rateMax', event.target.value)}
                />
              </div>
            ) : null}
          </fieldset>

          <label className="checkbox-label" htmlFor="specialist-hide-employer">
            <input
              id="specialist-hide-employer"
              type="checkbox"
              checked={form.hideEmployer}
              onChange={(event) => update('hideEmployer', event.target.checked)}
            />
            {enNG.specialist.fields.hideEmployer}
          </label>
        </fieldset>
      ) : null}

      <p className="form-status" role="status" aria-live="polite">
        {status}
      </p>

      <div className="form-actions">
        {step > 0 ? (
          <button type="button" className="secondary-button" onClick={() => setStep(step - 1)}>
            {enNG.specialist.steps.back}
          </button>
        ) : null}
        {step < 2 ? (
          <button type="button" className="primary-button" onClick={() => setStep(step + 1)}>
            {enNG.specialist.steps.next}
          </button>
        ) : (
          <button type="submit" className="primary-button" disabled={isSending}>
            {isSending ? enNG.specialist.status.busy : enNG.specialist.steps.submit}
          </button>
        )}
      </div>
    </form>
  );
}
