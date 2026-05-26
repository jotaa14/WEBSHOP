import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'})
export class CartComponent implements OnInit {
  groupedItems: any = {};
  supermarketIds: string[] = [];
  cartCount: number = 0;
  subtotal: number = 0;
  total: number = 0;
  deliveryMethods: { [key: string]: string } = {};
  loading = true;
  processing = false;
  error = '';

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    this.loading = true;
    this.cartService.getCart().subscribe({
      next: (res) => {
        this.groupedItems = res.groupedItems || {};
        this.supermarketIds = Object.keys(this.groupedItems);
        this.cartCount = res.cartCount || 0;
        this.subtotal = res.total || 0;
        
        // Initialize default delivery methods
        for (const supermId of this.supermarketIds) {
          if (!this.deliveryMethods[supermId]) {
             const sm = this.groupedItems[supermId].supermarket;
             if (sm && sm.deliveryMethods && sm.deliveryMethods.length > 0) {
               this.deliveryMethods[supermId] = sm.deliveryMethods[0];
             } else {
               this.deliveryMethods[supermId] = 'pickup';
             }
          }
        }
        
        this.calculateTotal();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // Removed getSupermarketIds() method to avoid template function calls

  updateQuantity(productId: string, quantity: number) {
    if (quantity < 1) return;
    this.cartService.updateQuantity(productId, quantity).subscribe({
      next: () => this.loadCart(),
      error: (err) => alert(err.error?.error || 'Erro ao atualizar.')
    });
  }

  removeItem(productId: string) {
    this.cartService.removeItem(productId).subscribe({
      next: () => this.loadCart()
    });
  }

  clearCart() {
    if(confirm('Tens a certeza que queres esvaziar o carrinho?')) {
      this.cartService.clearCart().subscribe({
        next: () => this.loadCart()
      });
    }
  }

  calculateTotal() {
    let deliveryCosts = 0;
    
    for (const supermId of this.supermarketIds) {
      const method = this.deliveryMethods[supermId];
      const sm = this.groupedItems[supermId].supermarket;
      
      if (sm) {
        if (method === 'courier') {
          deliveryCosts += (sm.courierCost || 0);
        } else if (method === 'pickup') {
          deliveryCosts += (sm.pickupCost || 0);
        }
      }
    }
    
    this.total = this.subtotal + deliveryCosts;
  }

  checkout() {
    this.processing = true;
    this.error = '';
    
    this.orderService.checkout(this.deliveryMethods).subscribe({
      next: () => {
        this.cartService.refreshCartCount(); // Resets to 0
        this.router.navigate(['/orders']);
      },
      error: (err) => {
        this.error = err.error?.error || 'Erro ao finalizar compra.';
        this.processing = false;
      }
    });
  }
}
