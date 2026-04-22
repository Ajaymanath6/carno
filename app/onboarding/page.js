'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

// ─── Step constants ───────────────────────────────────────────────────────────
const STEP_ACCOUNT_TYPE = 'account_type';
const STEP_PERSONAL     = 'personal';
const STEP_COMPANY      = 'company';
const STEP_DONE         = 'done';

const STEPS_SEEKER   = [STEP_ACCOUNT_TYPE, STEP_PERSONAL, STEP_DONE];
const STEPS_EMPLOYER = [STEP_ACCOUNT_TYPE, STEP_PERSONAL, STEP_COMPANY, STEP_DONE];

// ─── Initial form state ───────────────────────────────────────────────────────
const INITIAL_PERSONAL = {
  firstName: '',
  lastName: '',
  phone: '',
  city: '',
  state: '',
  pincode: '',
  skills: '',
  jobTitles: '',
  experienceYears: '',
  experienceLevel: 'Mid',
};

const INITIAL_COMPANY = {
  name: '',
  industry: '',
  size: 'Small',
  description: '',
  websiteUrl: '',
  city: '',
  state: '',
  pincode: '',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ steps, currentStep }) {
  const currentIndex = steps.indexOf(currentStep);
  const visibleSteps = steps.filter((s) => s !== STEP_DONE);
  return (
    <div className="flex items-center gap-2 mb-8">
      {visibleSteps.map((step, i) => (
        <div key={step} className="flex items-center gap-2 flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors ${
              i < currentIndex
                ? 'bg-brand-600 text-white'
                : i === currentIndex
                ? 'bg-brand-500 text-white ring-4 ring-brand-100'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {i < currentIndex ? '✓' : i + 1}
          </div>
          {i < visibleSteps.length - 1 && (
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < currentIndex ? 'bg-brand-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function FormField({ label, required, children, error }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent placeholder-gray-400 transition ${className}`}
      {...props}
    />
  );
}

function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white transition ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

// ─── Step: Account Type ───────────────────────────────────────────────────────

function StepAccountType({ accountType, setAccountType, onNext }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome to mapmyGig</h2>
        <p className="text-gray-500 mt-1">How do you plan to use mapmyGig?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            value: 'JobSeeker',
            title: 'Find a Job',
            description: 'Browse job listings on the map and apply to roles near you.',
            icon: '🔍',
          },
          {
            value: 'Employer',
            title: 'Hire Talent',
            description: 'Post jobs and find the right candidates for your team.',
            icon: '🏢',
          },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setAccountType(option.value)}
            className={`p-5 rounded-xl border-2 text-left transition-all ${
              accountType === option.value
                ? 'border-brand-500 bg-brand-50 shadow-sm'
                : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-3xl mb-3">{option.icon}</div>
            <div className="font-semibold text-gray-900">{option.title}</div>
            <div className="text-sm text-gray-500 mt-1">{option.description}</div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!accountType}
        className="w-full py-3 px-6 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Continue
      </button>
    </div>
  );
}

// ─── Step: Personal Details ───────────────────────────────────────────────────

function StepPersonal({ data, onChange, onNext, onBack, accountType, errors }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Your Details</h2>
        <p className="text-gray-500 mt-1">Tell us a little about yourself.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="First Name" required error={errors.firstName}>
          <Input
            placeholder="Arun"
            value={data.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
          />
        </FormField>
        <FormField label="Last Name" error={errors.lastName}>
          <Input
            placeholder="Krishna"
            value={data.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Phone Number" error={errors.phone}>
        <Input
          type="tel"
          placeholder="+91 99999 00000"
          value={data.phone}
          onChange={(e) => onChange('phone', e.target.value)}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="City" required error={errors.city}>
          <Input
            placeholder="Bengaluru"
            value={data.city}
            onChange={(e) => onChange('city', e.target.value)}
          />
        </FormField>
        <FormField label="State" error={errors.state}>
          <Input
            placeholder="Karnataka"
            value={data.state}
            onChange={(e) => onChange('state', e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Pincode" required error={errors.pincode}>
        <Input
          placeholder="560001"
          maxLength={6}
          value={data.pincode}
          onChange={(e) => onChange('pincode', e.target.value)}
        />
      </FormField>

      {/* Job-seeker specific fields */}
      {accountType === 'JobSeeker' && (
        <>
          <FormField
            label="Skills"
            error={errors.skills}
          >
            <Input
              placeholder="React, Node.js, Python (comma separated)"
              value={data.skills}
              onChange={(e) => onChange('skills', e.target.value)}
            />
          </FormField>

          <FormField label="Job Titles you're targeting" error={errors.jobTitles}>
            <Input
              placeholder="Full Stack Developer, Frontend Developer"
              value={data.jobTitles}
              onChange={(e) => onChange('jobTitles', e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Years of Experience" error={errors.experienceYears}>
              <Input
                type="number"
                min="0"
                max="50"
                placeholder="3"
                value={data.experienceYears}
                onChange={(e) => onChange('experienceYears', e.target.value)}
              />
            </FormField>
            <FormField label="Experience Level" error={errors.experienceLevel}>
              <Select
                value={data.experienceLevel}
                onChange={(e) => onChange('experienceLevel', e.target.value)}
              >
                {['Fresher', 'Junior', 'Mid', 'Senior', 'Lead', 'Executive'].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </Select>
            </FormField>
          </div>
        </>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 px-6 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 py-3 px-6 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ─── Step: Company Details ────────────────────────────────────────────────────

function StepCompany({ data, onChange, onNext, onBack, errors }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Your Company</h2>
        <p className="text-gray-500 mt-1">Tell candidates about the place they'll work.</p>
      </div>

      <FormField label="Company Name" required error={errors.name}>
        <Input
          placeholder="TechWave Solutions"
          value={data.name}
          onChange={(e) => onChange('name', e.target.value)}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Industry" error={errors.industry}>
          <Input
            placeholder="Software & Technology"
            value={data.industry}
            onChange={(e) => onChange('industry', e.target.value)}
          />
        </FormField>
        <FormField label="Company Size" error={errors.size}>
          <Select
            value={data.size}
            onChange={(e) => onChange('size', e.target.value)}
          >
            {[
              { value: 'Micro', label: '1–10 employees' },
              { value: 'Small', label: '11–50 employees' },
              { value: 'Medium', label: '51–200 employees' },
              { value: 'Large', label: '201–1,000 employees' },
              { value: 'Enterprise', label: '1,000+ employees' },
            ].map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Description" error={errors.description}>
        <textarea
          rows={3}
          placeholder="Tell candidates what makes your company great..."
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent placeholder-gray-400 resize-none transition"
        />
      </FormField>

      <FormField label="Website" error={errors.websiteUrl}>
        <Input
          type="url"
          placeholder="https://yourcompany.com"
          value={data.websiteUrl}
          onChange={(e) => onChange('websiteUrl', e.target.value)}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="City" required error={errors.city}>
          <Input
            placeholder="Bengaluru"
            value={data.city}
            onChange={(e) => onChange('city', e.target.value)}
          />
        </FormField>
        <FormField label="State" error={errors.state}>
          <Input
            placeholder="Karnataka"
            value={data.state}
            onChange={(e) => onChange('state', e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Pincode" error={errors.pincode}>
        <Input
          placeholder="560001"
          maxLength={6}
          value={data.pincode}
          onChange={(e) => onChange('pincode', e.target.value)}
        />
      </FormField>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 px-6 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 py-3 px-6 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
        >
          Finish Setup
        </button>
      </div>
    </div>
  );
}

// ─── Step: Done ───────────────────────────────────────────────────────────────

function StepDone() {
  return (
    <div className="text-center space-y-4 py-4">
      <div className="text-6xl">🎉</div>
      <h2 className="text-2xl font-bold text-gray-900">You're all set!</h2>
      <p className="text-gray-500">Taking you to your dashboard…</p>
      <div className="flex justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();

  const [accountType, setAccountType] = useState('');
  const [personal, setPersonal] = useState({
    ...INITIAL_PERSONAL,
    firstName: clerkUser?.firstName ?? '',
    lastName: clerkUser?.lastName ?? '',
  });
  const [company, setCompany] = useState(INITIAL_COMPANY);
  const [currentStep, setCurrentStep] = useState(STEP_ACCOUNT_TYPE);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const steps = accountType === 'Employer' ? STEPS_EMPLOYER : STEPS_SEEKER;
  const stepIndex = steps.indexOf(currentStep);

  function changePersonal(field, value) {
    setPersonal((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function changeCompany(field, value) {
    setCompany((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  // ── Validation ──
  function validatePersonal() {
    const errs = {};
    if (!personal.firstName.trim()) errs.firstName = 'First name is required.';
    if (!personal.city.trim()) errs.city = 'City is required.';
    if (!personal.pincode.trim()) errs.pincode = 'Pincode is required.';
    else if (!/^\d{6}$/.test(personal.pincode.trim())) errs.pincode = 'Enter a valid 6-digit pincode.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateCompany() {
    const errs = {};
    if (!company.name.trim()) errs.name = 'Company name is required.';
    if (!company.city.trim()) errs.city = 'Company city is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Navigation ──
  function handleNext() {
    if (currentStep === STEP_ACCOUNT_TYPE) {
      if (!accountType) return;
      setCurrentStep(STEP_PERSONAL);
    } else if (currentStep === STEP_PERSONAL) {
      if (!validatePersonal()) return;
      if (accountType === 'Employer') {
        setCurrentStep(STEP_COMPANY);
      } else {
        handleSubmit();
      }
    } else if (currentStep === STEP_COMPANY) {
      if (!validateCompany()) return;
      handleSubmit();
    }
  }

  function handleBack() {
    const prevStep = steps[stepIndex - 1];
    if (prevStep) setCurrentStep(prevStep);
  }

  // ── Submit ──
  async function handleSubmit() {
    setSubmitting(true);
    setApiError('');

    try {
      const body = {
        accountType,
        personal: {
          ...personal,
          skills: personal.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          jobTitles: personal.jobTitles
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          experienceYears: personal.experienceYears
            ? parseInt(personal.experienceYears, 10)
            : undefined,
        },
        ...(accountType === 'Employer' && { company }),
      };

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error ?? 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      setCurrentStep(STEP_DONE);
      // Brief pause so the user sees the success state before redirect
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch {
      setApiError('Network error. Please check your connection and try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-xl">
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">mG</span>
          </div>
          <span className="font-bold text-lg text-gray-900">mapmyGig</span>
        </div>

        {/* Progress */}
        {currentStep !== STEP_DONE && (
          <ProgressBar steps={steps} currentStep={currentStep} />
        )}

        {/* API error banner */}
        {apiError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {apiError}
          </div>
        )}

        {/* Step content */}
        {currentStep === STEP_ACCOUNT_TYPE && (
          <StepAccountType
            accountType={accountType}
            setAccountType={setAccountType}
            onNext={handleNext}
          />
        )}

        {currentStep === STEP_PERSONAL && (
          <StepPersonal
            data={personal}
            onChange={changePersonal}
            onNext={handleNext}
            onBack={handleBack}
            accountType={accountType}
            errors={errors}
          />
        )}

        {currentStep === STEP_COMPANY && (
          <StepCompany
            data={company}
            onChange={changeCompany}
            onNext={handleNext}
            onBack={handleBack}
            errors={errors}
          />
        )}

        {currentStep === STEP_DONE && <StepDone />}

        {/* Loading overlay on submit */}
        {submitting && currentStep !== STEP_DONE && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-brand-600">
            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            Saving your profile…
          </div>
        )}
      </div>
    </div>
  );
}
