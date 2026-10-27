import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-size-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrls: ['./modal.css']
})
export class ModalComponent {
  @Input() isOpen: boolean = false;
  @Input() product: any = null;
  @Input() imageBaseURL: string = '';

  @Output() sizeSelected = new EventEmitter<{ product: any; size: string }>();
  @Output() closed = new EventEmitter<void>();

  selectedSize: string = '';
  showError: boolean = false;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.closeModal();
    }
  }

  selectSize(size: string): void {
    this.selectedSize = size;
    this.showError = false;
  }

  confirmSize(): void {
    if (!this.selectedSize) {
      this.showError = true;
      return;
    }

    this.showError = false;
    this.sizeSelected.emit({
      product: this.product,
      size: this.selectedSize
    });
    this.closeModal();
  }

  closeModal(): void {
    this.selectedSize = '';
    this.showError = false;
    this.closed.emit();
  }

  handleBackdropClick(event: MouseEvent): void {
    // Agar user container ke bahar click kare tabhi close ho
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }
}