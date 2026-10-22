import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyWishlist } from '../my-wishlist/my-wishlist'; 
import { MyCart } from '../my-cart/my-cart';          
import { MyOrders } from '../my-orders/my-orders'   

@Component({
  selector: 'app-wishlist-cart-container',
  standalone: true,
  imports: [CommonModule, MyWishlist, MyCart, MyOrders], // <-- Yahan dono components ko import karna zaroori hai!
  templateUrl: './wish-cart-order.html',
  styleUrls: ['./wish-cart-order.css']
})
export class WishlistCartContainer {
  activeTab: 'Wishlist' | 'Cart' | 'Order' = 'Wishlist'; 
}