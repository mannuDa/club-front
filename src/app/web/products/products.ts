import { Component, ChangeDetectorRef, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpServiceService } from '../../services/http-service.service';
import { WishlistAndCartService } from '../../services/wishlist-service';
type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'rating';
type FacetKey = 'sizes' | 'colors' | 'categories' | 'genders' | 'collections' | 'fabrics' | 'gstyle';

interface FilterState {
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  minDiscount: number | null;
  sizes: string[];
  colors: string[];
  categories: string[];
  gstyle: string[];
  genders: string[];
  collections: string[];
  fabrics: string[];
}

interface AppliedFilter {
  id: string;
  label: string;
  swatch?: string;
}

interface PriceRange {
  label: string;
  min: number | null;
  max: number | null;
}

interface PageItem {
  label: string;
  page: number;
  gap: boolean;
}

@Component({  selector: 'products', imports: [CommonModule], templateUrl: './products.html', styleUrls: ['./products.css'],})
export class Products implements OnInit {
  allProducts: any[] = [];
  filteredProducts: any[] = [];
  imageURL: string;
  isLoading = true;
  productwishID: any;
  wishlistIds: string[] = [];


  // Quick view (not wired to a modal yet)
  selectedProduct: any = null;
  isQuickViewOpen = false;

  // ---------- Filter / sort state ----------
  filters: FilterState = this.emptyFilters();
  appliedFilters: AppliedFilter[] = [];
  sortBy: SortKey = 'newest';
  isFilterDrawerOpen = false;

  // ---------- Pagination ----------
  readonly pageSize = 12;
  currentPage = 1;
  pagedProducts: any[] = [];
  pageItems: PageItem[] = [];
  @ViewChild('resultsTop') resultsTop?: ElementRef<HTMLElement>;

  /** Options shown in the sidebar, built from the loaded products. */
  options: Record<FacetKey, string[]> = {
    sizes: [],
    colors: [],
    categories: [],
    genders: [],
    collections: [],
    fabrics: [],
    gstyle: [],
  };
  priceBounds = { min: 0, max: 0 };

  openSections: Record<string, boolean> = {
    price: true,
    sizes: true,
    colors: true,
    categories: true,
    genders: false,
    collections: false,
    fabrics: false,
    rating: true,
    discount: false,
  };

  // Edit these lists to change what the sidebar offers
  readonly priceRanges: PriceRange[] = [
    { label: 'Under ₹1,000', min: null, max: 1000 },
    { label: '₹1,000 – ₹2,000', min: 1000, max: 2000 },
    { label: '₹2,000 – ₹3,000', min: 2000, max: 3000 },
    { label: '₹3,000 & above', min: 3000, max: null },
  ];
  readonly ratingOptions = [4, 3, 2];
  readonly discountOptions = [10, 25, 40];
  readonly sortOptions: { key: SortKey; label: string }[] = [
    { key: 'newest', label: 'Newest First' },
    { key: 'price-asc', label: 'Price: Low to High' },
    { key: 'price-desc', label: 'Price: High to Low' },
    { key: 'rating', label: 'Top Rated' },
  ];
  readonly checkboxFacets: { key: FacetKey; title: string }[] = [
    { key: 'categories', title: 'Category' },
    { key: 'genders', title: 'Gender' },
    { key: 'collections', title: 'Collection' },
    { key: 'fabrics', title: 'Fabric' },
  ];

  /** Rating shown (and filtered on) when a product has none yet. */
  private readonly defaultRating = 4.2;

  private readonly facetKeys: FacetKey[] = [ 'sizes', 'colors', 'categories', 'genders', 'collections', 'fabrics', 'gstyle' ];
  /** Which product field feeds each filter. */
  private readonly facetField: Record<FacetKey, string> = { sizes: 'sizes', colors: 'color', categories: 
    'category', genders: 'gender', collections: 'collection', fabrics: 'cloth_type', gstyle: 'gstyle', };
    
