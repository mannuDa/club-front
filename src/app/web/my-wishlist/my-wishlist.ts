import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpServiceService } from '../../services/http-service.service';
import { ToastrService } from 'ngx-toastr';
import { WishlistAndCartService } from '../../services/wishlist-service';

@Component({
  selector: 'app-my-wishlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-wishlist.html',
  styleUrls: ['./my-wishlist.css']
})
export class MyWishlist implements OnInit {
  wishlistItems: any[] = [];
  imageURL: string;
  loading = true;

  constructor(
    private api: HttpServiceService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private toastr: ToastrService,
    public cartWishService: WishlistAndCartService
  ) {
    this.imageURL = this.api.imageBaseURL;
  }

  ngOnInit() {
    this.fetchWishlist();
  }

fetchWishlist() {
  this.loading = true;
  // Direct API call without modifying the shared service method
  this.cartWishService.loadWishlist().subscribe({
    next: (res: any) => {
      this.wishlistItems = res?.wishlist || res?.items || res || [];
      console.log('wishlist count:', this.wishlistItems.length)
      this.loading = false;
      this.cd.detectChanges();
    },
    error: (err) => {
      this.loading = false;
      this.toastr.error('Failed to load wishlist');
      this.cd.detectChanges();
    }
  });
}



  toggleCartlist(product: any) {
    const prodId = product._id || product.id;
    this.cartWishService.toggleCartlist(product);
  }
  toggleWishlist(product: any) {
    const targetId = typeof product === 'string' ? product : (product._id || product.id);
    this.cartWishService.toggleWishlist(product);
    this.wishlistItems = this.wishlistItems.filter(item => (item._id || item.id) !== targetId);
    this.cd.detectChanges();
  }
  goToDetails(id: string) {
    this.router.navigate(['SP', id]);
  }
}