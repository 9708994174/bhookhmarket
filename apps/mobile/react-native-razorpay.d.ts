declare module 'react-native-razorpay' {
  type RazorpayOptions = {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    order_id: string;
    prefill?: { name?: string; contact?: string; email?: string };
    notes?: Record<string, string>;
    method?: { netbanking?: boolean; card?: boolean; wallet?: boolean; upi?: boolean };
    theme?: { color: string };
  };

  type RazorpayResult = {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  };

  const RazorpayCheckout: {
    open(options: RazorpayOptions): Promise<RazorpayResult>;
  };

  export default RazorpayCheckout;
}