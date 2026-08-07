import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberService } from '../../service/memberService';
import {
  MemberSubscription,
  SubscriptionStatus,
} from '../../model/class/MemberSubscription';
import { Member } from '../../model/class/Member';
import { ApiResponse } from '@/app/service/genericService';
import { RouterLink } from '@angular/router';
import { UbButtonDirective } from '@/app/components/ui/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, UbButtonDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private readonly memberService = inject(MemberService);

  private readonly subscriptionsSignal = signal<MemberSubscription[]>([]);
  private readonly membersSignal = signal<Member[]>([]);
  readonly isLoading = signal(true);

  readonly totalSubscriptions = computed(() => this.subscriptionsSignal().length);

  readonly activeSubscriptions = computed(() =>
    this.subscriptionsSignal().filter((item) => this.isActiveSubscription(item))
      .length
  );

  readonly expiredSubscriptions = computed(() =>
    this.subscriptionsSignal().filter((item) => this.isExpiredSubscription(item))
      .length
  );

  readonly totalMembers = computed(() => this.membersSignal().length);

  readonly recentSubscriptions = computed(() =>
    [...this.subscriptionsSignal()]
      .sort((a, b) => {
        const dateA = new Date(a.startDate || 0).getTime();
        const dateB = new Date(b.startDate || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 6)
  );

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading.set(true);
    let subscriptionsDone = false;
    let membersDone = false;

    const finish = () => {
      if (subscriptionsDone && membersDone) {
        this.isLoading.set(false);
      }
    };

    this.memberService.getAllMemberSubscriptions().subscribe({
      next: (res: ApiResponse<MemberSubscription[]>) => {
        const list = (res?.data ?? []).map(
          (item) => new MemberSubscription(item)
        );
        this.subscriptionsSignal.set(list);
        subscriptionsDone = true;
        finish();
      },
      error: () => {
        this.subscriptionsSignal.set([]);
        subscriptionsDone = true;
        finish();
      },
    });

    this.memberService.getTopTenMembers().subscribe({
      next: (res: ApiResponse<Member[]>) => {
        this.membersSignal.set(res?.data ?? []);
        membersDone = true;
        finish();
      },
      error: () => {
        this.membersSignal.set([]);
        membersDone = true;
        finish();
      },
    });
  }

  memberDisplayName(subscription: MemberSubscription): string {
    return subscription.member?.fullName || 'مشترك بدون اسم';
  }

  statusLabel(subscription: MemberSubscription): string {
    if (this.isExpiredSubscription(subscription)) {
      return 'منتهي';
    }
    if (subscription.status === SubscriptionStatus.Pending) {
      return 'قيد الانتظار';
    }
    if (subscription.status === SubscriptionStatus.Suspended) {
      return 'موقوف';
    }
    if (this.isActiveSubscription(subscription)) {
      return 'نشط';
    }
    return 'غير محدد';
  }

  private isActiveSubscription(subscription: MemberSubscription): boolean {
    if (subscription.status === SubscriptionStatus.Active) {
      return !this.hasEnded(subscription.endDate);
    }
    if (subscription.status === SubscriptionStatus.Expired) {
      return false;
    }
    // Fallback: treat non-expired by endDate as active when status missing
    return (
      !!subscription.endDate &&
      !this.hasEnded(subscription.endDate) &&
      subscription.status !== SubscriptionStatus.Suspended &&
      subscription.status !== SubscriptionStatus.Pending
    );
  }

  private isExpiredSubscription(subscription: MemberSubscription): boolean {
    if (subscription.status === SubscriptionStatus.Expired) {
      return true;
    }
    return this.hasEnded(subscription.endDate);
  }

  private hasEnded(endDate: string | null | undefined): boolean {
    if (!endDate) {
      return false;
    }
    const end = new Date(endDate);
    if (Number.isNaN(end.getTime())) {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return end < today;
  }
}
