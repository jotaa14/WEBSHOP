import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  checkout(deliveryMethods: { [supermarketId: string]: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/checkout`, { deliveryMethods });
  }

  getOrders(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  getOrder(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getOrderStatus(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/status`);
  }

  cancelOrder(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/cancel`, {});
  }

  submitReview(id: string, reviewData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/review`, reviewData);
  }

  getReview(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/review`);
  }

  requestReturn(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/return`, data);
  }
}
