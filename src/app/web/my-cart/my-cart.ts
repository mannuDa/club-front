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
  // Checkout -> address -> Razorpay -> verify  (the payment part lives in RazorpayService)
  // ---------------------------------------------------------------------------
  checkout(): void {
    if (!this.isLoggedIn) {
      sessionStorage.setItem('redirectAfterLogin', '/my-cart');
      this.toastr.info('Please sign in to proceed to checkout.');
      this.router.navigate(['/login']);
      return;
    }
    alert('checkout clicked');
    if (this.cartItems.length === 0) { 
      this.toastr.warning('Your bag is empty.');
      return;
    }

    this.checkoutForm.patchValue(this.razorpay.getProfilePrefill());
    this.errorMsg = '';
    this.showCheckout = true;
  }

  closeCheckout(): void {
    if (this.isPaying) return; // don't close mid-payment
    this.showCheckout = false;
    this.errorMsg = '';
  }

  closeSuccess(): void {
    this.orderSuccess = null;
  }

  payNow(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.errorMsg = '';
    this.isPaying = true;

    this.razorpay.startCheckout(
      {
        // Adjust productId / size to match your NormalizedCartItem fields.
        items: this.cartItems.map((item) => ({
          productId: item.productId,
          size: item.size ?? '',
          quantity: Number(item.quantity) || 1,
        })),
        shippingAddress: this.checkoutForm.value,
        description:
          this.cartItems.length === 1
            ? this.cartItems[0].name
            : `${this.cartItems.length} items from your bag`,
      },
      {
        onSuccess: (order) => {
          this.isPaying = false;
          this.showCheckout = false;
          this.orderSuccess = order;
          this.checkoutForm.reset();
          this.cartWishService.loadCart(); // refresh the bag (server should clear the paid items)
          this.cd.detectChanges();
        },
        onError: (message) => this.failPayment(message),
        onPaymentFailed: (message) => {
          this.errorMsg = message;
          this.cd.detectChanges();
        },
        onDismiss: () => {
          this.isPaying = false;
          this.cd.detectChanges();
        },
      }
    );
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
