import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupermarketService } from '../../core/services/supermarket.service';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-supermarkets',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, StarRatingComponent],
  templateUrl: './supermarkets.component.html',
  styleUrl: './supermarkets.component.css'})
export class SupermarketsComponent implements OnInit {
  supermarkets: any[] = [];
  loading = true;
  
  filters = {
    name: '',
    openNow: '',
    sort: 'relevance'
  };

  constructor(private supermarketService: SupermarketService) {}

  ngOnInit() {
    this.loadSupermarkets();
  }

  loadSupermarkets() {
    this.loading = true;
    this.supermarketService.getSupermarkets(this.filters).subscribe({
      next: (res) => {
        const list = res.supermarkets || [];
        this.supermarkets = list.map((s: any) => ({
          ...s,
          _formattedTime: `${this.formatTime(s.openingHour, s.openingMinute)} - ${this.formatTime(s.closingHour, s.closingMinute)}`
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  formatTime(hour: number, minute: number): string {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
}
