import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-common-modal',
  standalone: true,
  imports: [CommonModule],   // ✅ THIS IS REQUIRED
  templateUrl: './common-modal.html'
})
export class CommonModalComponent {

  @Input() modalId!: string;
  @Input() title = '';

  isOpen = false;

  constructor(private modalService: ModalService) {}

  ngOnInit() {
    this.modalService.modalState$.subscribe((res: any) => {
       console.log('Modal state change:', res);
      if (res.name === this.modalId) {
        this.isOpen = res.action === 'open';
      }
    });
  }

  close() {
    this.isOpen = false;
    this.modalService.close(this.modalId);
  }
}