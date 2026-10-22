import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarAdmin } from "../../admin-panel/includes/sidebar-admin/sidebar-admin";
import { FooterAdmin } from '../../admin-panel/includes/footer-admin/footer-admin';
import { HeaderAdmin } from '../../admin-panel/includes/header-admin/header-admin';
import { CommonModule } from '@angular/common';
declare var bootstrap: any;
@Component({
  selector: 'app-admin-layout',
  standalone: true,
    imports: [RouterOutlet, HeaderAdmin, 
              FooterAdmin, SidebarAdmin, 
              CommonModule],

  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout implements OnInit, OnDestroy {

  // constructor(private style: StyleService) {}
  
  ngOnInit(): void {
    const links = [
      'assets/admin-new/css/app.min.css',
      'assets/admin-new/css/icons.min.css',
     ];

    links.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }); 




  const scripts = [
      
      '/assets/admin-new/libs/jquery/jquery.min.js',
      '/assets/admin-new/libs/bootstrap/js/bootstrap.bundle.min.js',
      '/assets/admin-new/libs/simplebar/simplebar.min.js',
      '/assets/admin-new/libs/node-waves/waves.min.js',
      '/assets/admin-new/libs/waypoints/lib/jquery.waypoints.min.js',
      '/assets/admin-new/libs/jquery.counterup/jquery.counterup.min.js',
      '/assets/admin-new/libs/feather-icons/feather.min.js',
      '/assets/admin-new/libs/apexcharts/apexcharts.min.js',
      '/assets/admin-new/js/pages/analytics-dashboard.init.js',
      '/assets/admin-new/js/app.js',
      'https://apexcharts.com/samples/assets/stock-prices.js',
      

  ];


  // scripts.forEach(src => {
  //   const script = document.createElement('script');
  //   script.src = src;
  //   script.defer = true;
  //   document.body.appendChild(script);
  // });
  }
    ngOnDestroy() {
    // document.body.classList.remove('nav-md');
  }
}
