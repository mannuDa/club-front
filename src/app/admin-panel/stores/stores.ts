import {
  Component,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  OnInit
} from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { HttpServiceService } from '../../services/http-service.service';
import { ToastrService } from 'ngx-toastr';
import { ModalService } from '../../services/modal.service';
import { CommonModalComponent } from '../includes/common-modal/common-modal';

@Component({
  selector: 'app-stores',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommonModalComponent
  ],
  templateUrl: './stores.html',
  styleUrls: ['./stores.css']
})
export class Stores implements OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  storeForm!: FormGroup;

  allStores: any[] = [];

  selectedFiles: File[] = [];
  imagePreviews: string[] = [];

  constructor(
    private fb: FormBuilder,
    private apiurl: HttpServiceService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.getStores();
  }

  // ========================
  // FORM INITIALIZATION
  // ========================
  initializeForm() {
    this.storeForm = this.fb.group({
      store_name: ['', Validators.required],
      owner_name: ['', Validators.required],

      pan_card: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
        ]
      ],

      gst_number: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/)
        ]
      ],

      // CIN_number: [
      //   '',
      //   [
      //     Validators.required,
      //     Validators.pattern(/^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/)
      //   ]
      // ],

      contact_number: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[6-9]\d{9}$/)
        ]
      ],

      pin_code: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[1-9][0-9]{5}$/)
        ]
      ],

      city: ['', Validators.required],
      state: ['', Validators.required],
      location: ['', Validators.required]
    });
  }

  // ========================
  // MODAL CONTROL
  // ========================
  openStoreModal() {
    this.modalService.open('storeModal');
  }

  closeStoreModal() {
    this.modalService.close('storeModal');
  }

  // ========================
  // FILE HANDLING
  // ========================
  allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  onFilesSelected(event: any) {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    this.handleFiles(files);
  }

  handleFiles(files: FileList) {
    Array.from(files).forEach((file: File) => {
      if (!file.type.startsWith('image/')) return;

      this.selectedFiles.push(file);

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviews.push(reader.result as string);
      };

      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number) {
    this.imagePreviews.splice(index, 1);
    this.selectedFiles.splice(index, 1);
  }

  resetFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // ========================
  // SAVE STORE (FIXED FORM DATA)
  // ========================
  saveStore() {

    if (this.storeForm.invalid) {
      this.toastr.warning('Please fill all required fields');
      return;
    }

    const formData = new FormData();

    // append form fields
    Object.keys(this.storeForm.value).forEach((key: string) => {
      formData.append(key, this.storeForm.value[key]);
    });

    // append files
    this.selectedFiles.forEach(file => {
      formData.append('image', file);
    });

    this.apiurl.post('stores/create', formData).subscribe({
      next: () => {

        this.toastr.success('Store added successfully');

        this.storeForm.reset();
        this.selectedFiles = [];
        this.imagePreviews = [];

        this.resetFileInput();
        this.getStores();
        this.closeStoreModal();
      },

      error: (err) => {
        console.log(err);
        this.toastr.error('Something went wrong');
      }
    });
  }

  // ========================
  // GET STORES
  // ========================
getStores() {
  this.apiurl.get('stores').subscribe({
    next: (res: any) => {

      console.log("FULL RESPONSE:", res);

      this.allStores = res?.data || res || [];
      this.cdr.detectChanges();

      console.log("PARSED STORES:", this.allStores);
    },
    error: (err) => {
      console.log(err);
    }
  });
}
}