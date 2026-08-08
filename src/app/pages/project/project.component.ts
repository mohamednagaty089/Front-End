import {
  Component,
  OnInit,
  computed,
  signal,
  inject,
  HostListener,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MemberService } from '../../service/memberService';
import { Member } from '../../model/class/Member';
import {
  MemberSubscription,
  PaymentMethod,
  SubscriptionStatus,
} from '../../model/class/MemberSubscription';
import { DatePipe, CommonModule } from '@angular/common';
import { ToastService } from '@/app/components/ui/toast.service';
import { UbButtonDirective } from '@/app/components/ui/button';
import { ApiResponse } from '@/app/service/genericService';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UbButtonDirective],
  providers: [DatePipe],
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css'],
})
export class ProjectComponent implements OnInit {
  private readonly memberService = inject(MemberService);
  private readonly datePipe = inject(DatePipe);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  private readonly subscriptionsSignal = signal<MemberSubscription[]>([]);
  readonly subscriptions = this.subscriptionsSignal.asReadonly();
  private readonly membersSignal = signal<Member[]>([]);
  readonly members = this.membersSignal.asReadonly();
  readonly searchTerm = signal<string>('');
  readonly memberDropdownOpen = signal(false);

  readonly subscriptionStatuses = [
    { value: SubscriptionStatus.Active, label: 'نشط' },
    { value: SubscriptionStatus.Pending, label: 'قيد الانتظار' },
    { value: SubscriptionStatus.Expired, label: 'منتهي' },
    { value: SubscriptionStatus.Suspended, label: 'موقوف' },
  ];

  readonly paymentMethods = [
    { value: PaymentMethod.Cash, label: 'كاش' },
    { value: PaymentMethod.InstaPay, label: 'إنستا باي' },
    { value: PaymentMethod.Visa, label: 'فيزا' },
    { value: PaymentMethod.VodafoneCash, label: 'فودافون كاش' },
    { value: PaymentMethod.BankTransfer, label: 'تحويل بنكي' },
  ];

