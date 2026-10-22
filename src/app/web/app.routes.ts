import { Routes } from '@angular/router';
import { AboutUs } from './about-us/about-us';
import { HomeComponent } from './home/home';
import { Blogs } from './blogs/blogs';
import { ContactUs } from './contact-us/contact-us';
import { LoginComponent } from './login/login.component';
import { MyOrders } from './my-orders/my-orders';
import { Products } from './products/products';
import { MyWishlist } from './my-wishlist/my-wishlist';
import { MyCart } from './my-cart/my-cart';
import { SingleProduct } from './single-product/single-product';
import { PP } from './privacy policies/pp';
import { WishlistCartContainer } from './wish-cart-order/wish-cart-order'


export const WebRoutes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, data: { breadcrumb: 'Home' } },
  { path: 'about-us', component: AboutUs, data: { breadcrumb: 'About Us' } },
  { path: 'blogs', component: Blogs, data: { breadcrumb: 'Blogs' } },
  { path: 'ContactUs', component: ContactUs, data: { breadcrumb: 'Contact Us' } },
  { path: 'login', component: LoginComponent },
  { path: 'my-order', component: MyOrders, data: { breadcrumb: 'My Orders' } },
  { path: 'products', component: Products, data: { breadcrumb: 'Products' } },
  { path: 'wishlist', component: MyWishlist, data: { breadcrumb: 'Wishlist' } },
  { path: 'my-cart', component: MyCart, data: { breadcrumb: 'My Cart' } },
  { path: 'pp', component: PP, data: { breadcrumb: 'Privacy Policy' } },
  { path: 'my-account',  component: WishlistCartContainer,   data: { breadcrumb: 'My Account' } },
  { path: 'SP/:id', component: SingleProduct, 
    data: { 
      breadcrumb: 'Product Details', // Default label (overridden dynamically via API)
      parentUrl: '/products',          // Logical parent route
      parentLabel: 'Products'         // Parent display name
    } 
  }
];