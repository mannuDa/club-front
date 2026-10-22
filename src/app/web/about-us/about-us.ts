import { Component, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpServiceService } from '../../services/http-service.service';
import { OwlCarousel } from '../../services/owl-courosol';
import { FormsModule } from '@angular/forms';
import { CarouselModule, CarouselComponent, OwlOptions } from 'ngx-owl-carousel-o';

@Component({
  selector: 'app-about-us',
  imports: [  CommonModule, FormsModule, CarouselModule],
  templateUrl: './about-us.html',
  styleUrls: ['./about-us.css']
})
// export class AboutUs {

// @ViewChild('widgetsContainer', { read: ElementRef }) public widgetsContainer!: ElementRef<any>;
//   services: any[] = [];
//   expandedIndex: number | null = null; 
//   imageURL: string;


//     constructor(  private apiurl: HttpServiceService, private cd: ChangeDetectorRef  ) {{
//     this.imageURL = this.apiurl.imageBaseURL; // Set the base URL for images
//    }}

//    onSubscribe() {
//     console.log('Subscriber Data:', this.subscribeData);
//     // API Call logic yaha aayegi
//   }

//     // Right Arrow Click logic
//   public scrollRight(): void {
//     // 1 card ki width nikal kar utna hi aage scroll karega
//     const cardWidth = this.widgetsContainer.nativeElement.querySelector('.carousel-item-custom').clientWidth;
//     this.widgetsContainer.nativeElement.scrollTo({
//       left: this.widgetsContainer.nativeElement.scrollLeft + cardWidth,
//       behavior: 'smooth'
//     });
//   }

//   // Left Arrow Click logic
//   public scrollLeft(): void {
//     const cardWidth = this.widgetsContainer.nativeElement.querySelector('.carousel-item-custom').clientWidth;
//     this.widgetsContainer.nativeElement.scrollTo({
//       left: this.widgetsContainer.nativeElement.scrollLeft - cardWidth,
//       behavior: 'smooth'
//     });
//   }

//         ngOnInit() {  
//               this.getStores();
//             }

//   teamMembers = [
//     { id:1,
//       name: 'Rishav Ruia',
//       role: 'Director of Operations and Brand Experience',
//       desc: "As director of operations and brand experience, Rishav Ruia orchestrates the seamless journey from design to wardrobe. He oversees everything from production workflows to customer engagement, ensuring that every interaction with Club Avis reflects the brand’s belief that “you are addressed by the way you dress.” His meticulous attention to detail and dedication to service excellence guarantee that every garment not only fits beautifully but also delights at every touchpoint. Through his leadership, Club Avis fosters a lasting connection between sophisticated formal wear and the individuals who wear it.",
//       socials: { facebook: '#', twitter: '#', linkedin: '#', behance: '#' },
//       image: 'assets/images/team-member-01.jpg'
//     },
//     { id:2,
//       name: 'Abhishek Rajgaria',
//       role: 'Founding Directors',
//       desc: "As one of Club Avis’s founding directors, Abhishek Rajgaria brings a keen strategic vision to every collection. With an innate understanding of how fashion communicates personality, he leads the team in curating styles that not only look impeccable but also speak to each individual’s unique identity. He focuses on quality tailoring and refined silhouettes, ensuring that every formal wear piece carries both elegance and confidence. Under his guidance, Club Avis continues to set new benchmarks in combining timeless craftsmanship with modern sensibilities.",
//       socials: { facebook: '#', twitter: '#', linkedin: '#', behance: '#' },
//       image: 'assets/images/team-member-02.jpg'
//     },
//     { id:3,
//       name: 'Shashank Arya',
//       role: 'Chief Marketing',
//       desc: "Shashank Arya serves as the creative force behind Club Avis’s ever-evolving aesthetic. Passionate about reinventing classic forms, he constantly experiments with new fabric blends, textures, and color palettes to craft unexpected yet sophisticated combinations. His commitment to continuous improvisation drives the brand’s innovation, ensuring each season reveals fresh interpretations of formal wear. His ability to anticipate emerging trends while staying true to the brand’s core ethos makes him an invaluable architect of Club Avis’s distinctive style."
//         ,
//       socials: { facebook: '#', twitter: '#', linkedin: '#', behance: '#' },
//       image: 'assets/images/team-member-03.jpg'
//     }
//   ];
//   // services = [
//   //   { id:1, title: 'Custom Tailoring', description: 'Experience the perfect fit with our custom tailoring services.', image: 'assets/images/service1.jpg' },
//   //   { id:2, title: 'Fabric Consultation', description: 'Get expert advice on the best fabrics for your needs.', image: 'assets/images/service2.jpg' },
//   //   { id:3, title: 'Style Guidance', description: 'Receive personalized style recommendations from our experts.', image: 'assets/images/service3.jpg' }
//   // ];
//   experts = [
//     { id:1,
//       name: 'S P Bansal',
//       about: 'With over 50 years of experience in the garment and fabric industry, S P Bansal brings unmatched expertise in fabric sourcing and design innovation.'
//     },
//     { id:2,
//       name: 'Rakesh Bansal',
//       about: 'A seasoned expert with 50 years of experience in garment fabric and product development, Rakesh ensures every collection stands the test of time.'
//     },

