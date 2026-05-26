import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.css']
})
export class AccessDeniedComponent implements OnInit, OnDestroy {
  countdown = 8;
  private timer: any;
  redirectUrl = 'http://localhost:3000/login';

  constructor(private router: Router) {}

  ngOnInit() {
    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.timer);
        window.location.href = this.redirectUrl;
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  goToBackend() {
    window.location.href = this.redirectUrl;
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}
