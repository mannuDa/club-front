import { Component, ViewChild, ChangeDetectorRef, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OwlCarousel } from '../../services/owl-courosol';
import { CarouselModule, CarouselComponent } from 'ngx-owl-carousel-o';
import { HttpServiceService } from '../../services/http-service.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WishlistAndCartService } from '../../services/wishlist-service';
import { ToastrService } from 'ngx-toastr';


export interface BestsellerProduct {
  id: number | string;
  name: string;
  category: 'streetwear' | 'basics' | 'outerwear' | string;
  imagesPath: string;
  fashionType?: string;
  selling_price: string | number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, CarouselModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {

  Math = Math;
  @ViewChild('owlCar', { static: false }) owlCar!: CarouselComponent;
  imageURL: string;
  customOptions: any;
  allProducts: any[] = [];
  activeCategory: string = 'all';
  products: BestsellerProduct[] = [];
  currentSlide = 0;
  slideInterval: any;


  private readonly defaultRating = 4.2;

  constructor(
    private apiurl: HttpServiceService, 
    private cd: ChangeDetectorRef, 
    public cartANDwish: WishlistAndCartService,
    public owl: OwlCarousel, 
    private router: Router,
    private toastr: ToastrService,
    private ngZone: NgZone
  ) {  
    this.imageURL = this.apiurl.imageBaseURL; 
    this.customOptions = this.owl.customOptions; 
  }


  subscribeData = {
    name: '',
    email: ''
  };

  categories = [
    { title: 'Printed Shirts', image: 'assets/web/images/home-shirt.jfif' },
    { title: 'Polo T-Shirts', image: 'assets/web/images/main-page-man.jfif' },
    { title: 'Jackets & Blazers', image: 'assets/web/images/home-jacket.jfif' },
    { title: 'Trousers & Denims', image: 'assets/web/images/home-jeans.jfif' }
  ];

  isMenuOpen = false;


  slides = [
    {
      subTitle: 'NEW COLLECTION',
      title: 'ELEVATE YOUR<br>EVERYDAY STYLE',
      description: 'Premium fabrics. Timeless designs.<br>Crafted for the modern you.',
      image: 'assets/web/images/main-page-man.jfif',
      sealText: 'FREEDOM IN STYLE • CONFIDENCE IN YOU • CLUB AVIS'
    },
    {
      subTitle: 'SUMMER SPECIAL',
      title: 'DISCOVER THE<br>NEW TRENDS',
      description: 'Stay cool and comfortable.<br>Designed for ultimate luxury.',
      image: 'assets/web/images/home-jeans.jfif', // Apni doosri image ka path dein
      sealText: 'SUMMER EDIT • TRENDING NOW • CLUB AVIS'
    },
    {
      subTitle: 'EXCLUSIVE DEALS',
      title: 'CLASSIC VIBES<br>BOLD LOOKS',
      description: 'Make a statement wherever you go.<br>Redefining menswear.',
      image: 'assets/web/images/home-jacket.jfif', // Apni teesri image ka path dein
      sealText: 'TIMELESS CLASSICS • BOLD LOOKS • CLUB AVIS'
    }
  ];

  ngOnInit() {  
    this.getProducts();
    this.startAutoSlide();
    this.getBestsellers();
    
  }
startAutoSlide(): void {
    // NgZone.runOutsideAngular ke bahar run karke, ngZone.run ke andar index update karenge
    this.slideInterval = setInterval(() => {
      this.ngZone.run(() => {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
      });
    }, 4000); // 4 seconds
  }

  getProducts() {
    this.apiurl.get('products').subscribe({
      next: (res: any) => {
        this.allProducts = (res || [])
          .sort((a: any, b: any) => (b.id > a.id ? 1 : -1))
          .slice(0, 6);
        this.cd.detectChanges();
      },
      error: (err) => console.error('Failed to load products', err)
    });
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }
  // Sample Products List
  getBestsellers() {
    this.apiurl.get('products').subscribe({ // Change endpoint if yours is different (e.g., 'products')
      next: (res: any) => {
        this.products = res || [];
        this.cd.detectChanges();
      },
      error: (err) => console.error('Failed to load bestsellers', err)
    });
  }

  filterBestsellers(category: string): void {
    this.activeCategory = category;

  }

get filteredBestsellers(): BestsellerProduct[] {
    if (this.activeCategory === 'all') {
      return this.products.slice(0, 3); // Sirf pehle 8 products dikhayega
    }
    return this.products.filter(item => item.fashionType === this.activeCategory)
      .slice(0, 3); // Filtered items me se bhi sirf pehle 8 dikhayega
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }



  gotoallProducts() {
    this.router.navigate(['products']); 
  }

  goToProductDetails(id: string | number): void {
    if (id) {
      this.router.navigate(['SP', id]); 
    } else {
      console.error('Product ID is missing or undefined!');
    }
  }

  onSubscribe() {
    console.log('Subscribe Data:', this.subscribeData);
  }

  getDiscount(p: any): number {
    const mrp = Number(p?.listing_price);
    const sell = Number(p?.selling_price);
    if (!mrp || !sell || mrp <= sell) return 0;
    return Math.round(((mrp - sell) / mrp) * 100);
  }
  
  // Delegate wishlist actions directly to your injected service
  toggleWishlist(product: any) {
    // this.toastr.error(this.errorMsg(err, 'Could not update your wish list'));
    this.cartANDwish.toggleWishlist(product);
  }

  checkwishlist(productwishID: string): boolean {
    return this.cartANDwish.checkwishlist(productwishID);
  }

  checkCartlist(productID: string): boolean {
    return this.cartANDwish.checkCart(productID);
  }

  toggleCartlist(product: any): void {
    this.cartANDwish.toggleCartlist(product);
  }

  getPrice(p: any): number {
    return Number(p?.selling_price || p?.listing_price) || 0;
  }

  getRating(p: any): number {
    return Number(p?.rating) || this.defaultRating;
  }

  starsFilled(p: any): number {
    return Math.floor(this.getRating(p));
  }
}