import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { HttpServiceService } from './http-service.service';
import { ToastrService } from 'ngx-toastr';

export interface CartOptions {
  size?: string | null;
  colour?: string | null;
  quantity?: number;
}

export interface NormalizedCartItem {
  cartItemId?: string;
  _id?: string;
  productId: string;
  prodID: string;
  product_id?: any;
  product?: any;
  name: string;
  selling_price: number;
  listing_price?: number;
  imagesPath: string[];
  size?: string | null;
  colour?: string | null;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class WishlistAndCartService {
  private busy = new Set<string>();
  private readonly GUEST_CART_KEY = 'guest-cart';
  private merging = false;

  private readonly _cartItems$ = new BehaviorSubject<NormalizedCartItem[]>([]);
  readonly cartItems$ = this._cartItems$.asObservable();

  private readonly _wishlistIds$ = new BehaviorSubject<string[]>([]);
  readonly wishlistIds$ = this._wishlistIds$.asObservable();

  private readonly _loading$ = new BehaviorSubject<boolean>(false);
  readonly loading$ = this._loading$.asObservable();

  wishlistIds: string[] = [];
  cartItems: NormalizedCartItem[] = [];

  constructor(
    private apiurl: HttpServiceService,
    private toast: ToastrService
  ) {
    this.sync();
  }

  get isLoggedIn(): boolean {
    return this.apiurl.isLoggedIn();
  }

  get loading(): boolean {
    return this._loading$.value;
  }

  get cartCount(): number {
    if (!Array.isArray(this.cartItems)) return 0;
    return this.cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
  }

  get wishlistCount(): number {
    return this.wishlistIds.length;
  }

  sync(): void {
    if (this.isLoggedIn) {
      this.loadWishlist();
      this.mergeGuestCart();
    } else {
      this.clear();
    }
  }

  onUserLogin(): void {
    this.loadWishlist();
    this.mergeGuestCart();
  }

  onUserLogout(): void {
    this.clear();
  }

  clear(): void {
    this.wishlistIds = [];
    this._wishlistIds$.next([]);
    this.cartItems = this.normalizeItems(this.loadGuestCart());
    this._cartItems$.next(this.cartItems);
    this.busy.clear();
  }

  /* ---------------------------- helpers ---------------------------- */

  private requireLogin(action: string): boolean {
    if (this.isLoggedIn) return true;
    this.toast.error(`Please log in to ${action}.`);
    return false;
  }

  private errorMsg(err: any, fallback: string): string {
    return err?.error?.message || fallback;
  }

  cartItemProductId(item: any): string {
    const ref =
      item?.productId ??
      item?.prodID ??
      item?.productID ??
      item?.product_id ??
      item?.product;

    const id =
      ref && typeof ref === 'object'
        ? (ref._id ?? ref.id ?? ref.productID ?? ref.prodID)
        : ref;

    return String(id ?? item?._id ?? item?.id ?? '');
  }

  private sameVariant(item: any, options: CartOptions): boolean {
    const matches = (actual: any, wanted?: string | null) =>
      wanted === undefined || wanted === null || String(actual ?? '') === String(wanted);
    return matches(item?.size, options.size) && matches(item?.colour, options.colour);
  }

  normalizeItems(rawList: any[]): NormalizedCartItem[] {
    if (!Array.isArray(rawList)) return [];

    return rawList
      .map((item) => {
        const prodObj =
          item?.product_id && typeof item.product_id === 'object'
            ? item.product_id
            : item?.product && typeof item.product === 'object'
            ? item.product
            : item;

        const prodId = this.cartItemProductId(item);
        if (!prodId) return null;

        const imagesRaw = prodObj?.imagesPath ?? item?.imagesPath;
        const imagesPath: string[] = Array.isArray(imagesRaw)
          ? imagesRaw
          : typeof imagesRaw === 'string' && imagesRaw.length > 0
          ? [imagesRaw]
          : [];

        const sellingPrice = Number(
          prodObj?.selling_price ??
          item?.selling_price ??
          prodObj?.listing_price ??
          item?.listing_price ??
          0
        );

        const listingPrice = Number(
          prodObj?.listing_price ??
          item?.listing_price ??
          sellingPrice
        );

        const normalized: NormalizedCartItem = {
          cartItemId: item?._id ? String(item._id) : undefined,
          _id: item?._id ? String(item._id) : prodId,
          productId: prodId,
          prodID: prodId,
          product_id: prodObj,
          product: prodObj,
          name: prodObj?.name ?? item?.name ?? 'Product',
          selling_price: Number.isFinite(sellingPrice) ? sellingPrice : 0,
          listing_price: Number.isFinite(listingPrice) ? listingPrice : 0,
          imagesPath,
          size: item?.size ?? null,
          colour: item?.colour ?? null,
          quantity: Math.max(1, parseInt(item?.quantity, 10) || 1),
        };

        return normalized;
      })
      .filter((i): i is NormalizedCartItem => i !== null);
  }

  private extractCartItems(res: any): any[] | null {
    if (Array.isArray(res)) return res;
    const candidates: any[] = [
      res?.items,
      res?.cart?.items,
      res?.cart?.products,
      res?.products,
      res?.data?.items,
      res?.data?.cart?.items,
      res?.data,
    ];
    return candidates.find((c) => Array.isArray(c)) ?? null;
  }

  /* ------------------------- guest cart (local) ------------------------- */

  private loadGuestCart(): any[] {
    try {
      const raw = localStorage.getItem(this.GUEST_CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveGuestCart(items: any[]): void {
    try {
      if (items.length) {
        localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(items));
      } else {
        localStorage.removeItem(this.GUEST_CART_KEY);
      }
    } catch {
      /* in-memory cart still works if storage blocked */
    }
    this.cartItems = this.normalizeItems(items);
    this._cartItems$.next(this.cartItems);
  }

  /* ---------------------- guest cart merge on login ---------------------- */

  mergeGuestCart(): void {
    if (this.merging) return;

    const guestItems = this.loadGuestCart();
    if (!guestItems.length) {
      this.loadCart();
      return;
    }

    this.merging = true;
    this._loading$.next(true);

    // Call backend batch merge endpoint
    this.apiurl
      .post('users/cart/merge', { items: guestItems })
      .pipe(
        finalize(() => {
          this.merging = false;
          this._loading$.next(false);
        })
      )
      .subscribe({
        next: (res: any) => {
          localStorage.removeItem(this.GUEST_CART_KEY);
          const rawItems = this.extractCartItems(res) || [];
          this.cartItems = this.normalizeItems(rawItems);
          this._cartItems$.next(this.cartItems);
          this.toast.success('Your cart items have been saved to your account!');
        },
        error: () => {
          // Fallback: merge items one by one if merge route not available
          forkJoin(
            guestItems.map((item) =>
              this.apiurl
                .post('users/cart', {
                  prodID: this.cartItemProductId(item),
                  size: item.size ?? null,
                  colour: item.colour ?? null,
                  quantity: item.quantity ?? 1,
                })
                .pipe(
                  map(() => null),
                  catchError(() => of(item))
                )
            )
          ).subscribe({
            next: (results: any[]) => {
              const failed = results.filter((r) => r !== null);
              this.saveGuestCart(failed);
              this.loadCart();
            },
            error: () => this.loadCart(),
          });
        },
      });
  }

  /* ---------------------------- wishlist ---------------------------- */

  loadWishlist(): Observable<any> {
    const obs$ = this.apiurl.get('users/wishlist');
    obs$.subscribe({
      next: (res: any) => {
        const rawList = res?.wishlist || res?.items || (Array.isArray(res) ? res : []);
        this.wishlistIds = rawList
          .map((item: any) => {
            const ref = item?.product_id ?? item?.prodID ?? item?.productId ?? item;
            return String(ref && typeof ref === 'object' ? (ref._id ?? ref.id) : ref);
          })
          .filter(Boolean);
        this._wishlistIds$.next(this.wishlistIds);
      },
      error: (err) => console.error('[wishlist] Failed to load wishlist:', err),
    });
    return obs$;
  }

  checkwishlist(productwishID: string): boolean {
    const id = String(productwishID ?? '');
    return this.wishlistIds.includes(id);
  }

  toggleWishlist(product: any): void {
    if (!this.requireLogin('add items to your wish list')) return;

    const productId =
      typeof product === 'string'
        ? product
        : String(product?.id ?? product?._id ?? product?.productID ?? product?.prodID ?? '');

    if (!productId) {
      this.toast.error('Product ID not found');
      return;
    }

    const key = 'w' + productId;
    if (this.busy.has(key)) return;

    this.busy.add(key);
    const isAlreadyInWishlist = this.checkwishlist(productId);

    // Optimistic UI update
    if (isAlreadyInWishlist) {
      this.wishlistIds = this.wishlistIds.filter((id) => id !== productId);
    } else {
      this.wishlistIds = [...this.wishlistIds, productId];
    }
    this._wishlistIds$.next(this.wishlistIds);

    const apiCall$ = isAlreadyInWishlist
      ? this.apiurl.delete('users/wishlist', productId)
      : this.apiurl.post('users/wishlist', { prodID: productId });

    apiCall$
      .pipe(finalize(() => this.busy.delete(key)))
      .subscribe({
        next: () => {
          const msg = isAlreadyInWishlist ? 'Removed from your wish list' : 'Added to your wish list';
          this.toast.success(msg);
        },
        error: (err: any) => {
          // Rollback on error
          if (isAlreadyInWishlist) {
            this.wishlistIds = [...this.wishlistIds, productId];
          } else {
            this.wishlistIds = this.wishlistIds.filter((x) => x !== productId);
          }
          this._wishlistIds$.next(this.wishlistIds);
          this.toast.error(this.errorMsg(err, 'Could not update your wish list'));
        },
      });
  }

  /* ------------------------------ cart ------------------------------ */

  loadCart(): void {
    if (!this.isLoggedIn) {
      this.cartItems = this.normalizeItems(this.loadGuestCart());
      this._cartItems$.next(this.cartItems);
      return;
    }

    this._loading$.next(true);
    this.apiurl
      .get('users/cart')
      .pipe(finalize(() => this._loading$.next(false)))
      .subscribe({
        next: (res: any) => {
          const items = this.extractCartItems(res);
          if (items !== null) {
            this.cartItems = this.normalizeItems(items);
            this._cartItems$.next(this.cartItems);
          }
        },
        error: (err: any) => {
          console.error('[cart] Failed to load cart:', err);
        },
      });
  }

  checkCart(productId: string, options: CartOptions = {}): boolean {
    if (!Array.isArray(this.cartItems)) return false;
    const id = String(productId);
    return this.cartItems.some(
      (item) => this.cartItemProductId(item) === id && this.sameVariant(item, options)
    );
  }

  /**
   * Explicitly add an item to the bag (used on single-product page or when adding with options)
   */
  addToBag(product: any, options: CartOptions = {}): void {
    const productId =
      typeof product === 'string'
        ? product
        : String(product?.id ?? product?._id ?? product?.productID ?? product?.prodID ?? '');

    if (!productId) {
      this.toast.error('Product ID not found');
      return;
    }

    const qty = Math.max(1, options.quantity || 1);

    if (!this.isLoggedIn) {
      const items = this.loadGuestCart();
      const existing = items.find(
        (i) =>
          this.cartItemProductId(i) === productId &&
          (options.size ? i.size === options.size : true)
      );

      if (existing) {
        existing.quantity = Math.min((existing.quantity || 1) + qty, 10);
      } else {
        const prodObj = typeof product === 'object' ? product : {};
        const imagesRaw = prodObj?.imagesPath;
        const imagesPath = Array.isArray(imagesRaw)
          ? imagesRaw
          : typeof imagesRaw === 'string'
          ? [imagesRaw]
          : [];

        items.push({
          productId,
          prodID: productId,
          name: prodObj.name || 'Product',
          selling_price: Number(prodObj.selling_price || prodObj.listing_price || 0),
          listing_price: Number(prodObj.listing_price || 0),
          imagesPath,
          size: options.size || null,
          colour: options.colour || null,
          quantity: qty,
        });
      }

      this.saveGuestCart(items);
      this.toast.success('Added to your bag');
      return;
    }

    // Logged in:
    this.apiurl
      .post('users/cart', {
        prodID: productId,
        size: options.size ?? null,
        colour: options.colour ?? null,
        quantity: qty,
      })
      .subscribe({
        next: () => {
          this.loadCart();
          this.toast.success('Added to your bag');
        },
        error: (err: any) => {
          this.toast.error(this.errorMsg(err, 'Could not add to your bag'));
        },
      });
  }

  /**
   * Toggle item in cart (used by Quick Add buttons on product cards)
   */
  toggleCartlist(product: any, options: CartOptions = {}): void {
    const productId =
      typeof product === 'string'
        ? product
        : String(product?.id ?? product?._id ?? product?.productID ?? product?.prodID ?? '');

    if (!productId) {
      this.toast.error('Product ID not found');
      return;
    }

    const isAlreadyInCart = this.checkCart(productId, options);

    if (!this.isLoggedIn) {
      const items = this.loadGuestCart();
      if (isAlreadyInCart && !options.quantity) {
        const filtered = items.filter(
          (item) =>
            !(this.cartItemProductId(item) === productId && this.sameVariant(item, options))
        );
        this.saveGuestCart(filtered);
        this.toast.success('Removed from your bag');
      } else {
        const existing = items.find(
          (i) =>
            this.cartItemProductId(i) === productId && this.sameVariant(i, options)
        );
        if (existing) {
          existing.quantity = Math.min((existing.quantity || 1) + (options.quantity || 1), 10);
        } else {
          const prodObj = typeof product === 'object' ? product : {};
          const imagesRaw = prodObj?.imagesPath;
          const imagesPath = Array.isArray(imagesRaw)
            ? imagesRaw
            : typeof imagesRaw === 'string'
            ? [imagesRaw]
            : [];

          items.push({
            productId,
            prodID: productId,
            name: prodObj.name || 'Product',
            selling_price: Number(prodObj.selling_price || prodObj.listing_price || 0),
            listing_price: Number(prodObj.listing_price || 0),
            imagesPath,
            size: options.size || null,
            colour: options.colour || null,
            quantity: options.quantity || 1,
          });
        }
        this.saveGuestCart(items);
        this.toast.success('Added to your bag. Sign in anytime to sync your cart.');
      }
      return;
    }

    // Logged in:
    const key = 'c' + productId;
    if (this.busy.has(key)) return;
    this.busy.add(key);

    const apiCall$ = isAlreadyInCart && !options.quantity
      ? this.apiurl.delete('users/cart', productId)
      : this.apiurl.post('users/cart', {
          prodID: productId,
          size: options.size ?? null,
          colour: options.colour ?? null,
          quantity: options.quantity ?? 1,
        });

    apiCall$
      .pipe(finalize(() => this.busy.delete(key)))
      .subscribe({
        next: () => {
          this.loadCart();
          const msg = isAlreadyInCart && !options.quantity
            ? 'Removed from your bag'
            : 'Added to your bag';
          this.toast.success(msg);
        },
        error: (err: any) => {
          this.toast.error(
            this.errorMsg(
              err,
              isAlreadyInCart ? 'Could not remove from your bag' : 'Could not add to your bag'
            )
          );
        },
      });
  }

  /**
   * Update quantity of an item
   */
  updateQuantity(item: any, newQty: number): void {
    const qty = Math.max(0, Math.min(newQty, 10));
    const productId = this.cartItemProductId(item);

    if (qty === 0) {
      this.removeItem(item);
      return;
    }

    if (!this.isLoggedIn) {
      const items = this.loadGuestCart();
      const target = items.find(
        (i) =>
          this.cartItemProductId(i) === productId &&
          (item.size ? i.size === item.size : true)
      );
      if (target) {
        target.quantity = qty;
        this.saveGuestCart(items);
      }
      return;
    }

    // Logged in:
    const targetId = item.cartItemId || item._id || productId;
    this.apiurl
      .patch('users/cart', {
        id: targetId,
        quantity: qty,
        size: item.size,
        colour: item.colour,
      })
      .subscribe({
        next: () => this.loadCart(),
        error: () => this.loadCart(),
      });
  }

  /**
   * Remove item from cart (works seamlessly for guest and logged-in user)
   */
  removeItem(item: any): void {
    const productId = this.cartItemProductId(item);
    const targetId = item?.cartItemId || item?._id || productId;

    if (!this.isLoggedIn) {
      let items = this.loadGuestCart();
      items = items.filter(
        (i) =>
          !(this.cartItemProductId(i) === productId && (item?.size ? i.size === item.size : true))
      );
      this.saveGuestCart(items);
      this.toast.success('Item removed from cart');
      return;
    }

    // Logged in:
    this.apiurl.delete('users/cart', targetId).subscribe({
      next: () => {
        this.loadCart();
        this.toast.success('Item removed from cart');
      },
      error: () => {
        // Fallback: try deleting by productId
        if (targetId !== productId) {
          this.apiurl.delete('users/cart', productId).subscribe({
            next: () => {
              this.loadCart();
              this.toast.success('Item removed from cart');
            },
            error: (err: any) => this.toast.error(this.errorMsg(err, 'Could not remove item')),
          });
        } else {
          this.toast.error('Could not remove item');
        }
      },
    });
  }
}
