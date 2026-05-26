import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;
  
  private cartCountSubject = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.refreshCartCount();
  }

  getCart(): Observable<any> {
    return this.http.get<any>(this.apiUrl).pipe(
      tap(res => this.cartCountSubject.next(res.cartCount || 0))
    );
  }

  addToCart(productId: string, quantity: number = 1): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/add`, { productId, quantity }).pipe(
      tap(res => this.cartCountSubject.next(res.cartCount || 0))
    );
  }

  updateQuantity(productId: string, quantity: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update`, { productId, quantity }).pipe(
      tap(res => this.cartCountSubject.next(res.cartCount || 0))
    );
  }

  removeItem(productId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/remove/${productId}`).pipe(
      tap(res => this.cartCountSubject.next(res.cartCount || 0))
    );
  }

  clearCart(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/clear`).pipe(
      tap(() => this.cartCountSubject.next(0))
    );
  }

  refreshCartCount() {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.http.get<any>(this.apiUrl).subscribe(res => {
      if (res && res.cartCount !== undefined) {
        this.cartCountSubject.next(res.cartCount);
      }
    });
  }
}
