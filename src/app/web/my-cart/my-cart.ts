import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpServiceService } from '../../services/http-service.service';
import { RazorpayService } from '../../services/razorpay.service';
import { ToastrService } from 'ngx-toastr';
import { WishlistAndCartService, NormalizedCartItem } from '../../services/wishlist-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './my-cart.html',
  styleUrls: ['./my-cart.css']
})
export class MyCart implements OnInit, OnDestroy {
  cartItems: NormalizedCartItem[] = [];
  imageURL: string;
  loading = false;
  private sub = new Subscription();

  // Checkout state (same names as single-product so the modal markup can be reused as is)
  showCheckout = false;
  isPaying = false;
  errorMsg = '';
  orderSuccess: { id: string; amount: number; paymentId: string } | null = null;
  checkoutForm: FormGroup;

  // Size selection: one choice PER cart line (not one global value)
  selectedSizes: { [lineKey: string]: string } = {};
  sizeError = false; // true after a failed "Proceed to Checkout" so lines without a size show a hint
  private sizesByProduct = new Map<string, string[]>(); // sizes fetched from products/:id
  private sizesRequested = new Set<string>();
  OrderData : any = [];
  constructor(
    public cartWishService: WishlistAndCartService,
    private api: HttpServiceService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private razorpay: RazorpayService
  ) {
    this.imageURL = this.api.imageBaseURL;
    this.checkoutForm = this.razorpay.createAddressForm(this.fb);
  }

  get isLoggedIn(): boolean {
    return this.api.isLoggedIn();
  }

