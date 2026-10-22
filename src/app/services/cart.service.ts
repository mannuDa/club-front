import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CheckoutItem } from './razorpay.service';

export interface BagItem extends CheckoutItem {
  name: string;
  image: string;
  unitPrice: number; // display only; the server re-prices at checkout
}

const STORAGE_KEY = 'club-avis-bag';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items$ = new BehaviorSubject<BagItem[]>(this.load());
  readonly items$ = this._items$.asObservable();

  get items(): BagItem[] {
    return this._items$.value;
  }

  get count(): number {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  add(item: BagItem): void {
    const items = [...this.items];
    const existing = items.find((i) => i.productId === item.productId && i.size === item.size);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + item.quantity, 10);
    } else {
      items.push(item);
    }
    this.save(items);
  }

  remove(productId: string, size: string): void {
    this.save(this.items.filter((i) => !(i.productId === productId && i.size === size)));
  }

  clear(): void {
    this.save([]);
  }

  private save(items: BagItem[]): void {
    this._items$.next(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable (private mode / SSR): keep in memory only */
    }
  }

  private load(): BagItem[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }
}
