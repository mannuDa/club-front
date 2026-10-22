import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, NgZone } from '@angular/core';
import { HttpServiceService } from '../../services/http-service.service';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { WishlistAndCartService } from '../../services/wishlist-service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  isLoginView: boolean = true;
  errorMessage: string | null = null;
  isLoading: boolean = false;
  rememberMe = true;
  successMessage: string | null = null;
  showLoginPassword = false;
  showRegisterPassword = false;
  showConfirmPassword = false;
  confirmPassword = '';
  email = '';
  password = '';
  role = '';
  loginData = {
    email: '',
    password: '',
    role: 'user'
  };

  registerData = {
    name: '',
    email: '',
    contact: '',
    password: '',
    role: 'user' // NOTE: server must ignore this and force the role itself
  };

  constructor(
    private apiurl: HttpServiceService,
    private router: Router,
    private ngZone: NgZone,
    private toast: ToastService,
    private cartWishService: WishlistAndCartService
  ) {}

  /**
   * Show exactly ONE toast.
   * The old code did `toast.error?.(msg) || toast.show?.(msg)`. error() returns undefined,
   * so `||` always ran show() as well, which drew a second, default-styled (non-red) toast.
   */
  private notify(type: 'success' | 'error', message: string): void {
    const t = this.toast as any;
    if (typeof t[type] === 'function') {
      t[type](message);
    } else if (typeof t.show === 'function') {
      t.show(message, type);
    }
  }

  toggleView(isLogin: boolean): void {
    this.isLoginView = isLogin;
    this.errorMessage = null;
    this.successMessage = null;

    // Hide passwords when switching views
    this.showLoginPassword = false;
    this.showRegisterPassword = false;
    this.showConfirmPassword = false;
  }

  get isPasswordMismatch(): boolean {
    return (
      !!this.confirmPassword &&
      this.registerData.password !== this.confirmPassword
    );
  }

  onRegister(): void {
    if (this.isPasswordMismatch) {
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.isLoading = true;

    const payload = {
      name: this.registerData.name,
      userName: this.registerData.email,
      email: this.registerData.email,
      contact: this.registerData.contact,
      password: this.registerData.password,
      role: 'user'
    };

    this.apiurl.post('auth/register', payload).subscribe({
      next: (response: any) => {
        this.ngZone.run(() => {
          this.isLoading = false;
          const token = response?.tokens?.access?.token;
          const user = response?.user;

          if (token && user) {
            localStorage.setItem('authToken', token);
            localStorage.setItem('user-profile', JSON.stringify(user));
            localStorage.setItem('user-id', user.id || user._id);
            localStorage.setItem('Role', user.role || 'user');

            if (response?.tokens?.refresh?.token) {
              localStorage.setItem('adminRefreshToken', response.tokens.refresh.token);
            }

            // Sync cart immediately upon registration
            this.cartWishService.onUserLogin();

            const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/home';
            sessionStorage.removeItem('redirectAfterLogin');

            this.notify('success', 'Account created and signed in successfully!');
            this.router.navigateByUrl(redirectTo);
          } else {
            this.successMessage = 'Registration successful! Please sign in.';
            this.notify('success', this.successMessage);
            this.isLoginView = true;
          }
        });
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          this.isLoading = false;
          const msg = err?.error?.message || 'Registration failed.';
          this.errorMessage = msg;
          this.notify('error', msg);
        });
      }
    });
  }

  onLogin(): void {
    // 1. Reset state
    this.errorMessage = null;
    this.isLoading = true;
    this.apiurl.tokenFlush();
    const loginData = {
      userName: this.loginData.email,
      password: this.loginData.password,
      role: this.loginData.role || 'user'
    };

    this.apiurl.post('auth/login', loginData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        const token = response?.tokens?.access?.token;
        const user = response?.user;

        if (!token || !user) {
          const msg = 'Login failed! Invalid response from server.';
          this.errorMessage = msg;
          this.notify('error', msg);
          return;
        }

        localStorage.setItem('authToken', token);
        localStorage.setItem('user-profile', JSON.stringify(user));
        localStorage.setItem('user-id', user.id || user._id);

        if (response?.tokens?.refresh?.token) {
          localStorage.setItem('adminRefreshToken', response.tokens.refresh.token);
        }

        const userRole = this.apiurl.getUserRole() || user.role || loginData.role;
        localStorage.setItem('Role', userRole);

        // Immediately merge guest cart and load wishlist!
        this.cartWishService.onUserLogin();

        const defaultPath = userRole === 'admin' ? '/admin/dashboard' : '/home';
        const redirectTo = sessionStorage.getItem('redirectAfterLogin') || defaultPath;
        sessionStorage.removeItem('redirectAfterLogin');

        this.notify('success', 'Login successful!');

        this.ngZone.run(() => {
          this.router.navigateByUrl(redirectTo).then(navigated => {
            if (!navigated) {
              console.error('Navigation failed for path:', redirectTo);
            }
          });
        });
      },
      error: (err: any) => {
        this.isLoading = false;

        let msg: string;
        if (err.status === 401 || err.status === 400) {
          msg = err.error?.message || 'Invalid email, password, or role selected.';
        } else if (err.status === 429) {
          msg = 'Too many attempts. Please try again in a few minutes.';
        } else if (err.status === 0) {
          msg = 'Network error. Please check your internet connection.';
        } else {
          msg = 'Something went wrong. Please try again later.';
        }

        this.errorMessage = msg;
        this.notify('error', msg);
      }
    });
  }
}
