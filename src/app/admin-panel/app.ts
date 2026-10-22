import { Component, signal, Renderer2, OnInit, Inject  } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarAdmin } from "./includes/sidebar-admin/sidebar-admin";
import { FooterAdmin } from './includes/footer-admin/footer-admin';
import { HeaderAdmin } from './includes/header-admin/header-admin';
import { DashBoardSec } from './dash-board-sec/dash-board-sec';

import { DOCUMENT } from '@angular/common';
@Component({
  standalone: true,
  // imports: [RouterOutlet, DashBoardSec, HeaderAdmin, FooterAdmin, SidebarAdmin],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class adminPanel {
  
  constructor(private renderer: Renderer2, @Inject(DOCUMENT) private document: Document) {}
  ngOnInit() {
    const linkElement = this.document.getElementById('app-style') as HTMLLinkElement;

    if (linkElement) { linkElement.href = 'assets/css/new-style.css'; } 
    else {
      const newLink = this.renderer.createElement('link');
      this.renderer.setAttribute(newLink, 'rel', 'stylesheet');
      this.renderer.setAttribute(newLink, 'href', 'assets/css/new-style.css');
      this.renderer.setAttribute(newLink, 'id', 'app-style');
      this.renderer.appendChild(this.document.head, newLink);
    }
  }
}
