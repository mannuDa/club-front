import { Component, ChangeDetectorRef, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { HttpServiceService } from '../../services/http-service.service';
import { PaginationService, PageResult } from '../../services/pagination.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
// import { Modal } from 'bootstrap';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'products',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxSpinnerModule],
  templateUrl: './products.html',
  styleUrls: ['./products.css'],
})
export class LowerCloths implements OnInit {
  selectedProducts: any[] = [];
  discountType: 'percentage' | 'fixed' = 'percentage';
  discountValue = 0;
  imageURL: string;
  removedImages: string[] = [];
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  selectedColor: string = "#000000";
  selectedGender: string = "";
  selectedcollection: string = "";
  allCloths: any[] = [];

  /* Pagination */
  currentPage = 1;
  pageSize = 10;
  readonly pageSizeOptions: number[] = [10, 25, 50, 100];
  pageData!: PageResult<any>;
  createForm!: FormGroup;
  isEditMode: boolean = false;
  currentProductId!: string;
  selectedProductIndex!: number;
  selectedFilesArray: File[] = [];
  fileSizeError: string[] = [];
  readonly MAX_SIZE_MB = 2;
  readonly MAX_SIZE_BYTES = 2 * 1024 * 1024;
  upperSizes: string[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  lowerSizes: number[] = [28, 30, 32, 34, 36, 38, 40];
  presetColors: string[] = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00',
    '#0000FF', '#FFFF00', '#800080', '#GRAY'
  ];
  clothsSizes: any[] = [];
  // Define your hierarchical options based on your structure
upperwearOptions = [
  {name: 'Shirts', subtypes: ['Casual Shirts', 'Formal Shirts', 'Partywear Shirts'] },
  {name: 'T-Shirts', subtypes: ['Polo T-Shirts', 'Round Neck T-Shirts', 'Half Sleeve', 'Full Sleeve'] },
  {name: 'Jacket', subtypes: ['Full Sleeve', 'Sleeveless'] },
  {name: 'Sweater', subtypes: ['Sleeveless', 'Full Sleeve'] }
];
lowerwearOptions = [ 
  {name: 'Trousers', subtypes: ['Formal Trousers', 'Casual Trousers'] },
  {name: 'Jeans', subtypes: ['regular', 'Casual Jeans'] }
];

