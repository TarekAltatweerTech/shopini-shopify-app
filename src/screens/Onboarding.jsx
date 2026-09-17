import { useCallback, useEffect, useMemo, useState } from 'react';

import { ApiError, fetchOnboardingOptions, linkExistingAccount, submitOnboarding } from '../lib/api.js';
import Loading from '../components/Loading.jsx';

const EMPTY = {
  business_name: '',
  contact_first_name: '',
  contact_last_name: '',
  email: '',
  phone_number: '',
  whatsapp_number: '',
  address: '',
  country_id: '',
  state_id: '',
  city_id: '',
  merchant_type_id: '',
  zipcode: '',
};

/**
 * Polaris fires `input` on every keystroke and `change` on commit. Reading
 * `event.target.value` works for both s-text-field and s-select.
 */
const valueOf = (event) => event?.target?.value ?? '';

function Options({ rows = [], placeholder }) {
  return (
    <>
      <s-option value="">{placeholder}</s-option>
      {rows.map((row) => (
        <s-option key={row.id} value={row.id}>
          {row.name}
        </s-option>
      ))}
    </>
  );
}

/**
 * The shop has no Shopini Express account behind it.
 *
 * Two ways out: apply for a new account, or connect one that already exists.
 * Both stay inside the Shopify admin — nothing here navigates away.
 */
