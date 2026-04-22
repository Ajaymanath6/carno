/**
 * onboarding.service.js — Onboarding flow orchestration
 *
 * Called by POST /api/onboarding.
 * Delegates to auth.service for DB writes and Clerk metadata sync,
 * and to email.service for the welcome email.
 */

import {
  getOrProvisionCurrentUser,
  completeJobSeekerOnboarding,
  completeEmployerOnboarding,
  generateCompanySlug,
} from '@/lib/services/auth.service';

import { sendWelcomeEmail } from '@/lib/services/email.service';
import { validatePersonalDetails, validateCompany } from '@/lib/validations';

/**
 * Process the onboarding form submission from the client.
 *
 * @param {{
 *   accountType: 'JobSeeker' | 'Employer',
 *   personal: object,
 *   company?: object,
 * }} payload
 * @returns {Promise<{ user: object, profile: object, company?: object }>}
 */
export async function processOnboarding(payload) {
  const { accountType, personal, company } = payload;

  // Validate common fields
  const personalValidation = validatePersonalDetails(personal);
  if (!personalValidation.valid) {
    throw { status: 422, message: 'Validation failed.', errors: personalValidation.errors };
  }

  if (accountType === 'Employer') {
    const companyValidation = validateCompany({ ...company, slug: company?.slug ?? 'tmp' });
    if (!companyValidation.valid) {
      throw { status: 422, message: 'Validation failed.', errors: companyValidation.errors };
    }
  }

  // Ensure a User row exists (provisions on first call)
  const user = await getOrProvisionCurrentUser();
  if (!user) throw { status: 401, message: 'Not authenticated.' };
  if (user.isOnboarded) throw { status: 409, message: 'Onboarding already completed.' };

  let result;

  if (accountType === 'JobSeeker') {
    result = await completeJobSeekerOnboarding(user.id, user.clerkId, {
      firstName:       personal.firstName?.trim(),
      lastName:        personal.lastName?.trim() || null,
      phone:           personal.phone?.trim() || null,
      city:            personal.city?.trim(),
      state:           personal.state?.trim() || null,
      pincode:         personal.pincode?.trim(),
      skills:          Array.isArray(personal.skills) ? personal.skills : [],
      jobTitles:       Array.isArray(personal.jobTitles) ? personal.jobTitles : [],
      experienceYears: personal.experienceYears ?? null,
      experienceLevel: personal.experienceLevel ?? 'Mid',
    });
  } else if (accountType === 'Employer') {
    const slug = await generateCompanySlug(company.name);

    result = await completeEmployerOnboarding(
      user.id,
      user.clerkId,
      {
        firstName: personal.firstName?.trim(),
        lastName:  personal.lastName?.trim() || null,
        phone:     personal.phone?.trim() || null,
        city:      personal.city?.trim(),
        state:     personal.state?.trim() || null,
        pincode:   personal.pincode?.trim(),
      },
      {
        name:        company.name?.trim(),
        slug,
        description: company.description?.trim() || null,
        industry:    company.industry?.trim() || null,
        size:        company.size ?? 'Small',
        websiteUrl:  company.websiteUrl?.trim() || null,
        city:        company.city?.trim(),
        state:       company.state?.trim() || null,
        pincode:     company.pincode?.trim() || null,
      }
    );
  } else {
    throw { status: 400, message: `Invalid accountType: ${accountType}` };
  }

  // Send welcome email non-blocking — don't let email failure break onboarding
  sendWelcomeEmail({
    email:       user.email,
    firstName:   personal.firstName,
    accountType,
  }).catch(() => {});

  return result;
}
