import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { HttpServiceService } from './http-service.service';
import * as bootstrap from 'bootstrap';

@Injectable({
  providedIn: 'root'
})
export class OtherService {

  token = '';
  headerToken: any
  constructor(private http: HttpClient,
              private apiurl: HttpServiceService,
    
  ) {
    
  }

 triggerModal() {
    const modalEl = document.getElementById('select-size');
    if (!modalEl) return;

    let modal = bootstrap.Modal.getInstance(modalEl);
    if (!modal) {
      modal = new bootstrap.Modal(modalEl);
    }
    modal.show();
  }

}
