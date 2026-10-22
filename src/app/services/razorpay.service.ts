import { Injectable, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { HttpServiceService } from './http-service.service';

declare var Razorpay: any;

export interface CheckoutItem {
  productId: string;
  size: string;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface PlacedOrder {
  id: string;
  amount: number;
  paymentId: string;
}

/** What a page hands over to start a payment. Same shape for Buy Now and Cart. */
export interface CheckoutRequest {
  items: CheckoutItem[];
  shippingAddress: ShippingAddress;
  /** Shown inside the Razorpay window, e.g. product name or "3 items". */
  description: string;
}

/** How a page reacts to what happens. All callbacks already run inside NgZone. */
export interface CheckoutCallbacks {
  /** Payment done AND verified by the server. */
  onSuccess: (order: PlacedOrder) => void;
  /** Flow ended and the Razorpay window is not open: stop the spinner, show the message. */
  onError: (message: string) => void;
  /** Payment attempt failed but the Razorpay window is still open, so the customer can retry there. */
  onPaymentFailed?: (message: string) => void;
  /** Customer closed the Razorpay window without paying. */
  onDismiss?: () => void;
}

@Injectable({ providedIn: 'root' })
export class RazorpayService {
  private scriptPromise?: Promise<boolean>;

  // Change these two to match the routes you set up for createOrderAndPayment and verifyPayment.
  private readonly CREATE_ORDER_URL = 'users/create-order-payment';
  private readonly VERIFY_URL = 'users/payment/verify';

  constructor(private api: HttpServiceService, private zone: NgZone) {}

  // ---------------------------------------------------------------------------
  // Small helpers shared by Buy Now and Cart
  // ---------------------------------------------------------------------------

  /** Same address form for every page that checks out. */
  createAddressForm(fb: FormBuilder): FormGroup {
    return fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      line1: ['', Validators.required],
      line2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }
  
  open(options: any): any {
  return new Razorpay(options);
}
  /** Name / email / phone from the saved profile, to pre-fill the form. */
  getProfilePrefill(): Partial<ShippingAddress> {
    try {
      const raw = localStorage.getItem('user-profile');
      if (!raw) return {};
      const u = JSON.parse(raw);
      return {
        fullName: u.name || u.fullName || '',
        email: u.email || '',
        phone: u.contact || u.phone || '',
      };
    } catch (e) {
      console.error('Error parsing user profile', e);
      return {};
    }
  }

  // ---------------------------------------------------------------------------
  // The payment flow: load script -> create order -> Razorpay window -> verify
  // ---------------------------------------------------------------------------

  async startCheckout(req: CheckoutRequest, cb: CheckoutCallbacks): Promise<void> {
    const loaded = await this.loadScript();
    if (!loaded) {
      cb.onError('Could not load the payment window. Check your connection and try again.');
      return;
    }

    this.createOrder({
      userId: localStorage.getItem('user-id') || '',
      items: req.items,
      shippingAddress: req.shippingAddress,
    }).subscribe({
      next: (order: any) => this.openCheckout(order, req, cb),
      error: (err: any) =>
        cb.onError(err?.error?.message || 'Could not start payment. Please try again.'),
    });
  }

  private openCheckout(order: any, req: CheckoutRequest, cb: CheckoutCallbacks): void {
    const a = req.shippingAddress;

    const rzp = new Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'Club Avis',
      description: req.description,
      order_id: order.razorpayOrderId,
      prefill: { name: a.fullName, email: a.email, contact: a.phone },
      theme: { color: '#111E38' },
      modal: {
        ondismiss: () => this.zone.run(() => cb.onDismiss?.()),
      },
      handler: (response: any) => this.zone.run(() => this.confirmPayment(response, cb)),
    });

    rzp.on('payment.failed', (resp: any) =>
      this.zone.run(() =>
        cb.onPaymentFailed?.(
          resp?.error?.description || 'Payment failed. Please try again or use another method.'
        )
      )
    );

    rzp.open();
  }

  private confirmPayment(response: any, cb: CheckoutCallbacks): void {
    this.verifyPayment({
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    }).subscribe({
      next: (res: any) =>
        cb.onSuccess({
          id: res.order.id,
          amount: res.order.amount,
          paymentId: res.order.paymentId,
        }),
      error: () =>
        cb.onError(
          `Your payment went through, but we could not confirm the order yet. ` +
            `Please don't pay again. Reference: ${response.razorpay_payment_id}`
        ),
    });
  }

  // ---------------------------------------------------------------------------
  // Low level pieces
  // ---------------------------------------------------------------------------

  /** Loads checkout.js once and reuses it. */
  loadScript(): Promise<boolean> {
    if (typeof Razorpay !== 'undefined') return Promise.resolve(true);
    if (!this.scriptPromise) {
      this.scriptPromise = new Promise<boolean>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => {
          this.scriptPromise = undefined; // allow a retry
          resolve(false);
        };
        document.body.appendChild(script);
      });
    }
    return this.scriptPromise;
  }

  createOrder(payload: {
    userId: string;
    items: CheckoutItem[];
    shippingAddress: ShippingAddress;
  }): Observable<any> {
    return this.api.post(this.CREATE_ORDER_URL, payload);
  }

  verifyPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Observable<any> {
    return this.api.post(this.VERIFY_URL, payload);
  }
}
