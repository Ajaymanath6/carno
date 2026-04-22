/**
 * email.service.js — Transactional email via nodemailer
 *
 * Creates a single shared transporter and exposes typed send-* helpers.
 * If SMTP credentials are not configured, emails are silently skipped in
 * development (logged to console) and throw in production.
 */

import nodemailer from 'nodemailer';

const FROM = process.env.EMAIL_FROM ?? 'mapmyGig <noreply@mapmygig.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// ─── Transporter ──────────────────────────────────────────────────────────────

function createTransporter() {
  if (!process.env.SMTP_HOST) {
    // In development, return null — emails will be logged instead of sent
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Cache transporter — re-creating per request is wasteful
let _transporter = null;
function getTransporter() {
  if (!_transporter) _transporter = createTransporter();
  return _transporter;
}

// ─── Core send ────────────────────────────────────────────────────────────────

/**
 * Send an email.
 * Falls back to console.warn in dev when SMTP is not configured.
 *
 * @param {{ to: string, subject: string, html: string, text?: string }} options
 */
export async function sendEmail({ to, subject, html, text }) {
  const transporter = getTransporter();

  if (!transporter) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[email] Would send to ${to}: "${subject}"`);
      return;
    }
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.');
  }

  try {
    await transporter.sendMail({ from: FROM, to, subject, html, text });
  } catch (err) {
    // Log but don't crash the request — email is non-critical
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err.message);
  }
}

// ─── Email templates ───────────────────────────────────────────────────────────

/**
 * Send a welcome email after onboarding completes.
 *
 * @param {{ email: string, firstName: string, accountType: string }} params
 */
export async function sendWelcomeEmail({ email, firstName, accountType }) {
  const dashboardUrl = `${APP_URL}/dashboard`;
  const isEmployer = accountType === 'Employer';

  await sendEmail({
    to: email,
    subject: 'Welcome to mapmyGig 🎉',
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: auto; padding: 32px;">
        <h1 style="color: #0369a1;">Welcome, ${firstName}!</h1>
        <p>Your mapmyGig account is ready.</p>
        ${
          isEmployer
            ? '<p>Start by posting your first job and connecting with local talent.</p>'
            : '<p>Browse jobs on the map and apply to roles near you.</p>'
        }
        <a href="${dashboardUrl}"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#0369a1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Go to Dashboard
        </a>
        <p style="margin-top:32px;color:#64748b;font-size:13px;">
          — The mapmyGig team
        </p>
      </div>
    `,
    text: `Welcome, ${firstName}! Visit ${dashboardUrl} to get started.`,
  });
}

/**
 * Notify a job seeker that their application was received.
 *
 * @param {{ email: string, firstName: string, jobTitle: string, companyName: string, applicationId: string }} params
 */
export async function sendApplicationReceivedEmail({ email, firstName, jobTitle, companyName, applicationId }) {
  const applicationUrl = `${APP_URL}/applications`;

  await sendEmail({
    to: email,
    subject: `Application received — ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: auto; padding: 32px;">
        <h2 style="color: #0369a1;">Application Received</h2>
        <p>Hi ${firstName},</p>
        <p>
          Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>
          has been received. The recruiter will review it and get back to you.
        </p>
        <a href="${applicationUrl}"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#0369a1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          View Application
        </a>
        <p style="margin-top:32px;color:#64748b;font-size:13px;">— mapmyGig</p>
      </div>
    `,
    text: `Hi ${firstName}, your application for ${jobTitle} at ${companyName} was received. Track it at ${applicationUrl}.`,
  });
}

/**
 * Notify an employer that a new application was submitted for their job.
 *
 * @param {{ email: string, jobTitle: string, applicantName: string, applicationId: string }} params
 */
export async function sendEmployerNotificationEmail({ email, jobTitle, applicantName, applicationId }) {
  const applicationUrl = `${APP_URL}/applications/${applicationId}`;

  await sendEmail({
    to: email,
    subject: `New application for ${jobTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: auto; padding: 32px;">
        <h2 style="color: #0369a1;">New Application</h2>
        <p><strong>${applicantName}</strong> has applied for <strong>${jobTitle}</strong>.</p>
        <a href="${applicationUrl}"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#0369a1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Review Application
        </a>
        <p style="margin-top:32px;color:#64748b;font-size:13px;">— mapmyGig</p>
      </div>
    `,
    text: `${applicantName} applied for ${jobTitle}. Review at ${applicationUrl}.`,
  });
}

/**
 * Notify an applicant that their application status changed.
 *
 * @param {{ email: string, firstName: string, jobTitle: string, newStatus: string }} params
 */
export async function sendApplicationStatusEmail({ email, firstName, jobTitle, newStatus }) {
  const statusMessages = {
    Shortlisted:   'Congratulations! You\'ve been shortlisted.',
    Interviewing:  'Great news — you\'ve been selected for an interview.',
    OfferExtended: '🎉 An offer has been extended to you!',
    Hired:         '🎊 You\'ve been hired! Welcome aboard.',
    Rejected:      'Unfortunately, your application was not selected this time.',
    Withdrawn:     'Your application has been withdrawn.',
  };

  const message = statusMessages[newStatus] ?? `Your application status has been updated to: ${newStatus}.`;

  await sendEmail({
    to: email,
    subject: `Application update — ${jobTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: auto; padding: 32px;">
        <h2 style="color: #0369a1;">Application Update</h2>
        <p>Hi ${firstName},</p>
        <p>${message}</p>
        <p style="color:#64748b;">Job: <strong>${jobTitle}</strong></p>
        <a href="${APP_URL}/applications"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#0369a1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          View Applications
        </a>
        <p style="margin-top:32px;color:#64748b;font-size:13px;">— mapmyGig</p>
      </div>
    `,
    text: `Hi ${firstName}, ${message} Job: ${jobTitle}. View at ${APP_URL}/applications.`,
  });
}
