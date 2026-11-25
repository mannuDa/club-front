import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';

import { HttpServiceService } from '../../services/http-service.service';
@Component({
  selector: 'app-my-orders',
  imports: [CommonModule, RouterLink],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css',
})
export class MyOrders implements OnInit {
  orders: any[] = [];
  isLoading = true;
  errorMsg = '';
  imageURL: string;

  constructor(private apiurl: HttpServiceService, private cdr: ChangeDetectorRef,     private router: Router,
) { this.imageURL = this.apiurl.imageBaseURL; }

  ngOnInit(): void {
    this.getMyOrders();
  }

  getMyOrders() {
    this.isLoading = true;
    this.apiurl.get(`orders/get-my-order`).subscribe({
next: (res: any) => {
        const data = res?.data || res;
        this.orders = Array.isArray(data) ? data : [];
        console.log('checking orders:', this.orders);
        this.isLoading = false;
        this.cdr.detectChanges(); // UI force update
      },
      error: (err) => {
        console.error('Error fetching orders:', err);
        this.errorMsg = 'Orders load karne mein dikkat aayi.';
        this.isLoading = false;
        this.cdr.detectChanges(); // UI force update
      },
    });
  }

  gotoproduct(productid: any) {
    console.log('Navigating to product with ID:', productid);
   if (productid) {
      this.router.navigate(['SP', productid]);
    } else {
      console.error('Product ID is missing or undefined!');
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'badge-success';
      case 'cancelled': return 'badge-danger';
      case 'shipped': return 'badge-info';
      default: return 'badge-warning'; // pending
    }
  }
}