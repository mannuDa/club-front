import { Component, ChangeDetectorRef, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';

import { HttpServiceService } from '../../services/http-service.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';

@Component({
  selector: "admin-orders",
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxSpinnerModule],
  templateUrl: "./admin-orders.html",
  styleUrl: "./admin-orders.css",
})





export class AdminOrdersComponent implements OnInit {
  imageURL: string;
  orders: any[] = [];
  
    constructor(
    private cdr: ChangeDetectorRef,
    private apiurl: HttpServiceService,
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService
  ) { this.imageURL = this.apiurl.imageBaseURL; }

  selectedOrder: any = null;

  ngOnInit(): void {
    this.getOrdersData()
    // Yahan aap apni API call kar sakte hain: this.fetchOrders();
  }

getOrdersData() {
    this.spinner.show();
    this.apiurl.get('orders/admin-orders-data').subscribe(
      (response: any) => {
        this.spinner.hide();
        if (Array.isArray(response)) {
          this.orders = response;
          console.log('Fetched Orders:', this.orders, this.orders.length);
        } 
        // Agar response kisi object ke andar aa raha hai (jaise { orders: [...] })
        else if (response && response.orders) {
          this.orders = response.orders;
          console.log('Fetched w error Orders:', this.orders,  );
        } 
        else {
          console.error('Unexpected response structure:', response);
          this.toastr.error('Failed to fetch orders. Please try again later.', 'Error');
        }
        this.cdr.detectChanges();
      },
      (error: any) => {
        this.spinner.hide();
        console.error('Error fetching orders:', error);
        this.toastr.error('Failed to fetch orders. Please try again later.', 'Error');
      }
    );
  }
  // Order Details dekhne ke liye modal open karne ka function
  viewOrderDetails(order: any) {
    this.selectedOrder = order;
  }

  // Modal close karne ke liye
  closeModal() {
    this.selectedOrder = null;
  }

  // Order status update karne ka action (e.g., Pending -> Shipped)
  updateStatus(orderId: string, newStatus: string) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      console.log(`Order ${orderId} status updated to ${newStatus}`);
      // Yahan backend API call aayegi status save karne ke liye
    }
  }
}


