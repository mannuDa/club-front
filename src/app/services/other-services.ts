import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { HttpServiceService } from './http-service.service';


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

//   inCart(userID, proID){
    

//   }

}
