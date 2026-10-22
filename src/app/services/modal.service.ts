import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  private modalState = new Subject<{ name: string, action: 'open' | 'close' }>();

  modalState$ = this.modalState.asObservable();

  open(name: string) {
    console.log("modal name:", name);
    
    this.modalState.next({ name, action: 'open' });
  }

  close(name: string) {
    this.modalState.next({ name, action: 'close' });
  }
}