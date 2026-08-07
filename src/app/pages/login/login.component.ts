import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FloatingBackgroundComponent } from '@/app/components/ui/floating-background.component';
import { UbButtonDirective } from '@/app/components/ui/button';
import { environment } from '@/environments/environment';
import { ToastService } from '@/app/components/ui/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FloatingBackgroundComponent,
    UbButtonDirective,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginObj: any = {
    username: '',
    password: '',
  };
  selectedTestAccount: string = '';
  private readonly demoCredentials = environment.demoLogin;
  private readonly toast = inject(ToastService);

  readonly testAccounts = {
    admin: {
      username: this.demoCredentials.username,
      password: this.demoCredentials.password,
      label: 'حساب المدير',
    },
  };

  readonly featureHighlights = [
    {
      title: 'إدارة المشتركين',
      description: 'سجل الأعضاء، الباركود، والاشتراكات في مكان واحد.',
    },
    {
      title: 'تسجيل الحضور',
      description: 'مسح QR سريع لتأكيد حضور المتدربين داخل الصالة.',
    },
    {
      title: 'متابعة الاشتراكات',
      description: 'تواريخ البداية والنهاية والمبالغ وطرق الدفع بوضوح.',
    },
  ];

  router = inject(Router);

  onTestAccountSelect(value: string): void {
    if (value === 'clear') {
      this.selectedTestAccount = '';
      this.loginObj.username = '';
      this.loginObj.password = '';
    } else {
      this.selectedTestAccount = value;
      const account = this.testAccounts[value as keyof typeof this.testAccounts];
      if (account) {
        this.loginObj.username = account.username;
        this.loginObj.password = account.password;
      }
    }
  }

  onLogin() {
    if (
      this.loginObj.username === this.demoCredentials.username &&
      this.loginObj.password === this.demoCredentials.password
    ) {
      this.router.navigateByUrl('dashboard');
      this.toast.success({
        title: 'أهلاً بعودتك',
        description: 'تم تسجيل الدخول بنجاح.',
      });
    } else {
      this.toast.error({
        title: 'بيانات غير صحيحة',
        description: 'تحقق من اسم المستخدم وكلمة المرور.',
      });
    }
  }
}
