import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Header } from '../../web/includes/header/header';
import { Footer } from '../../web/includes/footer/footer';
import { StyleService } from '../../web/includes/style.service';
import { CommonModule } from '@angular/common';
@Component({
  standalone: true,
  selector: 'app-website-layout',
  imports: [RouterModule, Header, Footer, CommonModule],
  templateUrl: './website-layout.html',
})
export class WebsiteLayout implements OnInit { // <-- Added 'implements OnInit'

  constructor(private style: StyleService) {}

  ngOnInit(): void {  }
}