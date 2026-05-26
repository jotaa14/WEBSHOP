import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge/order-status-badge.component';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, OrderStatusBadgeComponent, StarRatingComponent],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css'})
export class OrderDetailComponent implements OnInit, OnDestroy {
  orderId: string = '';
  order: any = null;
  pollingInterval: any;
  
  reviewFormOpen = false;
  reviewData = {
    supermarketRating: 0,
    courierRating: 0,
    supermarketComment: '',
    courierComment: ''
  };
  
  returnItem: any = null;
  returnQty = 1;
  returnCondition = 'good';

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    if (this.orderId) {
      this.loadOrder();
      this.startPolling();
    }
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  loadOrder() {
    this.orderService.getOrder(this.orderId).subscribe({
      next: (res) => this.order = res.order
    });
  }

  startPolling() {
    // Poll status every 10 seconds if order is active
    this.pollingInterval = setInterval(() => {
      if (this.order && !['delivered', 'cancelled'].includes(this.order.status)) {
        this.orderService.getOrderStatus(this.orderId).subscribe({
          next: (res) => {
            if (this.order.status !== res.status || (res.courier && !this.order.courier)) {
              this.order.status = res.status;
              if (res.courier) this.order.courier = res.courier;
            }
          }
        });
      }
    }, 10000);
  }

  canCancel(): boolean {
    if (!this.order) return false;
    if (this.order.status === 'pending') return true;
    if (this.order.status === 'confirmed') {
      const now = new Date().getTime();
      const confirmedAt = new Date(this.order.updatedAt || this.order.createdAt).getTime();
      return (now - confirmedAt) <= (5 * 60 * 1000);
    }
    return false;
  }

  cancelOrder() {
    if (confirm('Tens a certeza que queres cancelar esta encomenda?')) {
      this.orderService.cancelOrder(this.orderId).subscribe({
        next: () => {
          alert('Encomenda cancelada com sucesso.');
          this.loadOrder();
        },
        error: (err) => alert(err.error?.error || 'Erro ao cancelar.')
      });
    }
  }
  
  submitReview() {
    this.orderService.submitReview(this.orderId, this.reviewData).subscribe({
      next: () => {
        alert('Avaliação submetida com sucesso!');
        this.reviewFormOpen = false;
        this.loadOrder();
      },
      error: (err) => alert(err.error?.error || 'Erro ao submeter avaliação.')
    });
  }
  
  openReturnModal(item: any) {
    this.returnItem = item;
    this.returnQty = 1;
    this.returnCondition = 'good';
  }
  
  submitReturn() {
    if (!this.returnItem) return;
    
    const data = {
      orderId: this.orderId,
      productId: this.returnItem.product,
      quantity: this.returnQty,
      condition: this.returnCondition
    };
    
    this.orderService.requestReturn(data).subscribe({
      next: () => {
        alert('Pedido de devolução submetido com sucesso!');
        this.returnItem = null;
        this.loadOrder();
      },
      error: (err) => alert(err.error?.error || 'Erro ao pedir devolução.')
    });
  }
}
