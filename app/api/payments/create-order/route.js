import { created, error, withErrorHandler } from '@/lib/utils';
import { parseBody } from '@/lib/validations';
import { requireUser } from '@/lib/getCurrentUser';
import { createPaymentOrder } from '@/lib/services/payment.service';

const VALID_PURPOSES = ['Subscription', 'JobPromotion', 'CompanyPromotion'];

/**
 * POST /api/payments/create-order
 * Protected — creates a Razorpay order and returns the order details
 * needed by the Razorpay checkout widget on the client.
 *
 * Body: {
 *   purpose:    'Subscription' | 'JobPromotion' | 'CompanyPromotion',
 *   amountPaise: number,   // e.g. 99900 = ₹999
 *   companyId?: string,
 *   jobId?:     string,
 * }
 *
 * Response: { order: RazorpayOrder, payment: { id }, razorpayKeyId }
 */
export const POST = withErrorHandler(async (req) => {
  const user = await requireUser({ includeProfile: false });
  const body = await parseBody(req);

  if (!body) return error('Request body is required.', 400);

  const { purpose, amountPaise, companyId, jobId } = body;

  if (!purpose || !VALID_PURPOSES.includes(purpose)) {
    return error(`purpose must be one of: ${VALID_PURPOSES.join(', ')}.`, 400);
  }

  if (!amountPaise || typeof amountPaise !== 'number' || amountPaise < 100) {
    return error('amountPaise must be a number >= 100 (minimum ₹1).', 400);
  }

  const { order, payment } = await createPaymentOrder({
    userId: user.id,
    amountPaise,
    purpose,
    companyId,
    jobId,
  });

  return created({
    order,
    payment: { id: payment.id },
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  });
});
