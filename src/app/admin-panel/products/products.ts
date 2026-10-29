import { Component, ChangeDetectorRef, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { HttpServiceService } from '../../services/http-service.service';
import { PaginationService, PageResult } from '../../services/pagination.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import * as bootstrap from 'bootstrap';
// import * as XLSX from 'xlsx';
// SheetJS (xlsx) declaration to prevent import/bundling issues
// declare var XLSX: any;
declare var XLSX: any;

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
  clothsSizes: any[] = [];
  availableSubtypes: string[] = [];
  readonly MAX_SIZE_MB = 2;
  readonly MAX_SIZE_BYTES = 2 * 1024 * 1024;
  upperSizes: string[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  lowerSizes: number[] = [28, 30, 32, 34, 36, 38, 40];
  presetColors: string[] = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00',
    '#0000FF', '#FFFF00', '#800080', '#GRAY'
  ];

  // Define your hierarchical options based on your structure
  upperwearOptions = [
    { name: 'Shirts', subtypes: ['Casual Shirts', 'Formal Shirts', 'Partywear Shirts'] },
    { name: 'T-Shirts', subtypes: ['Polo T-Shirts', 'Round Neck T-Shirts', 'Half Sleeve', 'Full Sleeve'] },
    { name: 'Jacket', subtypes: ['Full Sleeve', 'Sleeveless'] },
    { name: 'Sweater', subtypes: ['Sleeveless', 'Full Sleeve'] }
  ];
  lowerwearOptions = [ 
    { name: 'Trousers', subtypes: ['Formal Trousers', 'Casual Trousers'] },
    { name: 'Jeans', subtypes: ['regular', 'Casual Jeans'] }
  ];

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

  /* Bulk Excel Upload State */
  bulkParsedProducts: any[] = [];
  invalidBulkRowsCount: number = 0;
  selectedZipFile: File | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('bulkExcelInput') bulkExcelInput!: ElementRef<HTMLInputElement>;

  constructor(
    private cdr: ChangeDetectorRef,
    private apiurl: HttpServiceService,
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private toast: ToastrService,
    private pagination: PaginationService
  ) { 
    this.imageURL = this.apiurl.imageBaseURL; 
  }

  ngOnInit(): void {
    this.updatePage();
    this.getCloths();
    this.initializeSaveFormValidations();
  }

  getCloths() {
    this.spinner.show();
    this.apiurl.get('products').subscribe({
      next: (data: any) => {
        this.allCloths = [...data].sort((a: any, b: any) => (b.name || '').localeCompare(a.name || ''));
        this.updatePage();
        this.spinner.hide();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.spinner.hide();
        this.toast.error('Error fetching products!');
        console.error("API error:", err);
      }
    });
  }

  /* ---------- Pagination ---------- */
  updatePage(): void {
    this.pageData = this.pagination.paginate(this.allCloths, this.currentPage, this.pageSize);
    this.currentPage = this.pageData.page;
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

  get garmentOptions() {
    return this.selectedCategory === 'lower' ? this.lowerwearOptions : this.upperwearOptions;
  }

  private refreshSubtypes(category: string, gstyle: string): void {
    const options = category === 'lower' ? this.lowerwearOptions : this.upperwearOptions;
    this.availableSubtypes = options.find(item => item.name === gstyle)?.subtypes ?? [];
  }

  onGarmentTypeChange(event: Event): void {
    const selected = (event.target as HTMLSelectElement).value;
    this.refreshSubtypes(this.selectedCategory, selected);
    this.createForm.get('subtypes')?.setValue('');
  }

  toggleProductSelection(product: any, event: any): void {
    const checked = event.target.checked;
    if (checked) {
      const alreadySelected = this.selectedProducts.some(item => item.id === product.id);
      if (!alreadySelected) { this.selectedProducts.push(product); } 
    } else {
      this.selectedProducts = this.selectedProducts.filter(item => item.id !== product.id);
    }
  }

  isSelected(productId: any): boolean {
    return this.selectedProducts.some(product => product.id === productId);
  }

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
    if (!this.discountValue || this.discountValue <= 0) { return; }
    const selectedProductIds = this.selectedProducts.map(product => product.id);
    if (selectedProductIds.length === 0) { return; }

    this.spinner.show();
    this.apiurl.post('products/discount', { 
      productIds: selectedProductIds, 
      discountValue: this.discountValue 
    }).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        this.getCloths();
        this.selectedProducts = [];
        this.discountValue = 0;
        const modalElement = document.getElementById('discountModal');
        if (modalElement) {
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) { modal.hide(); }
        }
        this.cdr.detectChanges();

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
      discountPercent: [0],
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

  private calcDiscount(): number | null {
    const listing = Number(this.createForm?.get('listing_price')?.value);
    const sellingRaw = this.createForm?.get('selling_price')?.value;
    if (sellingRaw === '' || sellingRaw === null || sellingRaw === undefined) { return null; }
    const selling = Number(sellingRaw);
    if (!listing || listing <= 0 || isNaN(selling) || selling < 0 || selling > listing) { return null; }
    return Math.round((1 - selling / listing) * 100);
  }

  get discountPercent(): number | null {
    return this.calcDiscount();
  }

  private syncDiscount(): void {
    this.createForm?.get('discountPercent')?.setValue(this.calcDiscount() ?? 0, { emitEvent: false });
  }

  isInvalid(controlName: string): boolean {
    const control = this.createForm?.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

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

  toggleSize(size: string | number): void {
    const sizes = [...this.selectedSizes];
    const index = sizes.indexOf(size);

    if (index > -1) { sizes.splice(index, 1); } 
    else { sizes.push(size); }

    this.createForm.patchValue({ sizes });
  }

  isSizeSelected(size: string | number): boolean { 
    return this.selectedSizes.includes(size); 
  }

  allowDrop(event: DragEvent) { event.preventDefault(); }
  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) { this.handleFiles(event.dataTransfer.files); }
  }

  onFilesSelected(event: any) {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;
    this.handleFiles(files);
  }

  handleFiles(files: FileList) {
    this.fileSizeError = [];
    Array.from(files).forEach((file: File) => {
      if (file.size > this.MAX_SIZE_BYTES) {
        this.fileSizeError.push(`File "${file.name}" exceeds the 2MB size limit.`);
        return;
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

    const isExistingImage = typeof removedImage === 'string' && !removedImage.startsWith('data:image');

    if (isExistingImage) { 
      this.removedImages.push(removedImage); 
    } else {
      const newImageIndex = this.imagePreviews.slice(0, index)
        .filter(img => typeof img === 'string' && img.startsWith('data:image'))
        .length;

      this.selectedFiles.splice(newImageIndex, 1);
      this.selectedFilesArray.splice(newImageIndex, 1);
    }

    this.imagePreviews.splice(index, 1);
  }

  resetFileInput() { 
    if (this.fileInput) { this.fileInput.nativeElement.value = ''; } 
  }

  openModal(product?: any) {
    this.imagePreviews = [];
    this.selectedFilesArray = [];
    this.selectedFiles = [];
    this.removedImages = [];
    this.createForm.markAsPristine();
    this.createForm.markAsUntouched();

    if (product !== undefined) {
      this.isEditMode = true;
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
        subtypes: '',
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

  saveCloth() {
    this.syncDiscount();
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
        if (value !== null && value !== undefined) { formData.append(key, value); }
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
    } else {
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
        error: (err) => { 
          this.spinner.hide(); 
          console.error(err); 
        }
      });
    }
  }

  /* ========================================================
   * BULK EXCEL UPLOAD WITH PREVIEW MODAL & TEMPLATE DOWNLOAD
   * ======================================================== */
async onBulkExcelUpload(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  this.spinner.show();

  try {
    const XLSX = await import('xlsx');

    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const data = new Uint8Array(buffer);
        
        // SheetJS read
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          this.spinner.hide();
          this.toast.warning('Excel file khali hai!');
          this.resetBulkFileInput();
          return;
        }

        this.bulkParsedProducts = rawRows
          .filter((row: any) => {
            const pName = row['Product name'] || row['Name'] || row['name'];
            const pModel = row['Model / SKU'] || row['Model'] || row['model'];
            return Boolean(pName || pModel);
          })
          .map((row: any) => {
            const name = String(row['Product name'] || row['Name'] || row['name'] || '').trim();
            const model = String(row['Model / SKU'] || row['Model'] || row['model'] || '').trim();
            const listingPrice = Number(row['Listing price'] || row['Listing Price'] || row['listing_price'] || 0);
            const sellingPrice = Number(row['Selling price'] || row['Selling Price'] || row['selling_price'] || 0);

            let discount = Number(row['Discount'] || row['discount'] || 0);
            if (!discount && listingPrice > 0 && sellingPrice > 0) {
              discount = Math.round((1 - sellingPrice / listingPrice) * 100);
            }

            let sizesVal: any[] = [];
            const rawSizes = row['Sizes'] || row['sizes'];
            if (typeof rawSizes === 'string' && rawSizes.trim()) {
              sizesVal = rawSizes.split(',').map((s: string) => s.trim());
            } else if (Array.isArray(rawSizes)) {
              sizesVal = rawSizes;
            }

            const rawImages = String(row['Image Link'] || row['imagesPath'] || '').trim();
            const imagesPath = rawImages 
              ? rawImages.split(',').map((img: string) => img.trim()).filter(Boolean) 
              : [];

            return {
              name,
              model,
              category: String(row['Category'] || row['category'] || '').toLowerCase().trim(),
              fashionType: String(row['Fashion type'] || row['Fashion Type'] || '').trim(),
              gstyle: String(row['Garment style'] || row['Garment Style'] || row['gstyle'] || '').trim(),
              subtypes: String(row['Subtype'] || row['subtypes'] || '').trim(),
              collection: String(row['Collection'] || row['collection'] || '').trim(),
              listing_price: String(listingPrice),
              selling_price: String(sellingPrice),
              discount: discount >= 0 ? discount : 0,
              sizes: sizesVal,
              color: String(row['Colour'] || row['Color'] || row['color'] || '#000000').trim(),
              gender: String(row['gender'] || row['Gender'] || 'male').toLowerCase().trim(),
              fit_type: row['Fit type'] || row['Fit Type'] || row['fit_type'] || '',
              cloth_type: row['Cloth type'] || row['Cloth Type'] || row['cloth_type'] || '',
              neck_type: row['Neck type'] || row['Neck Type'] || row['neck_type'] || '',
              sleeve_type: row['Sleeve type'] || row['Sleeve Type'] || row['sleeve_type'] || '',
              pro_desc: row['Description'] || row['Description '] || row['pro_desc'] || '',
              care_policy: row['Care instructions'] || row['Care Policy'] || '',
              return_policy: row['Return policy'] || row['Return Policy'] || '',
              shipping_policy: row['Shipping instructions'] || row['Shipping Policy'] || '',
              imagesPath: imagesPath,
              isValid: Boolean(name && model && listingPrice > 0 && sellingPrice > 0)
            };
          });

        this.invalidBulkRowsCount = this.bulkParsedProducts.filter(p => !p.isValid).length;
        this.spinner.hide();
        this.cdr.detectChanges();

        this.openBulkPreviewModal();

      } catch (innerErr) {
        this.spinner.hide();
        this.toast.error('Excel data parse karne me error aaya.');
        console.error('Inner parsing error:', innerErr);
        this.resetBulkFileInput();
      }
    };

    reader.onerror = (readErr) => {
      this.spinner.hide();
      this.toast.error('File load nahi ho saki.');
      console.error(readErr);
      this.resetBulkFileInput();
    };

    reader.readAsArrayBuffer(file);

  } catch (loadErr) {
    this.spinner.hide();
    this.toast.error('XLSX module load karne me error aaya.');
    console.error('Dynamic import error:', loadErr);
    this.resetBulkFileInput();
  }
}

  openBulkPreviewModal(): void {
    const modalEl = document.getElementById('bulkPreviewModal');
    if (modalEl) {
      let modal = bootstrap.Modal.getInstance(modalEl);
      if (!modal) {
        modal = new bootstrap.Modal(modalEl);
      }
      modal.show();
    }
  }

  closeBulkPreviewModal(): void {
    const modalEl = document.getElementById('bulkPreviewModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
    this.resetBulkFileInput();
  }

  onZipSelected(event: Event): void {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (!files || files.length === 0) return;

  const file = files[0];

  // Validation: Check if it's actually a ZIP file
  if (!file.name.toLowerCase().endsWith('.zip')) {
    this.toast.error('Kripya sirf .zip format ki archive file select karein.');
    target.value = '';
    return;
  }

  // Size limit check (e.g., 100 MB max)
  const MAX_ZIP_MB = 100;
  if (file.size > MAX_ZIP_MB * 1024 * 1024) {
    this.toast.error(`ZIP file ka size ${MAX_ZIP_MB}MB se zyada nahi hona chahiye.`);
    target.value = '';
    return;
  }

  this.selectedZipFile = file;
  this.toast.success(`you have selected: ${file.name}`);
}

confirmBulkUpload(): void {
  if (this.bulkParsedProducts.length === 0) return;

  const validProducts = this.bulkParsedProducts.filter(p => p.isValid);

  if (validProducts.length === 0) {
    this.toast.error('Koi valid product nahi mila upload karne ke liye.');
    return;
  }

  this.spinner.show();

  // 1. JSON ki jagah FormData banayein
  const formData = new FormData();

  // 2. Excel ke parsed products ko JSON string me serialize karein
  formData.append('products', JSON.stringify(validProducts));

  // 3. Agar user ne ZIP file select ki hai, toh use append karein
  if (this.selectedZipFile) {
    formData.append('zipFile', this.selectedZipFile, this.selectedZipFile.name);
  }

  // 4. API call (FormData send karte waqt Angular Content-Type multipart/form-data khud handle karta hai)
  this.apiurl.post('products/bulk', formData).subscribe({
    next: (res: any) => {
      this.spinner.hide();
      this.closeBulkPreviewModal();
      
      const count = res.insertedCount || validProducts.length;
      this.toast.success(`${count} products successfully add ho gaye!`);
      
      // State reset karein
      this.bulkParsedProducts = [];
      this.selectedZipFile = null;
      
      // Table data refresh
      this.getCloths();
    },
    error: (err: any) => {
      this.spinner.hide();
      this.toast.error(err.error?.message || 'Bulk upload me error aaya! Backend check karein.');
      console.error('Bulk upload error:', err);
    }
  });
}

  removeBulkRow(index: number): void {
    this.bulkParsedProducts.splice(index, 1);
    this.invalidBulkRowsCount = this.bulkParsedProducts.filter(p => !p.isValid).length;
    if (this.bulkParsedProducts.length === 0) {
      this.closeBulkPreviewModal();
    }
  }

  // downloadSampleExcel(): void {
  //   if (typeof XLSX === 'undefined') {
  //     this.toast.error('XLSX library load nahi hui.');
  //     return;
  //   }

  //   const sampleData = [
  //     {
  //       'Name': 'Classic White Shirt',
  //       'Category': 'upper',
  //       'Fashion Type': 'Casual',
  //       'Garment Style': 'Shirts',
  //       'Subtype': 'Casual Shirts',
  //       'Collection': 'Summer 2026',
  //       'Model': 'MOD-SH-01',
  //       'Listing Price': 1999,
  //       'Selling Price': 1499,
  //       'Sizes': 'M,L,XL',
  //       'Color': '#FFFFFF',
  //       'Gender': 'men',
  //       'Fit Type': 'Slim',
  //       'Cloth Type': 'Cotton',
  //       'Neck Type': 'Collar',
  //       'Sleeve Type': 'Full Sleeve',
  //       'Description': 'Premium 100% cotton casual shirt'
  //     },
  //     {
  //       'Name': 'Slim Fit Denim Jeans',
  //       'Category': 'lower',
  //       'Fashion Type': 'Denim',
  //       'Garment Style': 'Jeans',
  //       'Subtype': 'Casual Jeans',
  //       'Collection': 'Winter 2026',
  //       'Model': 'MOD-JN-99',
  //       'Listing Price': 2999,
  //       'Selling Price': 1999,
  //       'Sizes': '30,32,34',
  //       'Color': '#0000FF',
  //       'Gender': 'men',
  //       'Fit Type': 'Slim Fit',
  //       'Cloth Type': 'Denim',
  //       'Neck Type': '',
  //       'Sleeve Type': '',
  //       'Description': 'Stretchable dark blue denim'
  //     }
  //   ];

  //   const worksheet = XLSX.utils.json_to_sheet(sampleData);
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, 'Products_Sample');
  //   XLSX.writeFile(workbook, 'Product_Bulk_Upload_Sample.xlsx');
  // }

  async downloadSampleExcel(): Promise<void> {
  try {
    const XLSX = await import('xlsx');

        const sampleData = [
      {
        'Name': 'Classic White Shirt',
        'Category': 'upper',
        'Fashion Type': 'Casual',
        'Garment Style': 'Shirts',
        'Subtype': 'Casual Shirts',
        'Collection': 'Summer 2026',
        'Model': 'MOD-SH-01',
        'Listing Price': 1999,
        'Selling Price': 1499,
        'Sizes': 'M,L,XL',
        'Color': '#FFFFFF',
        'Gender': 'men',
        'Fit Type': 'Slim',
        'Cloth Type': 'Cotton',
        'Neck Type': 'Collar',
        'Sleeve Type': 'Full Sleeve',
        'Description': 'Premium 100% cotton casual shirt'
      },

    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products_Sample');
    XLSX.writeFile(workbook, 'Product_Bulk_Upload_Sample.xlsx');
  } catch (err) {
    console.error('XLSX load error:', err);
    this.toast.error('XLSX library load nahi hui.');
  }
}
  private resetBulkFileInput(): void {
    if (this.bulkExcelInput) {
      this.bulkExcelInput.nativeElement.value = '';
    }
  }
}