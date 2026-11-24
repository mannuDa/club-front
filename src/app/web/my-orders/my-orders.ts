import { Component } from '@angular/core';
import { HttpServiceService } from '../../services/http-service.service';


@Component({
  selector: 'app-my-orders',
  imports: [],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css',
})
export class MyOrders {
    constructor(
    private apiurl: HttpServiceService,
  ) {  }

  ngOnInit(): void {
    this.MyOrders();
  }

  MyOrders(){
          this.apiurl.get(`orders/get-my-order`).subscribe({
        next: (res: any) => {
          const products = res?.data || res;
          console.log('checking orders:', products);

        },
        error: () => { /* no size list -> treat as a product without sizes */ },
      });
  }
}
