import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html',
  styleUrl: './star-rating.component.css'})
export class StarRatingComponent {
  @Input() rating: number = 0;
  @Input() readonly: boolean = true;
  @Input() showText: boolean = false;
  @Output() ratingChange = new EventEmitter<number>();

  stars = Array(5).fill(0);
  hoverRating: number = 0;

  get currentRating(): number {
    return this.hoverRating || this.rating;
  }

  rate(value: number) {
    if (!this.readonly) {
      this.rating = value;
      this.ratingChange.emit(this.rating);
    }
  }

  hover(value: number) {
    if (!this.readonly) {
      this.hoverRating = value;
    }
  }

  resetHover() {
    if (!this.readonly) {
      this.hoverRating = 0;
    }
  }
}
