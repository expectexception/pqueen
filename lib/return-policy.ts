export const RETURN_POLICY_DAYS = 5;
export const RETURN_POLICY_MS = RETURN_POLICY_DAYS * 24 * 60 * 60 * 1000; // 432,000,000 ms (120 hours)

export interface ReturnEligibilityResult {
  isDelivered: boolean;
  isEligible: boolean;
  isExpired: boolean;
  deliveredAt: Date | null;
  returnDeadline: Date | null;
  daysRemaining: number;
  hoursRemaining: number;
  message: string;
}

/**
 * Evaluates whether an order is eligible for a return or size exchange under the strict 5-day policy.
 * Rule:
 * - Order MUST be in 'DELIVERED' status.
 * - Return window expires exactly 5 days (120 hours) from the deliveredAt timestamp.
 * - If deliveredAt is not recorded on an older delivered order, falls back to updatedAt.
 */
export function evaluateReturnEligibility(order: {
  status?: string | null;
  deliveredAt?: Date | string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}): ReturnEligibilityResult {
  const status = (order?.status || "").toUpperCase();
  const isDelivered = status === "DELIVERED";

  if (!isDelivered) {
    if (status === "CANCELLED") {
      return {
        isDelivered: false,
        isEligible: false,
        isExpired: true,
        deliveredAt: null,
        returnDeadline: null,
        daysRemaining: 0,
        hoursRemaining: 0,
        message: "This order has been cancelled and cannot be returned.",
      };
    }

    if (status === "RETURNED") {
      return {
        isDelivered: false,
        isEligible: false,
        isExpired: true,
        deliveredAt: null,
        returnDeadline: null,
        daysRemaining: 0,
        hoursRemaining: 0,
        message: "This order has already been processed for return.",
      };
    }

    return {
      isDelivered: false,
      isEligible: false,
      isExpired: false,
      deliveredAt: null,
      returnDeadline: null,
      daysRemaining: 0,
      hoursRemaining: 0,
      message: "Return option activates immediately upon doorstep delivery.",
    };
  }

  // Calculate delivery date and deadline
  let deliveredDate: Date;
  if (order.deliveredAt) {
    deliveredDate = new Date(order.deliveredAt);
  } else if (order.updatedAt) {
    deliveredDate = new Date(order.updatedAt);
  } else if (order.createdAt) {
    deliveredDate = new Date(order.createdAt);
  } else {
    deliveredDate = new Date();
  }

  const deadline = new Date(deliveredDate.getTime() + RETURN_POLICY_MS);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) {
    const formattedDelivered = deliveredDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return {
      isDelivered: true,
      isEligible: false,
      isExpired: true,
      deliveredAt: deliveredDate,
      returnDeadline: deadline,
      daysRemaining: 0,
      hoursRemaining: 0,
      message: `Return window expired. Order was delivered on ${formattedDelivered}, which exceeds our strict 5-day return policy.`,
    };
  }

  const daysRemaining = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  const hoursRemaining = Math.max(1, Math.ceil(diffMs / (60 * 60 * 1000)));

  return {
    isDelivered: true,
    isEligible: true,
    isExpired: false,
    deliveredAt: deliveredDate,
    returnDeadline: deadline,
    daysRemaining,
    hoursRemaining,
    message: `5-Day Return Window Active: ${daysRemaining} day${daysRemaining > 1 ? "s" : ""} remaining (${hoursRemaining} hours left).`,
  };
}
