import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupermarketService } from '../../core/services/supermarket.service';
import { CartService } from '../../core/services/cart.service';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-supermarket-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, StarRatingComponent],
  templateUrl: './supermarket-detail.component.html',
  styleUrl: './supermarket-detail.component.css'})
export class SupermarketDetailComponent implements OnInit {
  supermarketId: string = '';
  supermarket: any = null;
  products: any[] = [];
  categories: string[] = [];
  loadingProducts = true;
  
  filters = {
    category: '',
    name: ''
  };

  constructor(
    private route: ActivatedRoute,
    private supermarketService: SupermarketService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.supermarketId = this.route.snapshot.paramMap.get('id') || '';
    if (this.supermarketId) {
      this.loadSupermarket();
      this.loadProducts();
    }
  }

  loadSupermarket() {
    this.supermarketService.getSupermarket(this.supermarketId).subscribe({
      next: (res) => {
        const s = res.supermarket;
        if (s) {
          s._formattedTime = `${this.formatTime(s.openingHour, s.openingMinute)} - ${this.formatTime(s.closingHour, s.closingMinute)}`;
        }
        this.supermarket = s;
      }
    });
  }

  loadProducts() {
    this.loadingProducts = true;
    this.supermarketService.getSupermarketProducts(this.supermarketId, this.filters).subscribe({
      next: (res) => {
        this.products = res.products || [];
        this.categories = res.categories || [];
        this.loadingProducts = false;
      },
      error: () => this.loadingProducts = false
    });
  }

  addToCart(product: any) {
    if (product.stock > 0) {
      this.cartService.addToCart(product._id, 1).subscribe({
        next: () => {
          // You could add a toast notification here
          alert(`${product.name} adicionado ao carrinho!`);
        }
      });
    }
  }

  formatTime(hour: number, minute: number): string {
    return `${(hour || 0).toString().padStart(2, '0')}:${(minute || 0).toString().padStart(2, '0')}`;
  }
}
