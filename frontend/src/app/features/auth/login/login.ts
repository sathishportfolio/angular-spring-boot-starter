import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})

export class Login {

  private apiService = inject(ApiService);

  // private cdr = inject(ChangeDetectorRef);

  response = signal('Loading...');

  ngOnInit() {
    this.apiService.getHome().subscribe({
      next: (data) => {
        this.response.set(data);

      },
      error: (err) => {
        console.error(err);
        this.response.set('Backend not reachable');
      }
    });
  }

}