import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'})
export class ProductsComponent implements OnInit {
  products: any[] = [];
  categories: string[] = [];
  supermarkets: any[] = [];
  loading = true;
  
  filters: any = {
    name: '',
    category: '',
    supermarket: '',
    maxPrice: null,
    sort: ''
  };

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['category']) this.filters.category = params['category'];
      if (params['name']) this.filters.name = params['name'];
      this.loadProducts();
    });
  }

  loadProducts() {
    this.loading = true;
    
    // Update URL without reloading
    const queryParams: any = {};
    if (this.filters.category) queryParams.category = this.filters.category;
    if (this.filters.name) queryParams.name = this.filters.name;
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });

    this.productService.getProducts(this.filters).subscribe({
      next: (res) => {
        this.products = res.products || [];
        if (this.categories.length === 0) this.categories = res.categories || [];
        if (this.supermarkets.length === 0) this.supermarkets = res.supermarkets || [];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  addToCart(product: any) {
    if (product.stock > 0) {
      this.cartService.addToCart(product._id, 1).subscribe({
        next: () => {
          alert(`${product.name} adicionado ao carrinho!`);
        }
      });
    }
  }
}
