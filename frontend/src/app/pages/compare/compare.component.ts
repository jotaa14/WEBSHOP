import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './compare.component.html',
  styleUrl: './compare.component.css'})
export class CompareComponent implements OnInit {
  productName: string = '';
  products: any[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.productName = this.route.snapshot.paramMap.get('name') || '';
    if (this.productName) {
      this.loadComparison();
    }
  }

  loadComparison() {
    this.loading = true;
    this.productService.compareProduct(this.productName).subscribe({
      next: (res) => {
        this.products = res.products || [];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  addToCart(product: any) {
    this.cartService.addToCart(product._id, 1).subscribe({
      next: () => {
        alert(`${product.name} do ${product.supermarket?.name} adicionado ao carrinho!`);
      }
    });
  }
}
