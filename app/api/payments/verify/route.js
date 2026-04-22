import { ok, error, withErrorHandler } from '@/lib/utils';
import { parseBody, validatePaymentVerification } from '@/lib/validations';
import { requireUser } from '@/lib/getCurrentUser';
import { verifyPayment } from '@/lib/services/payment.service';

/**
 * POST /api/payments/verify
 * Protected — verifies Razorpay payment signature and activates the benefit.
 *
 * Body: {
 *   razorpayOrderId:   string,
 *   razorpayPaymentId: string,
 *   razorpaySignature: string,
 * }
 */
export const POST = withErrorHandler(async (req) => {
  await requireUser({ includeProfile: false });

  const body = await parseBody(req);
  if (!body) return error('Request body is required.', 400);

  const validation = validatePaymentVerification(body);
  if (!validation.valid) return error('Validation failed.', 422, { errors: validation.errors });

  const payment = await verifyPayment({
    razorpayOrderId:   body.razorpayOrderId,
    razorpayPaymentId: body.razorpayPaymentId,
    razorpaySignature: body.razorpaySignature,
  });

  return ok({ verified: true, payment });
});