export default function Onboarding({ onComplete }) {
  const [mode, setMode] = useState('apply');
  const [options, setOptions] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    fetchOnboardingOptions().then(setOptions).catch(setLoadError);
  }, []);

  if (loadError) {
    return (
      <s-page heading="Connect to Shopini Express">
        <s-section>
          <s-banner tone="warning" heading="Could not load the signup form">
            <s-paragraph>{loadError.message}</s-paragraph>
          </s-banner>
        </s-section>
      </s-page>
    );
  }

  if (!options) return <Loading label="Loading signup form" />;

  return (
    <s-page heading="Connect to Shopini Express">
      <s-section>
        <s-stack direction="inline" gap="base">
          <s-button
            variant={mode === 'apply' ? 'primary' : 'secondary'}
            onClick={() => setMode('apply')}
          >
            Create an account
          </s-button>
          <s-button
            variant={mode === 'link' ? 'primary' : 'secondary'}
            onClick={() => setMode('link')}
          >
            I already have an account
          </s-button>
        </s-stack>
      </s-section>

      {mode === 'apply' ? (
        <ApplyForm options={options} onComplete={onComplete} />
      ) : (
        <LinkForm onComplete={onComplete} />
      )}
    </s-page>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Apply for a new account                            */
/* -------------------------------------------------------------------------- */

function ApplyForm({ options, onComplete }) {
  // Everything Shopify already told us about the shop, so the merchant is not
  // retyping facts we hold. Every prefill key is optional.
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(options.prefill ?? {}) }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = useCallback(
    (field) => (event) => {
      const value = valueOf(event);

      setForm((current) => {
        const next = { ...current, [field]: value };

        // Location is a chain: changing a parent invalidates its children, and
        // the backend rejects a city that does not belong to the chosen state.
        if (field === 'country_id') Object.assign(next, { state_id: '', city_id: '' });
        if (field === 'state_id') Object.assign(next, { city_id: '' });

        return next;
      });

      setErrors((current) => ({ ...current, [field]: undefined }));
    },
    [],
  );

  const states = useMemo(
    () => (options.states ?? []).filter((row) => row.country_id === form.country_id),
    [options.states, form.country_id],
  );

  const cities = useMemo(
    () => (options.cities ?? []).filter((row) => row.state_id === form.state_id),
    [options.cities, form.state_id],
  );

  const submit = async () => {
    setSaving(true);
    setErrors({});
    setFormError(null);

    try {
      const payload = { ...form };
      if (payload.zipcode === '') delete payload.zipcode;

      onComplete(await submitOnboarding(payload));
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setErrors(error.fieldErrors);
        setFormError('Please check the highlighted fields.');
      } else {
        setFormError(error.message ?? 'Could not submit your application.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <s-section heading="Your business">
      <s-stack direction="block" gap="base">
        <s-paragraph tone="subdued">
          Tell us about your business. A Shopini Express representative reviews every application
          before shipments can start.
        </s-paragraph>

        {formError && (
          <s-banner tone="critical" heading="Could not submit">
            <s-paragraph>{formError}</s-paragraph>
          </s-banner>
        )}

        <s-text-field
          label="Business name"
          name="business_name"
          value={form.business_name}
          error={errors.business_name}
          onInput={set('business_name')}
          maxLength={50}
          required
        />

        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap="base">
          <s-text-field
            label="First name"
            name="contact_first_name"
            value={form.contact_first_name}
            error={errors.contact_first_name}
            onInput={set('contact_first_name')}
            maxLength={50}
            required
          />
          <s-text-field
            label="Last name"
            name="contact_last_name"
            value={form.contact_last_name}
            error={errors.contact_last_name}
            onInput={set('contact_last_name')}
            maxLength={50}
            required
          />
        </s-grid>

        <s-email-field
          label="Email"
          name="email"
          value={form.email}
          error={errors.email}
          onInput={set('email')}
          required
        />

        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap="base">
          <s-text-field
            label="Phone number"
            name="phone_number"
            value={form.phone_number}
            error={errors.phone_number}
            details="10 or 11 digits"
            onInput={set('phone_number')}
            required
          />
          <s-text-field
            label="WhatsApp number"
            name="whatsapp_number"
            value={form.whatsapp_number}
            error={errors.whatsapp_number}
            details="10 or 11 digits"
            onInput={set('whatsapp_number')}
            required
          />
        </s-grid>

        <s-select
          label="Business type"
          name="merchant_type_id"
          value={form.merchant_type_id}
          error={errors.merchant_type_id}
          onChange={set('merchant_type_id')}
          required
        >
          <Options rows={options.merchant_types} placeholder="Select a business type" />
        </s-select>

        <s-select
          label="Country"
          name="country_id"
          value={form.country_id}
          error={errors.country_id}
          onChange={set('country_id')}
          required
        >
          <Options rows={options.countries} placeholder="Select a country" />
        </s-select>

        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap="base">
          <s-select
            label="Governorate"
            name="state_id"
            value={form.state_id}
            error={errors.state_id}
            onChange={set('state_id')}
            disabled={!form.country_id}
            required
          >
            <Options rows={states} placeholder="Select a governorate" />
          </s-select>

          <s-select
            label="City"
            name="city_id"
            value={form.city_id}
            error={errors.city_id}
            onChange={set('city_id')}
            disabled={!form.state_id}
            required
          >
            <Options rows={cities} placeholder="Select a city" />
          </s-select>
        </s-grid>

        <s-text-area
          label="Pickup address"
          name="address"
          value={form.address}
          error={errors.address}
          details="Where our drivers collect your packages."
          rows={2}
          maxLength={500}
          onInput={set('address')}
          required
        />

        <s-number-field
          label="Postal code"
          name="zipcode"
          value={String(form.zipcode ?? '')}
          error={errors.zipcode}
          onInput={set('zipcode')}
        />

        <s-button variant="primary" loading={saving || undefined} onClick={submit}>
          Submit application
        </s-button>
      </s-stack>
    </s-section>
  );
}

/* -------------------------------------------------------------------------- */
/*                        Link an existing account                             */
/* -------------------------------------------------------------------------- */

function LinkForm({ onComplete }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    setError(null);

    try {
      onComplete(await linkExistingAccount({ email, password }));
    } catch (e) {
      setError(e.message ?? 'Could not connect your account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <s-section heading="Connect your account">
      <s-stack direction="block" gap="base">
        <s-paragraph tone="subdued">
          Sign in with your Shopini Express credentials to connect this store to your existing
          account.
        </s-paragraph>

        {error && (
          <s-banner tone="critical" heading="Could not connect">
            <s-paragraph>{error}</s-paragraph>
          </s-banner>
        )}

        <s-email-field
          label="Email"
          name="email"
          value={email}
          onInput={(event) => setEmail(valueOf(event))}
          required
        />

        <s-password-field
          label="Password"
          name="password"
          value={password}
          onInput={(event) => setPassword(valueOf(event))}
          required
        />

        <s-button
          variant="primary"
          loading={saving || undefined}
          disabled={!email || !password || undefined}
          onClick={submit}
        >
          Connect account
        </s-button>
      </s-stack>
    </s-section>
  );
}