  availableSubtypes: string[] = [];
  editorConfig = {
    placeholder: 'Write your content here...',
    tabsize: 2,
    height: 300,
    toolbar: [
      ['misc', ['codeview', 'undo', 'redo']],
      ['style', ['bold', 'italic', 'underline', 'clear']],
      ['font', ['strikethrough', 'superscript', 'subscript']],
      ['para', ['ul', 'ol', 'paragraph']],
      ['insert', ['link', 'picture', 'video']]
    ]
  };
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private cdr: ChangeDetectorRef,
    private apiurl: HttpServiceService,
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private toast: ToastrService,
    private pagination: PaginationService
  ) { this.imageURL = this.apiurl.imageBaseURL; }

  ngOnInit(): void {
    this.updatePage();
    this.getCloths();
    this.initializeSaveFormValidations();
  }
  getCloths() {
    this.spinner.show();
    this.apiurl.get('products').subscribe({
      next: (data: any) => {
        // 1) pehle data assign karo, 2) phir view refresh karo
        this.allCloths = [...data].sort((a: any, b: any) => (b.name || '').localeCompare(a.name || ''));
        this.updatePage();
        this.spinner.hide();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.spinner.hide();
        this.toast.error('Error fetching products!');
        console.error("API me lafda ho gaya:", err);
      }
    });
  }

  /* ---------- Pagination ---------- */
  updatePage(): void {
    this.pageData = this.pagination.paginate(this.allCloths, this.currentPage, this.pageSize);
    this.currentPage = this.pageData.page; // keeps the page valid, e.g. after deleting the last row of the last page
  }

  goToPage(page: number | string): void {
    if (typeof page !== 'number' || page === this.currentPage) { return; }
    this.currentPage = page;
    this.updatePage();
  }

  onPageSizeChange(size: number | string): void {
    this.pageSize = Number(size);
    this.currentPage = 1;
    this.updatePage();
  }

  selectPresetColor(color: string) {
    this.selectedColor = color;
  }

  /* Garment type options depend on the chosen category */
  get garmentOptions() {
    return this.selectedCategory === 'lower' ? this.lowerwearOptions : this.upperwearOptions;
  }

  /* Rebuild the subtype list for a category + garment type (also used when editing) */
  private refreshSubtypes(category: string, gstyle: string): void {
    const options = category === 'lower' ? this.lowerwearOptions : this.upperwearOptions;
    this.availableSubtypes = options.find(item => item.name === gstyle)?.subtypes ?? [];
  }

  /* Garment type (gstyle) changed -> load its subtypes and clear the old subtype */
  onGarmentTypeChange(event: Event): void {
    const selected = (event.target as HTMLSelectElement).value;
    this.refreshSubtypes(this.selectedCategory, selected);
    this.createForm.get('subtypes')?.setValue('');
  }

  toggleProductSelection(product: any, event: any): void {
    const checked = event.target.checked;

    if (checked) {  const alreadySelected = this.selectedProducts.some(     item => item.id === product.id   );
      if (!alreadySelected) {   this.selectedProducts.push(product);   } } 
      else {  this.selectedProducts = this.selectedProducts.filter(  item => item.id !== product.id        );  }
  }

  isSelected(productId: any): boolean {
    return this.selectedProducts.some(  product => product.id === productId  );
  }

  /* Header checkbox works on the rows of the current page; selections on other pages are kept */
  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    const pageItems: any[] = this.pageData?.items || [];

    if (checked) {
      pageItems.forEach(product => {
        if (!this.isSelected(product.id)) { this.selectedProducts.push(product); }
      });
    } else {
      const pageIds = new Set(pageItems.map(product => product.id));
      this.selectedProducts = this.selectedProducts.filter(product => !pageIds.has(product.id));
    }
  }
  isAllSelected(): boolean {
    const pageItems: any[] = this.pageData?.items || [];
    return pageItems.length > 0 && pageItems.every(product => this.isSelected(product.id));
  }


  openDiscountModal(): void {

    if (this.selectedProducts.length === 0) {
      return;
    }

    const modalElement = document.getElementById('discountModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }
applyDiscount(): void {

  if (!this.discountValue || this.discountValue <= 0) { return;  }
  const selectedProductIds = this.selectedProducts.map( product => product.id);
  if (selectedProductIds.length === 0) {  return; }
  this.spinner.show();
  this.apiurl.post( 'products/discount', { productIds: selectedProductIds,  discountValue: this.discountValue    }
  ).subscribe({
    next: (res: any) => {
      this.spinner.hide();
      this.getCloths();
      this.selectedProducts = [];
      this.discountValue = 0;
      const modalElement = document.getElementById('discountModal');
      if (modalElement) {   const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {   modal.hide(); }
      }
      this.cdr.detectChanges();

      // Alert AFTER modal hide
      setTimeout(() => {
        this.toast.success('Discount successfully applied!');
      }, 300);

    },

    error: (err) => {
      this.spinner.hide();
      this.toast.error('Error applying discount!');
      console.error('Discount update error:', err);
    }

  });
}
  isSomeSelected(): boolean {
    const pageItems: any[] = this.pageData?.items || [];
    const selectedOnPage = pageItems.filter(product => this.isSelected(product.id)).length;
    return selectedOnPage > 0 && selectedOnPage < pageItems.length;
  }
  triggerModal() {
    const modalEl = document.getElementById('UpdateclothModal');
    if (!modalEl) return;

    let modal = bootstrap.Modal.getInstance(modalEl);
    if (!modal) {
      modal = new bootstrap.Modal(modalEl);
    }
    modal.show();
  }

  closeModal() {
    const modalEl = document.getElementById('UpdateclothModal');
    if (!modalEl) return;

    const modal = bootstrap.Modal.getInstance(modalEl);
    modal?.hide();
  }


  initializeSaveFormValidations() {
    this.createForm = this.fb.group({
      category: ['', Validators.required],
      fashionType: ['', Validators.required],
      name: ['', Validators.required],
      fit_type: [''],
      cloth_type: [''],
      neck_type: [''],
      sleeve_type: [''],
      listing_price: ['', Validators.required],
      selling_price: ['', Validators.required],
      discountPercent: [0], // derived from listing vs selling price (see syncDiscount), never typed in
      gstyle: ['', Validators.required],
      subtypes: ['', Validators.required],
      collection: ['', Validators.required],
      model: ['', Validators.required],
      pro_desc: [''],
      return_policy: [''],
      shipping_policy: [''],
      care_policy: [''],
      sizes: [[], Validators.required],
    });

    // Whenever either price changes, refresh the discountPercent control
    ['listing_price', 'selling_price'].forEach(name =>
      this.createForm.get(name)?.valueChanges.subscribe(() => this.syncDiscount())
    );
  }

  get selectedCategory(): string {
    return this.createForm?.get('category')?.value || '';
  }

  get selectedSizes(): any[] {
    return this.createForm?.get('sizes')?.value || [];
  }

  /** Discount % from MRP vs selling price; null while the two prices don't give a valid discount. */
  private calcDiscount(): number | null {
    const listing = Number(this.createForm?.get('listing_price')?.value);
    const sellingRaw = this.createForm?.get('selling_price')?.value;
    if (sellingRaw === '' || sellingRaw === null || sellingRaw === undefined) { return null; }
    const selling = Number(sellingRaw);
    if (!listing || listing <= 0 || isNaN(selling) || selling < 0 || selling > listing) { return null; }
    return Math.round((1 - selling / listing) * 100);
  }

  /* Live discount shown in the modal (listing vs selling price) */
  get discountPercent(): number | null {
    return this.calcDiscount();
  }

  /** Writes the calculated discount into the discountPercent control so saveCloth() sends it to the API. */
  private syncDiscount(): void {
    this.createForm?.get('discountPercent')?.setValue(this.calcDiscount() ?? 0, { emitEvent: false });
  }

  isInvalid(controlName: string): boolean {
    const control = this.createForm?.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  /* Exactly Aapka Original onCategoryChange Function */
  onCategoryChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const categoryValue = selectElement.value;
    this.clothsSizes = categoryValue === "lower" ? [28, 30, 32, 34, 36, 38, 40]
      : categoryValue === "upper" ? ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] : [];

    this.createForm.patchValue({
      sizes: [],
      gstyle: '',
      subtypes: ''
    });
    this.availableSubtypes = [];
  }

  /* Exactly Aapka Original onCategoryChange Function */


  toggleSize(size: string | number): void {
    const sizes = [...this.selectedSizes];
    const index = sizes.indexOf(size);

    if (index > -1) { sizes.splice(index, 1); } 
    else { sizes.push(size);}

    this.createForm.patchValue({ sizes });
  }

  isSizeSelected(size: string | number): boolean {  return this.selectedSizes.includes(size); }

  /* Drag & Drop */
  allowDrop(event: DragEvent) {   event.preventDefault(); }
  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) {  this.handleFiles(event.dataTransfer.files); }
  }

  /* File Select */
  onFilesSelected(event: any) {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    this.handleFiles(files);
  }

  /* 💡 ONLY FIX HERE: selectedFiles ke sath selectedFilesArray me bhi push kar diya */
  handleFiles(files: FileList) {
    this.fileSizeError = []; // Every upload turn pe previous errors clear honge
    Array.from(files).forEach((file: File) => {
      if (file.size > this.MAX_SIZE_BYTES) {
        this.fileSizeError.push(`File "${file.name}" exceeds the 2MB size limit.`);
        return; // Skip this file and check next files
      }
      if (!file.type.startsWith("image/")) return;
      this.selectedFiles.push(file);
      this.selectedFilesArray.push(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviews.push(reader.result as string);
        this.cdr.detectChanges();
      };

      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number) {
    const removedImage = this.imagePreviews[index];
    if (!removedImage) return;

    // Existing image detect karo
    const isExistingImage = typeof removedImage === 'string' && !removedImage.startsWith('data:image');

    if (isExistingImage) { this.removedImages.push(removedImage); }
    else {
      // New uploaded image hai
      const newImageIndex = this.imagePreviews.slice(0, index)
        .filter(img => typeof img === 'string' && img.startsWith('data:image'))
        .length;

      this.selectedFiles.splice(newImageIndex, 1);
      this.selectedFilesArray.splice(newImageIndex, 1);
    }

    this.imagePreviews.splice(index, 1);
  }

  resetFileInput() { if (this.fileInput) { this.fileInput.nativeElement.value = ''; } }

  /* Exactly Aapka Original openModal Function */
  openModal(product?: any) {

    this.imagePreviews = [];
    this.selectedFilesArray = [];
    this.selectedFiles = [];
    this.removedImages = [];
    this.createForm.markAsPristine();
    this.createForm.markAsUntouched();

    if (product !== undefined) {

      this.isEditMode = true;
      // this.selectedProductIndex = index;
      this.currentProductId = product._id || product.id;

      const category = product.category || '';
      this.clothsSizes = category === "lower" ? this.lowerSizes : category === "upper" ? this.upperSizes : [];

      this.createForm.patchValue({
        category: category,
        name: product.name,
        fashionType: product.fashionType || '',
        subtypes: product.subtypes || '',
        gstyle: product.gstyle || '',
        fit_type: product.fit_type || '',
        cloth_type: product.cloth_type || '',
        neck_type: product.neck_type || '',
        sizes: product.sizes || [],
        sleeve_type: product.sleeve_type || '',
        listing_price: product.listing_price,
        selling_price: product.selling_price,
        collection: product.collection || '',
        model: product.model,
        care_policy: product.care_policy || '',
        pro_desc: product.pro_desc || '',
        return_policy: product.return_policy || '',
        shipping_policy: product.shipping_policy || '',
      });
      this.refreshSubtypes(category, product.gstyle || '');
      this.syncDiscount();

      this.selectedColor = product.color || '#000000';
      this.selectedGender = product.gender ? product.gender.toLowerCase() : 'unisex';

      if (product.imagesPath && product.imagesPath.length > 0) {
        this.imagePreviews = [...product.imagesPath];
      }
    } else {

      this.isEditMode = false;
      this.currentProductId = '';
      this.createForm.reset({
        category: '',
        fashionType: '',
        subtypes:  '',
        gstyle: '',
        name: '',
        fit_type: '',
        cloth_type: '',
        neck_type: '',
        sleeve_type: '',
        listing_price: '',
        selling_price: '',
        discountPercent: 0,
        collection: '',
        model: '',
        pro_desc: '',
        return_policy: '',
        shipping_policy: '',
        care_policy: '',
        sizes: []
      });

      this.selectedColor = '#000000';
      this.selectedGender = 'unisex';
      this.clothsSizes = [];
      this.availableSubtypes = [];
    }

    this.triggerModal();
  }

  /* Exactly Aapka Original saveCloth Function */
  saveCloth() {

    this.syncDiscount(); // make sure the latest calculated discount is what gets sent
    console.log('form data:', this.createForm);
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      this.toast.error('Please fill in all required fields.');
      return;
    }
    this.spinner.show();
    const formData = new FormData();

    Object.keys(this.createForm.controls).forEach(key => {
      if (key !== 'sizes') {
        const value = this.createForm.get(key)?.value;
        if (value !== null && value !== undefined) {  formData.append(key, value);}
      }
    });

    if (this.selectedColor) formData.append('color', this.selectedColor);
    if (this.selectedGender) formData.append('gender', this.selectedGender);

    if (this.selectedSizes && this.selectedSizes.length > 0) {
      formData.append('sizes', JSON.stringify(this.selectedSizes));
    }

    if (this.selectedFilesArray && this.selectedFilesArray.length > 0) {
      this.selectedFilesArray.forEach((file: File) => {
        formData.append('images', file);
      });
    }
    if (this.removedImages.length > 0) {

      formData.append('removedImages', JSON.stringify(this.removedImages));


    }

    if (this.isEditMode) {

      this.apiurl.put(`products/${this.currentProductId}`, formData).subscribe({
        next: (res: any) => {
          this.spinner.hide();
          this.allCloths[this.selectedProductIndex] = res.data;
          this.getCloths();
          this.toast.success('Updated successfully applied!');
          this.cdr.detectChanges();
          document.getElementById('closeModalBtn')?.click();

        },
        error: (err) => {
          this.spinner.hide();
          this.toast.error('Error updating product!');
          console.error(err);
        }
      });
    }
    else {
      this.apiurl.post('products', formData).subscribe({
        next: (res: any) => {
          this.spinner.hide();
          this.allCloths.push(res.data);
          this.getCloths();
          this.toast.success('Product added successfully!');
          document.getElementById('closeModalBtn')?.click();
        },
        error: (err) => {
          this.spinner.hide();
          console.error(err);
        }
      });
    }
  }

  onDeleteProduct(id: string, index: number) {
    if (confirm("Kya aap sach me delete karna chahte hain?")) {
      this.spinner.show();
      this.apiurl.delete(`products`, id).subscribe({
        next: (res: any) => {
          this.spinner.hide();
          this.allCloths.splice(index, 1);
          this.getCloths();
          this.toast.success('Product deleted successfully!');
        },
        error: (err) => { this.spinner.hide(); console.error(err); }
      });
    }
  }
}