  /** Shorthand for template validation checks. */
  get f() {
    return this.checkoutForm.controls;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showCheckout) this.closeCheckout();
    else if (this.orderSuccess) this.closeSuccess();
  }

  ngOnInit(): void {
    this.sub.add(
      this.cartWishService.cartItems$.subscribe((items) => {
        this.cartItems = items;
        console.log('checking items:', this.cartItems)
        this.loadMissingSizes(items);
        this.cd.detectChanges();
      })
    );

    this.sub.add(
      this.cartWishService.loading$.subscribe((loading) => {
        this.loading = loading;
        this.cd.detectChanges();
      })
    );

    this.cartWishService.loadCart();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  updateQty(item: NormalizedCartItem, delta: number): void {
    if (this.isPaying) return; // cart must not change while a payment is open
    const current = Number(item.quantity) || 1;
    const next = current + delta;
    if (next < 1) {
      this.removeItem(item);
    } else {
      this.cartWishService.updateQuantity(item, next);
    }
  }

  removeItem(item: NormalizedCartItem): void {
    if (this.isPaying) return;
    this.cartWishService.removeItem(item);
  }

  get subtotal(): number {
    return this.cartItems.reduce((acc, item) => {
      const price = Number(item.selling_price) || 0;
      const qty = Number(item.quantity) || 1;
      return acc + (price * qty);
    }, 0);
  }

  // ---------------------------------------------------------------------------
  // Sizes (chosen here in the cart, before paying)
  // ---------------------------------------------------------------------------

  /** Stable key for one cart line. */
  private lineKey(item: NormalizedCartItem): string {
    return `${item.cartItemId || item.productId}|${item.size ?? ''}`;
  }

  /** All sizes this product comes in (from the cart's product data, else fetched once from products/:id). */
  sizeOptions(item: NormalizedCartItem): string[] {
    const fromItem = item.product?.sizes ?? item.product_id?.sizes;
    if (Array.isArray(fromItem) && fromItem.length > 0) return fromItem;
    return this.sizesByProduct.get(item.productId) ?? [];
  }

  /** The size currently picked for this line: what the user clicked, else what the cart already has. */
  chosenSize(item: NormalizedCartItem): string {
    return this.selectedSizes[this.lineKey(item)] ?? item.size ?? '';
  }

  /** True when the product has sizes but none is picked yet. */
  needsSize(item: NormalizedCartItem): boolean {
    return this.sizeOptions(item).length > 0 && !this.chosenSize(item);
  }

  selectSize(item: NormalizedCartItem, size: string): void {
    if (this.isPaying) return;
    this.selectedSizes[this.lineKey(item)] = size;
  }

  /** Some cart responses don't include the product's size list, so fetch it once per product. */
  private loadMissingSizes(items: NormalizedCartItem[]): void {
    items.forEach((item) => {
      if (this.sizeOptions(item).length > 0 || this.sizesRequested.has(item.productId)) return;
      this.sizesRequested.add(item.productId);

      this.api.get(`products/${item.productId}`).subscribe({
        next: (res: any) => {
          const product = res?.data || res;
          if (Array.isArray(product?.sizes) && product.sizes.length > 0) {
            this.sizesByProduct.set(item.productId, product.sizes);
            this.cd.detectChanges();
          }
        },
        error: () => { /* no size list -> treat as a product without sizes */ },
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Checkout -> address -> Razorpay -> verify  (the payment part lives in RazorpayService)
  // ---------------------------------------------------------------------------
  checkout(): void {
    if (!this.isLoggedIn) {
      sessionStorage.setItem('redirectAfterLogin', '/my-cart');
      this.toastr.info('Please sign in to proceed to checkout.');
      this.router.navigate(['/login']);
      return;
    }
    if (this.cartItems.length === 0) { this.toastr.warning('Your bag is empty.');
      return;
    }

    // Every item that comes in sizes must have one selected before we go to payment.
    const missing = this.cartItems.find((item) => this.needsSize(item));
    if (missing) {
      this.sizeError = true;
      this.toastr.error(`Select a size for "${missing.name}" first.`);
      return;
    }
    this.sizeError = false;

    this.checkoutForm.patchValue(this.razorpay.getProfilePrefill());
    this.errorMsg = '';
    this.showCheckout = true;
  }

  closeCheckout(): void {
    if (this.isPaying) return; // don't close mid-payment
    this.showCheckout = false;
    this.errorMsg = '';
  }

  closeSuccess(): void { this.orderSuccess = null;  }

  payNow(): void {
    if (this.checkoutForm.invalid) { this.checkoutForm.markAllAsTouched();
      return;
    }
    this.createOrder();    return;

    // Safety net: the cart may have changed while the modal was open.
    // if (this.cartItems.some((item) => this.needsSize(item))) {
    //   this.errorMsg = 'Select a size for every item in your bag.';
    //   return;
    // }

    // this.errorMsg = '';
    // this.isPaying = true;
    // this.razorpay.startCheckout(
    //   {
    //     items: this.cartItems.map((item) => ({
    //       productId: item.productId,
    //       size: this.chosenSize(item),
    //       quantity: Number(item.quantity) || 1,
    //     })),
    //     shippingAddress: this.checkoutForm.value,
    //     description:
    //       this.cartItems.length === 1
    //         ? this.cartItems[0].name
    //         : `${this.cartItems.length} items from your bag`,
    //   },
    //   {
    //     onSuccess: (order) => {
    //       this.isPaying = false;
    //       this.showCheckout = false;
    //       this.orderSuccess = order;
    //       this.checkoutForm.reset();
    //       this.selectedSizes = {};
    //       this.cartWishService.loadCart(); // refresh the bag (server should clear the paid items)
    //       this.cd.detectChanges();
    //     },
    //     onError: (message) => this.failPayment(message),
    //     onPaymentFailed: (message) => {
    //       this.errorMsg = message;
    //       this.cd.detectChanges();
    //     },
    //     onDismiss: () => {
    //       this.isPaying = false;
    //       this.cd.detectChanges();
    //     },
    //   }
    // );
  }

 private createOrder(): void {
    this.errorMsg = '';
    this.isPaying = true;

    const mockPaymentId = 'pay_test_' + Date.now();

    const payload = {
      items: this.cartItems.map((item) => ({
        productId: item.productId,
        size: this.chosenSize(item),
        quantity: Number(item.quantity) || 1,
      })),
      shippingAddress: this.checkoutForm.value,
      // Manual Razorpay details for local testing
      razorpay_order_id: 'order_test_' + Date.now(),
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: 'dummy_signature_for_local_test',
    };

    this.api.post('orders/create-order', payload).subscribe({
      next: (r: any) => {
        this.isPaying = false;
        this.showCheckout = false;
        this.orderSuccess = {
          id: r?.data?.orderID || r?.data?._id,
          amount: r?.data?.amount ?? this.subtotal,
          paymentId: mockPaymentId,
        };
        this.checkoutForm.reset();
        this.selectedSizes = {};
        this.cartWishService.loadCart();
        this.toastr.success('Test order created!');
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Create order failed:', err);
        this.failPayment(err?.error?.message || 'Order create nahi hua.');
      },
    });
  }

  private failPayment(message: string): void {
    this.isPaying = false;
    this.errorMsg = message;
    this.cd.detectChanges();
  }

  goToProductDetails(id: string | number | undefined): void {
    if (!id) return;
    this.router.navigate(['/product', id]);
  }
}