  constructor(
    private apiurl: HttpServiceService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private cartANDwish: WishlistAndCartService,
    private route: ActivatedRoute,
  ) {
    this.imageURL = this.apiurl.imageBaseURL;
  }

ngOnInit(): void {
    // The header's Collections dropdown links to /products?gstyle=Shirt|tshirt|...
    // Keep filters.gstyle in sync with that query param. Other filters are left alone.
    this.route.queryParamMap.subscribe((params) => {
      const raw = params.get('gstyle')?.trim();
      const next = raw ? [raw] : [];

      const same =
        next.length === this.filters.gstyle.length &&
        next.every((v, i) => v === this.filters.gstyle[i]);
      if (same) return;

      this.filters.gstyle = next;
      if (this.allProducts.length) this.applyFilters();
    });

    this.getProducts();
  }

  getProducts(): void {
    this.apiurl.get('products').subscribe({
      next: (res: any) => {
        const list: any[] = Array.isArray(res) ? res : [];
        this.allProducts = list.sort((a: any, b: any) =>
          String(b.id).localeCompare(String(a.id))
        );
        this.buildOptions();
        // filters.gstyle was already set from the URL in ngOnInit
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  goToProductDetails(id: string | number): void {
    if (id) {
      this.router.navigate(['SP', id]);
    } else {
      console.error('Product ID is missing or undefined!');
    }
  }

  // ==========================================================
  // PRODUCT HELPERS (used by template and filters)
  // ==========================================================
  getPrice(p: any): number {
    return Number(p?.selling_price || p?.listing_price) || 0;
  }

  getDiscount(p: any): number {
    const mrp = Number(p?.listing_price);
    const sell = Number(p?.selling_price);
    if (!mrp || !sell || mrp <= sell) return 0;
    return Math.round(((mrp - sell) / mrp) * 100);
  }

  checkwishlist(productwishID: string): boolean {
        return this.cartANDwish.checkwishlist(productwishID);

  }

  toggleWishlist(product: any) {
  this.cartANDwish.toggleWishlist(product);
  }

  toggleCartlist(product: any): void {
    this.cartANDwish.toggleCartlist(product);
  }

  checkCartlist(productID: string): boolean {
    return this.cartANDwish.checkCart(productID);
  }

  getRating(p: any): number {
    return Number(p?.rating) || this.defaultRating;
  }

  starsFilled(p: any): number {
    return Math.floor(this.getRating(p));
  }

  // ==========================================================
  // FILTERS
  // ==========================================================
  private emptyFilters(): FilterState {
    return {
      minPrice: null,
      maxPrice: null,
      minRating: null,
      minDiscount: null,
      sizes: [],
      colors: [],
      categories: [],
      genders: [],
      collections: [],
      fabrics: [],
      gstyle: [],
    };
  }

  private rawValues(p: any, key: FacetKey): string[] {
    const raw = p?.[this.facetField[key]];
    return (Array.isArray(raw) ? raw : [raw])
      .map((v) => String(v ?? '').trim())
      .filter(Boolean);
  }

  private uniqueBy(values: string[]): string[] {
    const seen = new Map<string, string>();
    for (const v of values) {
      const k = v.toLowerCase();
      if (!seen.has(k)) seen.set(k, v);
    }
    return Array.from(seen.values());
  }

  private sortSizes(sizes: string[]): string[] {
    const order = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', '4XL'];
    return [...sizes].sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      const ia = order.indexOf(a.toUpperCase());
      const ib = order.indexOf(b.toUpperCase());
      if (ia !== -1 && ib !== -1) return ia - ib;
      return a.localeCompare(b);
    });
  }

  private buildOptions(): void {
    const collect = (key: FacetKey) =>
      this.uniqueBy(this.allProducts.flatMap((p) => this.rawValues(p, key)));

    this.options = {
      sizes: this.sortSizes(collect('sizes')),
      colors: collect('colors'),
      categories: collect('categories'),
      genders: collect('genders'),
      collections: collect('collections'),
      fabrics: collect('fabrics'),
      gstyle: collect('gstyle'),
    };

    const prices = this.allProducts.map((p) => this.getPrice(p)).filter((n) => n > 0);
    this.priceBounds = prices.length
      ? { min: Math.min(...prices), max: Math.max(...prices) }
      : { min: 0, max: 0 };
  }

  private matches(p: any): boolean {
    const f = this.filters;
    const price = this.getPrice(p);

    if (f.minPrice !== null && price < f.minPrice) return false;
    if (f.maxPrice !== null && price > f.maxPrice) return false;
    if (f.minRating !== null && this.getRating(p) < f.minRating) return false;
    if (f.minDiscount !== null && this.getDiscount(p) < f.minDiscount) return false;

    for (const key of this.facetKeys) {
      const selected = f[key];
      if (!selected.length) continue;
      const have = this.rawValues(p, key).map((v) => this.normalize(key, v));
      if (!selected.some((s) => have.includes(this.normalize(key, s)))) return false;
    }
    return true;
  }

  /**
   * Lower-cases for every facet. For gstyle it also drops spaces/hyphens and a trailing "s",
   * so 'Shirt' / 'shirts', 'tshirt' / 'T-Shirt' and 'trouser' / 'Trousers' all compare equal.
   */
  private normalize(key: FacetKey, value: string): string {
    const v = value.toLowerCase().trim();
    if (key !== 'gstyle') return v;
    return v.replace(/[^a-z0-9]/g, '').replace(/s$/, '');
  }

  applyFilters(): void {
    const list = this.allProducts.filter((p) => this.matches(p));

    switch (this.sortBy) {
      case 'price-asc':
        list.sort((a, b) => this.getPrice(a) - this.getPrice(b));
        break;
      case 'price-desc':
        list.sort((a, b) => this.getPrice(b) - this.getPrice(a));
        break;
      case 'rating':
        list.sort((a, b) => this.getRating(b) - this.getRating(a));
        break;
      // 'newest' keeps the order from the API (already sorted by id)
    }

    this.filteredProducts = list;
    this.currentPage = 1; // any filter or sort change starts again from page 1
    this.updatePage();
    this.rebuildApplied();
  }

  private rebuildApplied(): void {
    const f = this.filters;
    const chips: AppliedFilter[] = [];

    if (f.minPrice !== null || f.maxPrice !== null) {
      const lo = f.minPrice ?? 0;
      chips.push({
        id: 'price',
        label: f.maxPrice === null ? `₹${lo}+` : `₹${lo} – ₹${f.maxPrice}`,
      });
    }

    for (const key of this.facetKeys) {
      for (const value of f[key]) {
        chips.push({
          id: `${key}:${value}`,
          label: this.displayLabel(key, value),
          swatch: key === 'colors' ? value : undefined,
        });
      }
    }

    if (f.minRating !== null) chips.push({ id: 'rating', label: `${f.minRating}★ & above` });
    if (f.minDiscount !== null) chips.push({ id: 'discount', label: `${f.minDiscount}% or more` });

    this.appliedFilters = chips;
  }

  // ---------- Sidebar actions ----------
  toggleFacet(key: FacetKey, value: string): void {
    const list = this.filters[key];
    const i = list.indexOf(value);
    if (i === -1) list.push(value);
    else list.splice(i, 1);
    this.applyFilters();
  }

  isSelected(key: FacetKey, value: string): boolean {
    return this.filters[key].includes(value);
  }

  displayLabel(key: FacetKey, value: string): string {
    if (key === 'categories') {
      const labels: Record<string, string> = { upper: 'Topwear', lower: 'Bottomwear' };
      return labels[value.toLowerCase()] ?? value;
    }
    if (key === 'gstyle') {
      const labels: Record<string, string> = {
        shirt: 'Shirts',
        tshirt: 'T-Shirts',
        jacket: 'Jackets',
        sweater: 'Sweaters',
        trouser: 'Trousers',
      };
      return labels[this.normalize('gstyle', value)] ?? value;
    }
    return value;
  }

  onPriceInput(kind: 'min' | 'max', raw: string): void {
    const n = raw.trim() === '' ? NaN : Number(raw);
    const value = Number.isFinite(n) && n >= 0 ? n : null;

    if (kind === 'min') this.filters.minPrice = value;
    else this.filters.maxPrice = value;

    const { minPrice, maxPrice } = this.filters;
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      this.filters.minPrice = maxPrice;
      this.filters.maxPrice = minPrice;
    }
    this.applyFilters();
  }

  isPriceRange(r: PriceRange): boolean {
    return this.filters.minPrice === r.min && this.filters.maxPrice === r.max;
  }

  setPriceRange(r: PriceRange): void {
    if (this.isPriceRange(r)) {
      this.filters.minPrice = null;
      this.filters.maxPrice = null;
    } else {
      this.filters.minPrice = r.min;
      this.filters.maxPrice = r.max;
    }
    this.applyFilters();
  }

  setMinRating(value: number): void {
    this.filters.minRating = this.filters.minRating === value ? null : value;
    this.applyFilters();
  }

  setMinDiscount(value: number): void {
    this.filters.minDiscount = this.filters.minDiscount === value ? null : value;
    this.applyFilters();
  }

  setSort(key: SortKey): void {
    this.sortBy = key;
    this.applyFilters();
  }

  removeFilter(chip: AppliedFilter): void {
    if (chip.id === 'price') {
      this.filters.minPrice = null;
      this.filters.maxPrice = null;
    } else if (chip.id === 'rating') {
      this.filters.minRating = null;
    } else if (chip.id === 'discount') {
      this.filters.minDiscount = null;
    } else {
      const [key, ...rest] = chip.id.split(':');
      const facet = key as FacetKey;
      const value = rest.join(':');
      this.filters[facet] = this.filters[facet].filter((v) => v !== value);
      if (facet === 'gstyle') this.clearGstyleParam();
    }
    this.applyFilters();
  }

  clearAll(): void {
    this.filters = this.emptyFilters();
    this.clearGstyleParam();
    this.applyFilters();
  }

  /**
   * Drops ?gstyle= from the URL. Without this, removing the chip leaves the old param in the
   * address bar, and clicking the same header link again would not re-apply the filter.
   */
  private clearGstyleParam(): void {
    if (!this.route.snapshot.queryParamMap.has('gstyle')) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { gstyle: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  toggleSection(id: string): void {
    this.openSections[id] = !this.openSections[id];
  }

  // ---------- Pagination ----------
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize));
  }

