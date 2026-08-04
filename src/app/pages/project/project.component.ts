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
    const value = this.projectForm.get('projectName')?.value;
    return value ? String(value) : '';
  }

  projectForm: FormGroup = this.fb.group({
    projectId: [null],
    projectName: ['', Validators.required],
    clientName: [''],
    startDate: ['', Validators.required],
    endDate: [''],
    sessionsCount: [null],
    leadByEmpId: [null],
    contactPerson: [''],
    contactNo: [''],
    contactNotes: [''],
    emailId: [''],
  });

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
    this.projectForm.patchValue({
      projectName: member.fullName,
      clientName: member.fullName,
    });
    this.projectForm.get('projectName')?.markAsDirty();
    this.projectForm.get('projectName')?.markAsTouched();
    this.memberDropdownOpen.set(false);
  }

  clearMember(event?: Event) {
    event?.stopPropagation();
    this.projectForm.patchValue({ projectName: '', clientName: '' });
    this.memberDropdownOpen.set(false);
  }

  adjustSessionsCount(delta: number) {
    const control = this.projectForm.get('sessionsCount');
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
    this.projectForm.patchValue({
      ...project,
      startDate: project.startDate ? project.startDate.substring(0, 10) : '',
      endDate: project.endDate ? project.endDate.substring(0, 10) : '',
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
    this.projectForm.reset({
      projectId: null,
      projectName: '',
      clientName: '',
      startDate: today,
      endDate: '',
      sessionsCount: null,
      leadByEmpId: null,
      contactPerson: '',
      contactNo: '',
      contactNotes: '',
      emailId: '',
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
    this.projectForm.reset({
      projectId: null,
      projectName: '',
      clientName: '',
      startDate: '',
      endDate: '',
      sessionsCount: null,
      leadByEmpId: null,
      contactPerson: '',
      contactNo: '',
      contactNotes: '',
      emailId: '',
    });
  }

  updateSearch(term: string) {
    this.searchTerm.set(term);
  }

  onSave() {
    if (this.projectForm.invalid) {
      this.toast.error({
        title: 'Incomplete details',
        description: 'Please fill all required fields before saving.',
      });
      return;
    }
    if (this.isSaving) {
      return;
    }
    const formValue = this.projectForm.value;
    const project: IProject = {
      ...formValue,
      clientName: formValue.clientName || formValue.projectName || '',
      startDate: formValue.startDate,
      endDate: formValue.endDate || undefined,
      sessionsCount:
        formValue.sessionsCount === null || formValue.sessionsCount === ''
          ? undefined
          : Number(formValue.sessionsCount),
      contactNotes: formValue.contactNotes || undefined,
    };
    this.isSaving = true;
    if (project.projectId) {
      this.masterSrv.updateProject(project).subscribe(
        () => {
          this.isSaving = false;
          this.getProjects();
          this.toast.success({
            title: 'Project updated',
            description: 'Changes have been saved successfully.',
          });
          this.cancelEdit();
        },
        () => {
          this.isSaving = false;
          this.toast.error({
            title: 'Update failed',
            description: 'Unable to update the project right now.',
          });
        }
      );
    } else {
      this.masterSrv.saveProject(project as any).subscribe(
        () => {
          this.isSaving = false;
          this.getProjects();
          this.toast.success({
            title: 'Project created',
            description: 'A new project is now tracked in the system.',
          });
          this.showCreatePanel = false;
          this.cancelEdit();
        },
        () => {
          this.isSaving = false;
          this.toast.error({
            title: 'Creation failed',
            description: 'Unable to create project right now.',
          });
        }
      );
    }
  }

  formattedDate(date: string | null | undefined) {
    if (!date) {
      return '—';
    }
    return this.datePipe.transform(date, 'MMM d, y') ?? date;
  }
}
