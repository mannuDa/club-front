import { ChangeDetectorRef, Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpServiceService } from '../../../../../src/app/services/http-service.service';

@Component({
  selector: 'header-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header-admin.html',
  styleUrl: './header-admin.css',
})
export class HeaderAdmin implements OnInit {
  userProfile = {
    name: 'Mannu Da',
    role: 'Administrator',
    avatar: ''
  };

  notificationCount = 3;

  constructor(
    private apiurl: HttpServiceService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialization logic for the header
  }

  onLogOutSubmit() {
    this.apiurl.post('auth/logout', {}).subscribe({
      next: (response: any) => {
        console.log('Logout API Success:', response);
        this.clearSessionAndRedirect();
      },
      error: (err) => {
        console.error('Logout API Error (forcing local logout anyway):', err);
        this.clearSessionAndRedirect();
      }
    });
  }

  private clearSessionAndRedirect() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    sessionStorage.clear();

    this.ngZone.run(() => {
      this.router.navigate(['/home']).then(navigated => {
        if (!navigated) {
          console.error('Logout navigation failed!');
        } else {
          console.log('Successfully logged out & redirected to login page');
        }
      });
    });
  }
}