  get rangeStart(): number {
    return this.filteredProducts.length ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get rangeEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredProducts.length);
  }

  goToPage(page: number): void {
    const target = Math.min(Math.max(1, page), this.totalPages);
    if (target === this.currentPage) return;
    this.currentPage = target;
    this.updatePage();
    this.resultsTop?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private updatePage(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedProducts = this.filteredProducts.slice(start, start + this.pageSize);
    this.buildPageItems();
  }

  /** Builds e.g. 1 … 4 5 6 … 20 (all pages are shown when there are 7 or fewer). */
  private buildPageItems(): void {
    const total = this.totalPages;
    const current = this.currentPage;
    const num = (n: number): PageItem => ({ label: String(n), page: n, gap: false });
    const gap: PageItem = { label: '…', page: 0, gap: true };

    if (total <= 7) {
      this.pageItems = Array.from({ length: total }, (_, i) => num(i + 1));
      return;
    }

    let start = Math.max(2, current - 1);
    let end = Math.min(total - 1, current + 1);
    if (current <= 3) end = 4;
    if (current >= total - 2) start = total - 3;

    const items: PageItem[] = [num(1)];
    if (start > 2) items.push(gap);
    for (let i = start; i <= end; i++) items.push(num(i));
    if (end < total - 1) items.push(gap);
    items.push(num(total));
    this.pageItems = items;
  }

  // ---------- Mobile drawer ----------
  openFilters(): void {
    this.isFilterDrawerOpen = true;
  }

  @HostListener('document:keydown.escape')
  closeFilters(): void {
    this.isFilterDrawerOpen = false;
  }

  // ---------- trackBy ----------
  trackById(_: number, item: AppliedFilter): string {
    return item.id;
  }

  trackByProduct(_: number, p: any): any {
    return p.id;
  }

  trackByIndex(index: number): number {
    return index;
  }

  // ==========================================================
  // CARD ACTIONS
  // ==========================================================
  quickView(product: any): void {
    this.selectedProduct = product;
    this.isQuickViewOpen = true;
  }

  closeQuickView(): void {
    this.isQuickViewOpen = false;
    this.selectedProduct = null;
  }


}
