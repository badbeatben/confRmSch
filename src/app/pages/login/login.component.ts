import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  
  form = new FormGroup({ 
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)])
  });

  constructor(private api: ApiService, private router: Router) { }

  ngOnInit() {
    
  }

  onSubmit(formData: any) {
    if (formData.valid) {
      this.api.login(this.form.value.email, this.form.value.password).then(resp => {
        if (resp['id']) {
          this.router.navigate(['calendar']);
        } else {
          this.router.navigate(['register']);
        }
      });
    }
    
  }

}
