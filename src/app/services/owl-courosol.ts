import { CarouselModule, CarouselComponent, OwlOptions } from 'ngx-owl-carousel-o';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class OwlCarousel {
customOptions: OwlOptions = {
  loop: true,
  mouseDrag: true,
  touchDrag: true,
  pullDrag: true,
  dots: false,
  navSpeed: 500,
  autoWidth: false,
  autoHeight: false,
  responsive: {
    0: { items: 1 },
    600: { items: 4 },
    992: { items: 5 }
  },
  nav: true,
  navText: ['&#x2039;', '&#x203a;'],
  // navText: ['<i class="fa fa-chevron-left"></i>', '<i class="fa fa-chevron-right"></i>']
};
}