import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'})
export class ProfileComponent implements OnInit {
  user: any;
  districts: string[] = [];
  
  profileForm: FormGroup;
  profileSuccess = false;
  profileError = '';
  profileLoading = false;
  
  passwordForm: FormGroup;
  pwdSuccess = false;
  pwdError = '';
  pwdLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      district: ['', Validators.required]
    });
    
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmNewPassword: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.authService.getDistricts().subscribe(res => {
      this.districts = res.districts || [];
    });
    
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        this.profileForm.patchValue({
          name: user.name,
          phone: user.phone,
          address: user.address,
          city: user.city,
          district: user.district
        });
      }
    });
  }

  onUpdateProfile() {
    if (this.profileForm.invalid) return;
    this.profileLoading = true;
    this.profileSuccess = false;
    this.profileError = '';
    
    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.profileSuccess = true;
        this.profileLoading = false;
        setTimeout(() => this.profileSuccess = false, 3000);
      },
      error: (err) => {
        this.profileError = err.error?.error || 'Erro ao atualizar perfil.';
        this.profileLoading = false;
      }
    });
  }
  
  onChangePassword() {
    if (this.passwordForm.invalid) return;
    if (this.passwordForm.value.newPassword !== this.passwordForm.value.confirmNewPassword) {
      this.pwdError = 'As novas passwords não coincidem.';
      return;
    }
    
    this.pwdLoading = true;
    this.pwdSuccess = false;
    this.pwdError = '';
    
    this.authService.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.pwdSuccess = true;
        this.pwdLoading = false;
        this.passwordForm.reset();
        setTimeout(() => this.pwdSuccess = false, 3000);
      },
      error: (err) => {
        this.pwdError = err.error?.error || 'Erro ao alterar password.';
        this.pwdLoading = false;
      }
    });
  }
}
