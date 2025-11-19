interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      payment_id?: string;
      order_id?: string;
    };
  };
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  order_id?: string;
  handler?: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

declare class Razorpay {
  constructor(options: RazorpayOptions);
  open(): void;
  close(): void;
  on(
    event: "payment.failed",
    handler: (response: RazorpayFailureResponse) => void
  ): void;
}

declare global {
  interface Window {
    Razorpay?: typeof Razorpay;
  }
}

export {};
