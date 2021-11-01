import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  email: string;
  password: string;
  disabled: boolean = false;
  spinner: boolean = false;

  constructor(private api: ApiService, private router: Router) { }

  ngOnInit() {
    this.email = '';
    this.password = '';
  }

  setSpinner() {
    this.spinner = true;
    this.disabled = true;
  }

  clearSpinner() {
    this.spinner = false;
    this.disabled = false;
  }

  login() {
    this.api.login(this.email, this.password).then(resp => {
      if (resp['id']) {
        this.router.navigate(['calendar']);
      } else {
        this.router.navigate(['register']);
      }
    });
  }

}
