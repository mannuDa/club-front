import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpServiceService } from '../../services/http-service.service';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { OwlCarousel } from '../../services/owl-courosol';
import { RazorpayService } from '../../services/razorpay.service';
import { CartService } from '../../services/cart.service';
import { WishlistAndCartService } from "../../services/wishlist-service";
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'single-product',
  standalone: true,
  imports: [CommonModule, CarouselModule, ReactiveFormsModule],
  templateUrl: './single-product.html',
  styleUrl: './single-product.css',
})
export class SingleProduct implements OnInit {
  activeTab: string = 'description';
  openSection: string = 'description';
  product: any = null;
  productId: string = '';
  imageURL: string = ''; // Base URL for images
  selectedImage: string = '';
  quantity: number = 1;
  isLoading: boolean = true;
  selectedSize: string = '';
  similer: any[] = [];
  similerProducts: any[] = [];

  // Checkout state
  showCheckout = false;
  isPaying = false;
  errorMsg = '';
  orderSuccess: { id: string; amount: number; paymentId: string } | null = null;
  toastMsg = '';
  checkoutForm: FormGroup;
  isLoggedIn: boolean = false;

  private toastTimer: any;

  constructor(
    private route: ActivatedRoute,
    private apiurl: HttpServiceService,
    private cdr: ChangeDetectorRef,
    public cartANDwish: WishlistAndCartService,
    public owl: OwlCarousel,
    private fb: FormBuilder,
    private razorpay: RazorpayService,
    private cart: CartService,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.imageURL = this.apiurl.imageBaseURL;
    this.isLoggedIn = this.apiurl.isLoggedIn();
    this.checkoutForm = this.razorpay.createAddressForm(this.fb);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showCheckout) this.closeCheckout();
    else if (this.orderSuccess) this.closeSuccess();
  }

  /** Shorthand for template validation checks. */
  get f() {
    return this.checkoutForm.controls;
  }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.productId = productId;
      this.fetchProductDetails(productId);
    }
    this.alsoCheck();
  }

  fetchProductDetails(id: string): void {
    this.isLoading = true;
    this.apiurl.get(`products/${id}`).subscribe({
      next: (res: any) => {
        this.product = res.data || res;
        console.log('Fetched product details:', this.product);
        this.similer = [
          this.product.sleeve_type,
          this.product.selling_price,
          this.product.collection,
          this.product.neck_type,
          this.product.category,
        ];

        if (this.product.imagesPath && this.product.imagesPath.length > 0) {
          this.selectedImage = this.product.imagesPath[0];
        }
        if (this.product.sizes && this.product.sizes.length > 0) {
          this.selectedSize = this.product.sizes[0]; // First size auto-select
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => (this.isLoading = false)
    });
  }

  toggleSection(section: string) {
    this.openSection = this.openSection === section ? '' : section;
  }

  alsoCheck(): void {
    if (this.product) {
      this.apiurl.get(`products`).subscribe({
        next: (res: any) => {
          const otherProducts = res.data || res;
          console.log("similar products:", otherProducts);

          this.similerProducts = otherProducts.filter((p: any) => {
            return this.similer.some((sim: any) => {
              return (
                p.sleeve_type === sim || p.selling_price === sim ||
                p.collection === sim || p.neck_type === sim ||
                p.category === sim
              );
            });
          });
          this.cdr.detectChanges();
        }
      });
    }
  }
  // Gallery Image Swap Handler
  setImage(img: string): void {
    this.selectedImage = img;
  }

  // Quantity Handlers
  increaseQty(): void {
    if (this.quantity < 10) this.quantity++;
  }

  decreaseQty(): void {
    if (this.quantity > 1) this.quantity--;
  }

  selectSize(size: string): void {
    this.selectedSize = size;
  }

  // ---------------------------------------------------------------------------
  // Add to bag
  // ---------------------------------------------------------------------------
  addToCart(): void {
    if (!this.hasValidSize()) return;

    this.cartANDwish.addToBag(this.product, {
      size: this.selectedSize,
      quantity: this.quantity,
    });
  }

  checkCartlist(productID: string): boolean {
    return this.cartANDwish.checkCart(productID, { size: this.selectedSize });
  }

  toggleCartlist(product: any): void {
    this.addToCart();
  }

  // ---------------------------------------------------------------------------
  // Buy now -> address -> Razorpay -> verify  (the payment part lives in RazorpayService)
  // ---------------------------------------------------------------------------
  buynow(): void {
    if (!this.apiurl.isLoggedIn()) {
      this.toastr.warning('Please log in to proceed with the purchase.');
      sessionStorage.setItem('redirectAfterLogin', `/SP/${this.productId}`);
      this.router.navigate(['/login']);
      return;
    }

    // Pehle size check kar lein taaki bina size ke checkout open na ho
    if (!this.hasValidSize()) return;

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
        items: [{ productId: this.productId, size: this.selectedSize, quantity: this.quantity }],
        shippingAddress: this.checkoutForm.value,
        description: this.product.name,
      },
      {
        onSuccess: (order) => {
          this.isPaying = false;
          this.showCheckout = false;
          this.orderSuccess = order;
          this.checkoutForm.reset();
          this.cdr.detectChanges();
        },
        onError: (message) => this.failPayment(message),
        onPaymentFailed: (message) => {
          this.errorMsg = message;
          this.cdr.detectChanges();
        },
        onDismiss: () => {
          this.isPaying = false;
          this.cdr.detectChanges();
        },
      }
    );
  }

  private failPayment(message: string): void {
    this.isPaying = false;
    this.errorMsg = message;
    this.cdr.detectChanges();
  }

  private hasValidSize(): boolean {
    if (!this.selectedSize && this.product?.sizes?.length > 0) {
      this.toastr.error('Select a size first');
      return false;
    }
    return true;
  }


  get totalPrice(): number {
    const unitPrice = parseFloat(this.product?.selling_price || this.product?.listing_price || 0);
    return unitPrice * this.quantity;
  }


}