  readonly filteredSubscriptions = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.subscriptions();
    }
    return this.subscriptions().filter((subscription) => {
      return (
        subscription.member?.fullName?.toLowerCase().includes(term) ||
        subscription.startDate?.toLowerCase().includes(term) ||
        subscription.endDate?.toLowerCase().includes(term) ||
        subscription.notes?.toLowerCase().includes(term) ||
        subscription.status?.toLowerCase().includes(term) ||
        subscription.paymentMethod?.toLowerCase().includes(term) ||
        String(subscription.sessionsCount ?? '').includes(term)
      );
    });
  });

  get selectedMemberLabel(): string {
    const value = this.subscriptionForm.get('memberName')?.value;
    return value ? String(value) : '';
  }

  subscriptionForm: FormGroup = this.fb.group({
    id: [null],
    memberId: [null, Validators.required],
    memberName: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: [''],
    sessionsCount: [null],
    status: [SubscriptionStatus.Active, Validators.required],
    paymentMethod: [PaymentMethod.Cash, Validators.required],
    amount: [null],
    notes: [''],
  });

  expandedSubscriptionId: number | null = null;
  editingSubscriptionId: number | null = null;
  showCreatePanel = false;
  pendingDelete: MemberSubscription | null = null;
  isSaving = false;
  isDeleting = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.member-dropdown')) {
      this.memberDropdownOpen.set(false);
    }
  }

  ngOnInit(): void {
    this.getSubscriptions();
    this.getMembers();
  }

  getSubscriptions() {
    this.memberService.getAllMemberSubscriptions().subscribe({
      next: (res: ApiResponse<MemberSubscription[]>) => {
        const list = (res?.data ?? []).map(
          (item) => new MemberSubscription(item)
        );
        this.subscriptionsSignal.set(list);
        if (!this.expandedSubscriptionId && list.length) {
          this.expandedSubscriptionId = list[0].id ?? null;
        }
      },
      error: () => {
        this.subscriptionsSignal.set([]);
        this.toast.error({
          title: 'تعذر التحميل',
          description: 'تعذر تحميل الاشتراكات حالياً.',
        });
      },
    });
  }

  getMembers() {
    this.memberService.getTopTenMembers().subscribe((res: ApiResponse<Member[]>) => {
      this.membersSignal.set(res?.data ?? []);
    });
  }

  toggleMemberDropdown(event?: Event) {
    event?.stopPropagation();
    this.memberDropdownOpen.update((open) => !open);
  }

  selectMember(member: Member) {
    this.subscriptionForm.patchValue({
      memberId: member.id,
      memberName: member.fullName,
    });
    this.subscriptionForm.get('memberId')?.markAsDirty();
    this.subscriptionForm.get('memberId')?.markAsTouched();
    this.subscriptionForm.get('memberName')?.markAsDirty();
    this.subscriptionForm.get('memberName')?.markAsTouched();
    this.memberDropdownOpen.set(false);
  }

  clearMember(event?: Event) {
    event?.stopPropagation();
    this.subscriptionForm.patchValue({ memberId: null, memberName: '' });
    this.memberDropdownOpen.set(false);
  }

  adjustSessionsCount(delta: number) {
    const control = this.subscriptionForm.get('sessionsCount');
    const current = Number(control?.value ?? 0);
    const next = Math.max(0, (Number.isFinite(current) ? current : 0) + delta);
    control?.setValue(next);
    control?.markAsDirty();
    control?.markAsTouched();
  }

  onEdit(id: number) {
    const subscription = this.subscriptions().find((item) => item.id === id);
    if (!subscription) {
      return;
    }
    this.memberDropdownOpen.set(false);
    this.showCreatePanel = false;
    this.editingSubscriptionId = id;
    this.expandedSubscriptionId = id;

    this.subscriptionForm.patchValue({
      id: subscription.id ?? null,
      member:subscription.member,
      startDate: subscription.startDate
        ? String(subscription.startDate).substring(0, 10)
        : '',
      endDate: subscription.endDate
        ? String(subscription.endDate).substring(0, 10)
        : '',
      sessionsCount: subscription.sessionsCount ?? null,
      status: subscription.status ?? SubscriptionStatus.Active,
      paymentMethod: subscription.paymentMethod ?? PaymentMethod.Cash,
      amount: subscription.amount ?? null,
      notes: subscription.notes ?? '',
    });
  }

  onDelete(id: number) {
    const subscription = this.subscriptions().find((item) => item.id === id);
    if (!subscription) return;
    this.pendingDelete = subscription;
  }

  confirmDelete(confirmed: boolean) {
    if (!confirmed || !this.pendingDelete?.id) {
      this.pendingDelete = null;
      return;
    }
    const { id, member } = this.pendingDelete;
    this.isDeleting = true;
    this.memberService.deleteMemberSubscription(id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.pendingDelete = null;
        this.subscriptionsSignal.update((list) =>
          list.filter((item) => item.id !== id)
        );
        this.toast.success({
          title: 'تم الحذف',
          description: `تم حذف اشتراك ${member?.fullName} بنجاح.`,
        });
        if (this.expandedSubscriptionId === id) {
          this.expandedSubscriptionId = null;
        }
        if (this.editingSubscriptionId === id) {
          this.cancelEdit();
        }
      },
      error: () => {
        this.isDeleting = false;
        this.toast.error({
          title: 'فشل الحذف',
          description: 'تعذر حذف الاشتراك حالياً.',
        });
      },
    });
  }

  toggleExpand(subscriptionId: number | null | undefined) {
    const target = subscriptionId ?? null;
    this.expandedSubscriptionId =
      this.expandedSubscriptionId === target ? null : target;
    if (this.expandedSubscriptionId !== this.editingSubscriptionId) {
      this.cancelEdit();
    }
  }

  startCreate() {
    this.isSaving = false;
    this.memberDropdownOpen.set(false);
    this.showCreatePanel = true;
    this.editingSubscriptionId = null;
    this.expandedSubscriptionId = null;
    const today = new Date().toISOString().substring(0, 10);
    this.subscriptionForm.reset({
      id: null,
      memberId: null,
      memberName: '',
      startDate: today,
      endDate: '',
      sessionsCount: null,
      status: SubscriptionStatus.Active,
      paymentMethod: PaymentMethod.Cash,
      amount: null,
      notes: '',
    });
  }

  closeCreatePanel() {
    this.isSaving = false;
    this.memberDropdownOpen.set(false);
    this.showCreatePanel = false;
  }

  cancelEdit() {
    this.isSaving = false;
    this.memberDropdownOpen.set(false);
    this.editingSubscriptionId = null;
    this.subscriptionForm.reset({
      id: null,
      memberId: null,
      memberName: '',
      startDate: '',
      endDate: '',
      sessionsCount: null,
      status: SubscriptionStatus.Active,
      paymentMethod: PaymentMethod.Cash,
      amount: null,
      notes: '',
    });
  }

  updateSearch(term: string) {
    this.searchTerm.set(term);
  }

  private buildMemberSubscription(): MemberSubscription {
    const formValue = this.subscriptionForm.getRawValue();
    return new MemberSubscription({
      id: formValue.id ?? undefined,
      member:{
        id: Number(formValue.memberId), fullName: formValue.memberName ?? '',
        phone: '',
        email: '',
        memberType: undefined,
        address: '',
        nationalId: '',
        joinDate: undefined,
        code: ''
      },
      startDate: formValue.startDate ?? '',
      endDate: formValue.endDate ?? '',
      sessionsCount:
        formValue.sessionsCount === null || formValue.sessionsCount === ''
          ? null
          : Number(formValue.sessionsCount),
      status: formValue.status ?? SubscriptionStatus.Active,
      paymentMethod: formValue.paymentMethod ?? PaymentMethod.Cash,
      amount:
        formValue.amount === null || formValue.amount === ''
          ? null
          : Number(formValue.amount),
      notes: formValue.notes ?? '',
    });
  }

  onSave() {
    if (this.subscriptionForm.invalid) {
      this.subscriptionForm.markAllAsTouched();
      this.toast.error({
        title: 'بيانات غير مكتملة',
        description: 'يرجى تعبئة الحقول المطلوبة قبل الحفظ.',
      });
      return;
    }
    if (this.isSaving) {
      return;
    }

    const subscription = this.buildMemberSubscription();
    this.isSaving = true;

    if (subscription.id) {
      this.memberService
        .updateMemberSubscription(subscription.id, subscription)
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.getSubscriptions();
            this.toast.success({
              title: 'تم التحديث',
              description: 'تم حفظ تعديلات الاشتراك بنجاح.',
            });
            this.cancelEdit();
          },
          error: () => {
            this.isSaving = false;
            this.toast.error({
              title: 'فشل التحديث',
              description: 'تعذر تحديث الاشتراك حالياً.',
            });
          },
        });
    } else {
      this.memberService.createMemberSubscription(subscription).subscribe({
        next: () => {
          this.isSaving = false;
          this.getSubscriptions();
          this.toast.success({
            title: 'تم الحفظ',
            description: 'تم تجديد الاشتراك بنجاح.',
          });
          this.showCreatePanel = false;
          this.cancelEdit();
        },
        error: () => {
          this.isSaving = false;
          this.toast.error({
            title: 'فشل الحفظ',
            description: 'تعذر حفظ الاشتراك حالياً.',
          });
        },
      });
    }
  }

  formattedDate(date: string | null | undefined) {
    if (!date) {
      return '—';
    }
    return this.datePipe.transform(date, 'MMM d, y') ?? date;
  }

  statusLabel(status: string | null | undefined) {
    return (
      this.subscriptionStatuses.find((item) => item.value === status)?.label ??
      status ??
      '—'
    );
  }

  paymentMethodLabel(method: string | null | undefined) {
    return (
      this.paymentMethods.find((item) => item.value === method)?.label ??
      method ??
      '—'
    );
  }

  formattedAmount(amount: number | null | undefined) {
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
      return '—';
    }
    return `${Number(amount).toLocaleString('ar-EG')} ج.م`;
  }
}
