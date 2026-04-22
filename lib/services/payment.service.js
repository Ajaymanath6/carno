/**
 * payment.service.js — Razorpay integration
 *
 * Handles order creation, payment verification, and persisting payment records.
 * All amounts are in paise (1 INR = 100 paise) as required by Razorpay.
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { RAZORPAY_CURRENCY } from '@/lib/constants';

// ─── Client ───────────────────────────────────────────────────────────────────

function getRazorpayClient() {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set.');
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// ─── Create order ──────────────────────────────────────────────────────────────

/**
 * Create a Razorpay order and persist a pending Payment record.
 *
 * @param {{
 *   userId: string,
 *   amountPaise: number,
 *   purpose: 'Subscription' | 'JobPromotion' | 'CompanyPromotion',
 *   companyId?: string,
 *   jobId?: string,
 *   notes?: Record<string, string>,
 * }} params
 * @returns {{ order: RazorpayOrder, payment: Payment }}
 */
export async function createPaymentOrder({ userId, amountPaise, purpose, companyId, jobId, notes = {} }) {
  const razorpay = getRazorpayClient();

  const order = await razorpay.orders.create({
    amount:   amountPaise,
    currency: RAZORPAY_CURRENCY,
    notes:    { userId, purpose, ...notes },
  });

  const payment = await prisma.payment.create({
    data: {
      userId,
      companyId,
      jobId,
      purpose,
      status:         'Pending',
      amountPaise,
      currency:       RAZORPAY_CURRENCY,
      razorpayOrderId: order.id,
    },
  });

  return { order, payment };
}

// ─── Verify payment ────────────────────────────────────────────────────────────

/**
 * Verify the Razorpay payment signature and mark the Payment as captured.
 *
 * Razorpay sends razorpay_order_id, razorpay_payment_id, and razorpay_signature
 * after a successful checkout. We verify the signature using HMAC-SHA256.
 *
 * @param {{
 *   razorpayOrderId: string,
 *   razorpayPaymentId: string,
 *   razorpaySignature: string,
 * }} params
 * @returns {Payment}
 */
export async function verifyPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new Error('RAZORPAY_KEY_SECRET is not set.');

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    throw { status: 400, message: 'Payment verification failed: invalid signature.' };
  }

  // Update payment record
  const payment = await prisma.payment.update({
    where: { razorpayOrderId },
    data: {
      status:            'Captured',
      razorpayPaymentId,
      razorpaySignature,
    },
  });

  // Apply the benefit of the payment
  await applyPaymentBenefit(payment);

  return payment;
}

// ─── Apply benefit ────────────────────────────────────────────────────────────

/**
 * Post-verification side effects: activate subscription or feature a job/company.
 * @param {Payment} payment
 */
async function applyPaymentBenefit(payment) {
  const featuredUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  switch (payment.purpose) {
    case 'JobPromotion':
      if (payment.jobId) {
        await prisma.job.update({
          where: { id: payment.jobId },
          data: { isFeatured: true, featuredUntil },
        });
      }
      break;

    case 'CompanyPromotion':
      if (payment.companyId) {
        await prisma.company.update({
          where: { id: payment.companyId },
          data: { isFeatured: true, featuredUntil },
        });
      }
      break;

    case 'Subscription':
      await prisma.subscription.create({
        data: {
          userId:    payment.userId,
          companyId: payment.companyId,
          plan:      'Pro',
          status:    'Active',
          startsAt:  new Date(),
          expiresAt: featuredUntil,
        },
      });
      break;
  }
}

// ─── Payment history ──────────────────────────────────────────────────────────

/**
 * Get all payments for a user, ordered newest first.
 */
export async function getPaymentHistory(userId, { page = 1, pageSize = 20 } = {}) {
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        job:     { select: { title: true, slug: true } },
        company: { select: { name: true, slug: true } },
      },
    }),
    prisma.payment.count({ where: { userId } }),
  ]);

  return { payments, total };
}
