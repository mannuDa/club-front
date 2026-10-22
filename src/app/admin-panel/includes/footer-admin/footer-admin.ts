
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'footer-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer-admin.html',
  styleUrl: './footer-admin.css',
})
export class FooterAdmin {
  currentYear: number = new Date().getFullYear();
}