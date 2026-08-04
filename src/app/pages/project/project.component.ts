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
import { IProject } from '../../model/interface/master';
import { MasterService } from '../../service/master.service';
import { MemberService } from '../../service/memberService';
import { Member } from '../../model/class/Member';
import { MemberSubscription } from '../../model/class/MemberSubscription';
import { DatePipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastService } from '@/app/components/ui/toast.service';
import { UbButtonDirective } from '@/app/components/ui/button';
import { ApiResponse } from '@/app/service/genericService';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UbButtonDirective, RouterLink],
  providers: [DatePipe],
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css'], // Corrected from styleUrl to styleUrls
})
export class ProjectComponent implements OnInit {
  protected readonly routerLinkDirective = RouterLink;
  private readonly masterSrv = inject(MasterService);
  private readonly memberService = inject(MemberService);
  private readonly datePipe = inject(DatePipe);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  private readonly projectsSignal = signal<IProject[]>([]);
  readonly projects = this.projectsSignal.asReadonly();
  private readonly membersSignal = signal<Member[]>([]);
  readonly members = this.membersSignal.asReadonly();
  readonly searchTerm = signal<string>('');
  readonly memberDropdownOpen = signal(false);
  readonly filteredProjects = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.projects();
    }
    return this.projects().filter((project) => {
      return (
        project.projectName?.toLowerCase().includes(term) ||
        project.clientName?.toLowerCase().includes(term) ||
        project.contactPerson?.toLowerCase().includes(term) ||
        project.startDate?.toLowerCase().includes(term)
      );
    });
  });

  get selectedMemberLabel(): string {
    const value = this.subscriptionForm.get('memberName')?.value;
    return value ? String(value) : '';
  }

  /** Form group for member subscription renewal */
  subscriptionForm: FormGroup = this.fb.group({
    id: [null],
    memberId: [null, Validators.required],
    memberName: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: [''],
    sessionsCount: [null],
    notes: [''],
  });

  /** Keep alias so existing template bindings to projectForm still work during rename */
  get projectForm(): FormGroup {
    return this.subscriptionForm;
  }

  expandedProjectId: number | null = null;
  editingProjectId: number | null = null;
  showCreatePanel = false;
  pendingDelete: IProject | null = null;
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
    this.getProjects();
    this.getMembers();
  }

  getProjects() {
    this.masterSrv.getAllProjects().subscribe((Res: IProject[]) => {
      this.projectsSignal.set(Res ?? []);
      if (!this.expandedProjectId && Res?.length) {
        this.expandedProjectId = Res[0].projectId ?? null;
      }
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
    const project = this.projects().find((p) => p.projectId === id);
    if (!project) {
      return;
    }
    this.memberDropdownOpen.set(false);
    this.showCreatePanel = false;
    this.editingProjectId = id;
    this.expandedProjectId = id;

    const matchedMember = this.members().find(
      (member) =>
        member.fullName === project.projectName ||
        member.fullName === project.clientName
    );

    this.subscriptionForm.patchValue({
      id: project.projectId ?? null,
      memberId: matchedMember?.id ?? null,
      memberName: project.projectName || project.clientName || '',
      startDate: project.startDate ? project.startDate.substring(0, 10) : '',
      endDate: project.endDate ? project.endDate.substring(0, 10) : '',
      sessionsCount: project.sessionsCount ?? null,
      notes: project.contactNotes ?? '',
    });
  }

  onDelete(id: number) {
    const project = this.projects().find((p) => p.projectId === id);
    if (!project) return;
    this.pendingDelete = project;
  }

  confirmDelete(confirmed: boolean) {
    if (!confirmed || !this.pendingDelete?.projectId) {
      this.pendingDelete = null;
      return;
    }
    const { projectId, projectName } = this.pendingDelete;
    this.isDeleting = true;
    this.masterSrv.deleteProjectById(projectId).subscribe(
      () => {
        this.isDeleting = false;
        this.pendingDelete = null;
        this.projectsSignal.update((list) =>
          list.filter((project) => project.projectId !== projectId)
        );
        this.toast.success({
          title: 'Project deleted',
          description: `${projectName} has been removed.`,
        });
        if (this.expandedProjectId === projectId) {
          this.expandedProjectId = null;
        }
      },
      () => {
        this.isDeleting = false;
        this.toast.error({
          title: 'Delete failed',
          description: 'Something went wrong while removing the project.',
        });
      }
    );
  }

  toggleExpand(projectId: number | null | undefined) {
    const target = projectId ?? null;
    this.expandedProjectId = this.expandedProjectId === target ? null : target;
    if (this.expandedProjectId !== this.editingProjectId) {
      this.cancelEdit();
    }
  }

  startCreate() {
    this.isSaving = false;
    this.memberDropdownOpen.set(false);
    this.showCreatePanel = true;
    this.editingProjectId = null;
    this.expandedProjectId = null;
    const today = new Date().toISOString().substring(0, 10);
    this.subscriptionForm.reset({
      id: null,
      memberId: null,
      memberName: '',
      startDate: today,
      endDate: '',
      sessionsCount: null,
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
    this.editingProjectId = null;
    this.subscriptionForm.reset({
      id: null,
      memberId: null,
      memberName: '',
      startDate: '',
      endDate: '',
      sessionsCount: null,
      notes: '',
    });
  }

  updateSearch(term: string) {
    this.searchTerm.set(term);
  }

  /** Build MemberSubscription from the subscription form group */
  private buildMemberSubscription(): MemberSubscription {
    const formValue = this.subscriptionForm.getRawValue();
    return new MemberSubscription({
      id: formValue.id ?? 0,
      memberId: Number(formValue.memberId),
      memberName: formValue.memberName ?? '',
      startDate: formValue.startDate ?? '',
      endDate: formValue.endDate ?? '',
      sessionsCount:
        formValue.sessionsCount === null || formValue.sessionsCount === ''
          ? null
          : Number(formValue.sessionsCount),
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
            this.getProjects();
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
          this.getProjects();
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
}
