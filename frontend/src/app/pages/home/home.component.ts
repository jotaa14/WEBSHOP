import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SupermarketService } from '../../core/services/supermarket.service';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'})
export class HomeComponent implements OnInit {
  supermarkets: any[] = [];
  categories: string[] = [];
  featuredProducts: any[] = [];

  constructor(
    private supermarketService: SupermarketService,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.supermarketService.getSupermarkets({ sort: 'rating' }).subscribe({
      next: (res) => {
        const list = res.supermarkets || [];
        // Pre-compute display values once to avoid recalculating on every change detection cycle
        this.supermarkets = list.map((s: any) => ({
          ...s,
          _initial: s.name ? s.name.charAt(0).toUpperCase() : '?',
          _avatarBg: this.buildAvatarGradient(s.name),
          _rating: s.rating || (3.5 + Math.random() * 1.5).toFixed(1),
          _distance: (0.5 + Math.random() * 4.5).toFixed(1),
          _delivery: (() => { const m = Math.floor(15 + Math.random() * 15); return `${m}-${m + 10}`; })()
        }));
      }
    });

    this.productService.getCategories().subscribe({
      next: (res) => this.categories = res.categories || []
    });

    this.productService.getProducts({ limit: 4 }).subscribe({
      next: (res) => this.featuredProducts = res.products || []
    });
  }

  addToCart(productId: string) {
    this.cartService.addToCart(productId, 1).subscribe();
  }

  private buildAvatarGradient(name: string): string {
    if (!name) return 'linear-gradient(135deg, hsl(200, 70%, 55%), hsl(240, 70%, 45%))';
    const hue = name.charCodeAt(0) * 7 % 360;
    return `linear-gradient(135deg, hsl(${hue}, 70%, 55%), hsl(${(hue + 40) % 360}, 70%, 45%))`;
  }
}
