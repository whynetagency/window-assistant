import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  constructor(
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe(p => {
      if(p?.manager) { localStorage.setItem('manager', p.manager) }
    });
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    document.body.classList.toggle('dark-theme', prefersDark.matches);
  }
}
