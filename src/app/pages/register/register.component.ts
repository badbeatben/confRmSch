import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from 'src/app/models/user';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  user: User = new User;

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    address: new FormControl(''),
    phone: new FormControl(''),
    city: new FormControl(''),
    state: new FormControl(''),
    zip: new FormControl('')
  });


  constructor(
    private api: ApiService, 
    private router: Router
  ) { }

  ngOnInit() {
    
  }

  onSubmit(formData: any) {
    if (formData.valid) {
      this.user.email = this.form.value.email;
      this.user.firstName = this.form.value.firstName;
      this.user.lastName = this.form.value.lastName;
      this.user.address = this.form.value.address;
      this.user.phone = this.form.value.phone;
      this.user.city = this.form.value.city;
      this.user.state = this.form.value.state;
      this.user.zip = this.form.value.zip;

      this.api.createAccount(formData.value.email, formData.value.password).then(resp => {
        if (resp) {
          this.user.id = resp.uid;
          this.api.addUser(this.user);
          this.router.navigate(['calendar']);
        }
      });
    }
  }

  checkIfEmailTaken(event: any){
    var email = event?.target.value
    this.api.checkIfEmailTaken(email).subscribe(res => {
      if (res.length > 0){
        this.form.controls['email'].setErrors({
          taken: true
        })
      }
    });
  }

  getEmailErrorMessage(): string {
    if(this.form.controls['email'].hasError('taken')){
      return 'Email already registered';
    }
    else if (this.form.controls['email'].hasError('required')) {
      return 'You must enter a value';
    }
    return this.form.controls['email'].hasError('email') ? 'Not a valid email' : '';
  }

  getPasswordErrorMessage() {
    if (this.form.controls['password'].hasError('required')) {
      return 'You must enter a value';
    }
    return 'Password must be at least 8 characters';
  }

}