//   ];
//   subscribeData = {
//     name: '',
//     email: ''
//   };
// // Variables declare karein


// getStores() {
//   this.apiurl.get('stores').subscribe({
//     next: (res: any) => {
//       console.log("FULL RESPONSE:", res);
      
//       // ✅ Yeh ensure karega ki data hamesha ARRAY format me hi save ho
//       if (res && Array.isArray(res.data)) {
//         this.services = res.data;
//       } else if (Array.isArray(res)) {
//         this.services = res;
//       } else {
//         this.services = [];
//       }
//       this.cd.detectChanges();
//       console.log("PARSED STORES ARRAY:", this.imageURL + this.services[0].storeimagesPath
// );
//     },
//     error: (err) => {
//       console.error("API ERROR:", err);
//     }
//   });
// }

// // ✅ Toggle function add karein
// toggleReadMore(index: number) {
//   this.expandedIndex = this.expandedIndex === index ? null : index;
// }

// // ✅ Preview function add karein agar pehle se nahi hai
// getPreview(text: string): string {
//   if (!text) return '';
//   return text.length > 60 ? text.substring(0, 60) + '...' : text;
// }


// }


export class AboutUs {
  @ViewChild('owlCar', { static: false }) owlCar!: CarouselComponent;
    imageURL: string;
    customOptions:any;
    constructor(  private apiurl: HttpServiceService, private cd: ChangeDetectorRef, public owl:OwlCarousel  ) {{
    this.imageURL = this.apiurl.imageBaseURL; // Set the base URL for images
    this.customOptions= this.owl.customOptions;
   }}
  subscribeData = {
    name: '',
    email: ''
  };

  // Team Members Data
  teamMembers = [
    {
      id: 1,
      name: 'Ragnar Lothbrok',
      role: 'Product Caretaker',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600',
      socials: { facebook: '#', twitter: '#', linkedin: '#', behance: '#' }
    },
    {
      id: 2,
      name: 'Rani Mary',
      role: 'Product Caretaker',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600',
      socials: { facebook: '#', twitter: '#', linkedin: '#', behance: '#' }
    },
    {
      id: 3,
      name: 'John Doe',
      role: 'Fashion Designer',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600',
      socials: { facebook: '#', twitter: '#', linkedin: '#', behance: '#' }
    }
  ];

  // Stores Data
   services: any[] = [];

  // Carousel Configuration

  ngOnInit() {  
        this.getStores();
      }

  prevSlide() {
    if (this.owlCar) this.owlCar.prev();
  }

  nextSlide() {
    if (this.owlCar) this.owlCar.next();
  }

  onSubscribe() {
    console.log('Subscribe Data:', this.subscribeData);
  }

  getStores() {
  this.apiurl.get('stores').subscribe({
    next: (res: any) => {
      console.log("FULL RESPONSE:", res);
      
      // ✅ Yeh ensure karega ki data hamesha ARRAY format me hi save ho
      if (res && Array.isArray(res.data)) {
        this.services = res.data;
      } else if (Array.isArray(res)) {
        this.services = res;
      } else {
        this.services = [];
      }
      this.cd.detectChanges();
      console.log("PARSED STORES ARRAY:", this.imageURL + this.services[0].storeimagesPath
);
    },
    error: (err) => {
      console.error("API ERROR:", err);
    }
  });
}
}