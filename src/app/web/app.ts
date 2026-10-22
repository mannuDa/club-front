import { Component, signal } from '@angular/core';
import { HttpServiceService } from '../services/http-service.service';
import { ChangeDetectorRef } from '@angular/core';
import { SlicePipe, CommonModule } from '@angular/common';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ CarouselModule, RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  

  imageURL: string;

  constructor( private apiurl: HttpServiceService, private cdr: ChangeDetectorRef,  ) {this.imageURL = this.apiurl.imageBaseURL;}

  protected readonly title = signal('frontend');
}
