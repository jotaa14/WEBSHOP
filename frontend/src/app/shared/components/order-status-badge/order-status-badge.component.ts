import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-status-badge.component.html'})
export class OrderStatusBadgeComponent {
  @Input() status: string = '';

  getBadgeClass(): string {
    switch (this.status) {
      case 'pending': return 'badge-warning';
      case 'confirmed': return 'badge-info';
      case 'preparing': return 'badge-info';
      case 'ready_for_pickup': return 'badge-primary';
      case 'delivering': return 'badge-primary';
      case 'delivered': return 'badge-success';
      case 'cancelled': return 'badge-danger';
      default: return 'badge-outline';
    }
  }

  getStatusLabel(): string {
    switch (this.status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmada';
      case 'preparing': return 'Em Preparação';
      case 'ready_for_pickup': return 'Pronta a Levantar';
      case 'delivering': return 'Em Entrega';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelada';
      default: return this.status;
    }
  }
}
