import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {

  form = new FormGroup({ 
    email: new FormControl('', [Validators.required, Validators.email])
  });

  constructor(private api: ApiService, private router: Router) { }

  ngOnInit() {
    this.api.authInfo$.subscribe(res => {
      if (res.isLoggedIn()) {
        this.router.navigate(['calendar']);
      }
    });
  }

  onSubmit(formData: any) {
    if (formData.valid) {
      this.api.forgotPassword(this.form.value.email).then(resp => {
        if (resp) {
          this.router.navigate(['login']);
        }
      });
    }
    
  }

}
