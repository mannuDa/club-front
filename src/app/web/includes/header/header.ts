import { RouterModule, ActivatedRoute  } from '@angular/router';
import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HttpServiceService } from '../../../services/http-service.service';
import { FormsModule } from '@angular/forms';
import { WishlistAndCartService } from '../../../services/wishlist-service';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']

})
export class Header {
get isLoggedIn(): boolean { return this.apiurl.isLoggedIn(); }
get cartCount() { return this.cartWishService.cartCount };
    constructor(  public apiurl: HttpServiceService, 
                  public cd: ChangeDetectorRef, 
                  private router: Router,
                  private route: ActivatedRoute,
                  public cartWishService: WishlistAndCartService  
               ) {{  this.imageURL = this.apiurl.imageBaseURL; 
                      // this.cartCount = this.cartWishService.cartCount;

                }
              }


  isMenuOpen = false;
  imageURL: string;
  selectedCategory: string | null = null;
  isSearchOpen = false;
  searchQuery = '';
  get wishlistCount(): number { return this.cartWishService.wishlistCount; }
  UsercartCount: number = 0;

  ngOnInit() {
    this.route.queryParams.subscribe(params => { this.selectedCategory = params['gstyle'] || null; });
  }

toggleSearch() {
  this.isSearchOpen = !this.isSearchOpen;
}

searchProducts() {
  const query = this.searchQuery.trim();
  if (!query) {  return;  }
  console.log('Searching:', query);

  // Example:
  // this.router.navigate(['/products'], {
  //   queryParams: { search: query }
  // });
}

  clearSearch() {
    this.searchQuery = '';
  }


  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  openAccount() {
    if (this.isMenuOpen) {
      this.toggleMenu();
    }
    const token = localStorage.getItem('authToken');
    this.router.navigate([token ? '/my-account' : '/login']);
  }
  openWishList() { this.router.navigate(['/wishlist']); }
  openCart() { this.router.navigate(['/my-cart']); }

  logout() {
    if (this.isMenuOpen) { this.toggleMenu(); }
    this.apiurl.tokenFlush();
    this.cartWishService.onUserLogout();
    this.router.navigate(['/login']);
    this.cd.detectChanges();
  }
}