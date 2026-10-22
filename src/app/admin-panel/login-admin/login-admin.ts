import { Component, OnInit, NgZone } from '@angular/core';
import { HttpServiceService } from '../../services/http-service.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'login-admin',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login-admin.html',
  styleUrl: './login-admin.css',
})
export class LoginAdmin implements OnInit {

  email = '';
  password = '';
  role = '';
  errorMessage: string | null = null;
  isLoading: boolean = false;
  rememberMe = true;
  constructor(
    private apiurl: HttpServiceService, 
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    const links = [
      '../../../assets/admin-new/css/app.min.css',
      '../../../assets/admin-new/css/icons.min.css',
    ];

    links.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }); 
  }



// onLoginSubmit() {
//   // 1. Reset state before API call
//   this.errorMessage = null;
//   this.isLoading = true;

//   const loginData = { 
//     userName: this.email, 
//     password: this.password, 
//     role: this.role 
//   };


//   this.apiurl.post('auth/login', loginData).subscribe({
//     next: (response: any) => {
//       this.isLoading = false;
//       const token = response?.tokens?.access?.token;
      
//       if (token) {
//         localStorage.setItem('authToken', token); 
//         localStorage.setItem('Role', loginData.role); 
//         if (response?.tokens?.refresh?.token) {
//           localStorage.setItem('adminRefreshToken', response.tokens.refresh.token);
//         }

//         // Redirect path fetch aur clear karein
//         const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/admin/dashboard';
//         sessionStorage.removeItem('redirectAfterLogin');

//         // Navigation trigger
//         this.ngZone.run(() => {
//           this.router.navigateByUrl(redirectTo).then(navigated => {
//             if (!navigated) { 
//               console.error('Navigation failed! Path check karein:', redirectTo); 
//             } else { 
//               console.log('Successfully navigated to:', redirectTo);
//             }
//           });
//         });
//       } else {
//         // Backend response structure mismatch
//         this.errorMessage = 'Login failed! Token missing from response.';
//         console.error('Token missing response:', response);
//       }
//     },
//     error: (err: any) => {
//       this.isLoading = false;
//       console.error('Login failed API error:', err);

//       // Backend error response handling
//       if (err.status === 401 || err.status === 400) {
//         this.errorMessage = err.error?.message || 'Invalid email, password, or role selected.';
//       } else if (err.status === 0) {
//         this.errorMessage = 'Network error. Please check your internet connection.';
//       } else {
//         this.errorMessage = 'Something went wrong. Please try again later.';
//       }
//     }
//   });
// }

onLoginSubmit() {
  this.errorMessage = null;
  this.isLoading = true;

  localStorage.removeItem('Role');
  localStorage.removeItem('authToken');

  const loginData = { 
    userName: this.email, 
    password: this.password, 
    role: this.role || 'admin'
  };

  this.apiurl.post('auth/login', loginData).subscribe({
    next: (response: any) => {
      this.isLoading = false;
      const token = response?.tokens?.access?.token;
      
      if (token) {
        localStorage.setItem('authToken', token); 

        if (response?.tokens?.refresh?.token) {
          localStorage.setItem('adminRefreshToken', response.tokens.refresh.token);
        }

        // 1. Live role decode
        const userRole = this.apiurl.getUserRole() || response?.user?.role || loginData.role;
        localStorage.setItem('Role', userRole); 

        // 2. Clear redirect session key first
        const savedRedirect = sessionStorage.getItem('redirectAfterLogin');
        sessionStorage.removeItem('redirectAfterLogin');

        // 3. Fallback path with absolute slash '/'
        const defaultPath = userRole === 'admin' ? '/admin/dashboard' : '/home';
        
        // Ensure admin always goes to admin path unless explicit admin sub-route saved
        let targetUrl = savedRedirect && savedRedirect.startsWith('/admin') 
          ? savedRedirect 
          : defaultPath;

        console.log('Navigating to final target:', targetUrl);

        this.ngZone.run(() => {
          this.router.navigateByUrl(targetUrl).then(navigated => {
            if (!navigated) { 
              console.error('Navigation failed to:', targetUrl); 
            } else { 
              console.log('Successfully navigated to:', targetUrl);
            }
          });
        });
      } else {
        this.errorMessage = 'Login failed! Token missing from response.';
      }
    },
    error: (err: any) => {
      this.isLoading = false;
      if (err.status === 401 || err.status === 400) {
        this.errorMessage = err.error?.message || 'Invalid credentials.';
      } else {
        this.errorMessage = 'Something went wrong. Please try again.';
      }
    }
  });
}


}