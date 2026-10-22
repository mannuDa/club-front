import { Injectable, signal } from '@angular/core';

/**
 * Lets a page override the label of the LAST breadcrumb with dynamic text,
 * e.g. the product name on a product detail page.
 * The label is cleared automatically on every new navigation.
 */
@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  readonly lastLabel = signal<string | null>(null);
}
