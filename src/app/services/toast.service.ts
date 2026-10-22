   import { Injectable, inject } from '@angular/core';
   import { ToastrService } from 'ngx-toastr';

   @Injectable({ providedIn: 'root' })
   export class ToastService {
     private toastr = inject(ToastrService);
     show(message: string): void { this.toastr.info(message); }
   }