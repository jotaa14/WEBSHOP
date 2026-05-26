import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  districts: string[] = [];
  error: string = '';
  loading = false;
  currentYear = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      nif: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      district: ['', Validators.required],
      birthDay: ['', [Validators.required, Validators.min(1), Validators.max(31)]],
      birthMonth: ['', [Validators.required, Validators.min(1), Validators.max(12)]],
      birthYear: ['', [Validators.required, Validators.min(1900), Validators.max(this.currentYear)]]
    });
  }

  ngOnInit() {
    this.authService.getDistricts().subscribe({
      next: (res) => this.districts = res.districts
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    if (this.registerForm.value.password !== this.registerForm.value.confirmPassword) {
      this.error = 'As passwords não coincidem.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.error = err.error?.error || 'Erro ao registar conta.';
        this.loading = false;
      }
    });
  }
}
