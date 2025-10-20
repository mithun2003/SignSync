import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { INavItem, NAV_LINKS } from './nav-links.data';
import {NgOptimizedImage} from '@angular/common';
import { CommonButtonComponent } from 'app/shared/components/common-button/common-button.component';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    NgOptimizedImage,
    CommonButtonComponent
  ],
  templateUrl: './navbar.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
    protected readonly navLinks: INavItem[] = NAV_LINKS;

  toggleSidenav() {
    const sidenav = document.querySelector('mat-sidenav') as any;
    if (sidenav) {
      sidenav.toggle();
    }
  }
}
