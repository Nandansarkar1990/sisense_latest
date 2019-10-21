import { Component } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  containerId = 'sisenseApp';

  openDocumentation(): void {
    location.href = 'https://gitlab.com/SisenseJS/angular6-sample';
  }
}
