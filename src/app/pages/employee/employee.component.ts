import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MasterService } from '../../service/master.service';
import { MemberService } from '../../service/memberService';
import { Employee } from '../../model/class/Employee';
import { Member, MemberType } from '../../model/class/Member';
import { CommonModule } from '@angular/common';
import { UbButtonDirective } from '@/app/components/ui/button';
import { ToastService } from '@/app/components/ui/toast.service';
import { ApiResponse } from '@/app/service/genericService';

export enum SubscriptionType {
  Vip = 'vip',
  Regular = 'regular',
  Staff = 'staff',
}

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UbButtonDirective],
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.css'],
})
export class EmployeeComponent implements OnInit {
  // employeeForm: FormGroup;
  memberForm: FormGroup;


  private readonly membersSignal = signal<Member[]>([]);
  readonly members = this.membersSignal.asReadonly();
  readonly subscriptionTypes = Object.values(SubscriptionType) as SubscriptionType[];

  readonly filteredMembers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.members();
    }
    return this.members().filter(
      (employee) =>
        employee.fullName?.toLowerCase().includes(term) ||
        employee.phone?.toLowerCase().includes(term) ||
        employee.email?.toString().includes(term)
    );
  });

  readonly searchTerm = signal<string>('');
  expandedEmployeeId: number | null = null;
  editingEmployeeId: number | null = null;
  showCreatePanel = false;
  pendingDelete: Member | null = null;
  isSaving = false;
  isDeleting = false;

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private memberService: MemberService,
    private toast: ToastService
  ) {
    this.memberForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', Validators.email],
      phoneNumber: ['', Validators.required],
      address: [''],
      membershipType: [''],
      code: [''],
      nationalId: [''],
      birthDate: [''],
      
    });
  }

  ngOnInit(): void {
    this.getMembers();
  }

  getMembers() {
    this.memberService.getTopTenMembers().subscribe((res: ApiResponse<Member[]>) => {
      const members = res?.data ?? [];
      this.membersSignal.set(members);
      if (!this.expandedEmployeeId && members.length) {
        this.expandedEmployeeId = members[0].id ?? null;
      }
    });
  }

  toggleExpand(employeeId: number | null | undefined) {
    const targetId = employeeId ?? null;
    this.expandedEmployeeId =
      this.expandedEmployeeId === targetId ? null : targetId;
    if (this.expandedEmployeeId !== this.editingEmployeeId) {
      this.cancelEdit();
    }
  }

  startCreate() {
    this.isSaving = false;
    this.showCreatePanel = true;
    this.editingEmployeeId = null;
    this.expandedEmployeeId = null;
    this.memberForm.reset({
      employeeId: null,
      employeeName: '',
      department: '',
      deptId: null,
      role: '',
      title: '',
      employmentType: '',
      contactNo: '',
      emailId: '',
      location: '',
      timezone: '',
      hireDate: '',
      skills: '',
      tags: '',
    });
  }

  closeCreatePanel() {
    this.isSaving = false;
    this.showCreatePanel = false;
  }

  onEdit(member: Member) {
    this.showCreatePanel = false;
    // this.editingEmployeeId = employee.employeeId ?? null;
    // this.expandedEmployeeId = employee.employeeId ?? null;
    // // Format hireDate for date input (YYYY-MM-DD)
    // const formatDateForInput = (dateStr: string | null | undefined): string => {
    //   if (!dateStr) return '';
    //   try {
    //     const date = new Date(dateStr);
    //     if (isNaN(date.getTime())) return '';
    //     return date.toISOString().split('T')[0];
    //   } catch {
    //     return '';
    //   }
    // };

    // this.memberForm.patchValue({
    //   employeeId: employee.employeeId ?? null,
    //   employeeName: employee.employeeName ?? '',
    //   department: employee.department ?? '',
    //   deptId: employee.deptId ?? null,
    //   role: employee.role ?? '',
    //   title: employee.title ?? '',
    //   employmentType: employee.employmentType ?? '',
    //   contactNo: employee.contactNo ?? '',
    //   emailId: employee.emailId ?? '',
    //   location: employee.location ?? '',
    //   timezone: employee.timezone ?? '',
    //   hireDate: formatDateForInput(employee.hireDate),
    //   skills: Array.isArray(employee.skills) ? employee.skills.join(', ') : '',
    //   tags: Array.isArray(employee.tags) ? employee.tags.join(', ') : '',
    // });
  }

  cancelEdit() {
    this.isSaving = false;
    this.editingEmployeeId = null;
    this.memberForm.reset({
      employeeId: null,
      employeeName: '',
      department: '',
      deptId: null,
      role: '',
      title: '',
      employmentType: '',
      contactNo: '',
      emailId: '',
      location: '',
      timezone: '',
      hireDate: '',
      skills: '',
      tags: '',
    });
  }

  promptDelete(member: Member) {
    this.pendingDelete = member;
  }

  confirmDelete(confirmed: boolean) {
    if (!confirmed || !this.pendingDelete?.id) {
      this.pendingDelete = null;
      return;
    }
    // const { employeeId, employeeName } = this.pendingDelete;
    // this.isDeleting = true;
    // this.masterService.deleteEmpById(employeeId).subscribe(
    //   () => {
    //     this.isDeleting = false;
    //     this.pendingDelete = null;
    //     this.employeesSignal.update((list) =>
    //       list.filter((emp) => emp.employeeId !== employeeId)
    //     );
    //     this.toast.success({
    //       title: 'Employee removed',
    //       description: `${employeeName} has been deleted.`,
    //     });
    //     if (this.expandedEmployeeId === employeeId) {
    //       this.expandedEmployeeId = null;
    //     }
    //   },
    //   () => {
    //     this.isDeleting = false;
    //     this.toast.error({
    //       title: 'Deletion failed',
    //       description: 'Unable to delete the employee right now.',
    //     });
    //   }
    // );
  }

  // onSave() {
  //   if (this.memberForm.valid && !this.isSaving) {
  //     const employee = this.normalizePayload(this.memberForm.value);
  //     this.isSaving = true;
  //     if (employee.employeeId) {
  //       // Update existing employee
  //       this.masterService.updateEmp(employee).subscribe(
  //         () => {
  //           this.isSaving = false;
  //           this.getEmployees();
  //           this.memberForm.reset();
  //           this.toast.success({
  //             title: 'Employee updated',
  //             description: 'Employee details were saved successfully.',
  //           });
  //           this.editingEmployeeId = null;
  //         },
  //         () => {
  //           this.isSaving = false;
  //           this.toast.error({
  //             title: 'Update failed',
  //             description: 'Something went wrong while saving changes.',
  //           });
  //         }
  //       );
  //     } else {
  //       // Create new employee
  //       this.masterService.saveEmp(employee).subscribe(
  //         () => {
  //           this.isSaving = false;
  //           this.getEmployees();
  //           this.memberForm.reset();
  //           this.toast.success({
  //             title: 'Employee created',
  //             description: 'A new employee record is now available.',
  //           });
  //           this.showCreatePanel = false;
  //         },
  //         () => {
  //           this.isSaving = false;
  //           this.toast.error({
  //             title: 'Creation failed',
  //             description: 'Unable to save the new employee.',
  //           });
  //         }
  //       );
  //     }
  //   }
  // }

  updateSearch(term: string) {
    this.searchTerm.set(term);
  }

  private normalizePayload(raw: any): Employee {
    const parseCsv = (value: unknown) => {
      if (typeof value !== 'string') {
        return [];
      }
      return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    };

    // Convert date input (YYYY-MM-DD) to ISO string or keep as is
    const normalizeDate = (
      dateValue: string | null | undefined
    ): string | null => {
      if (!dateValue || typeof dateValue !== 'string') return null;
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return null;
        return date.toISOString();
      } catch {
        return null;
      }
    };

    return {
      employeeId: raw.employeeId ?? null,
      employeeName: raw.employeeName ?? '',
      department: raw.department ?? '',
      deptId:
        raw.deptId !== null && raw.deptId !== undefined && raw.deptId !== ''
          ? Number(raw.deptId)
          : null,
      role: raw.role ?? '',
      title: raw.title ?? '',
      employmentType: raw.employmentType ?? '',
      contactNo: raw.contactNo ?? '',
      emailId: raw.emailId ?? '',
      location: raw.location ?? '',
      timezone: raw.timezone ?? '',
      hireDate: normalizeDate(raw.hireDate),
      skills: parseCsv(raw.skills),
      tags: parseCsv(raw.tags),
    } as Employee;
  }

  saveMember() {
    if (this.memberForm.valid && !this.isSaving) {
      const member = this.buildMemberPayload();
      this.isSaving = true;

      this.memberService.createMember(member).subscribe(
        () => {
          this.isSaving = false;
          this.toast.success({
            title: 'Member created',
            description: 'The new member has been saved successfully.',
          });
          this.memberForm.reset();
          this.showCreatePanel = false;
        },
        () => {
          this.isSaving = false;
          this.toast.error({
            title: 'Save failed',
            description: 'Unable to save the member at this time.',
          });
        }
      );
    }
  }

  private buildMemberPayload(): Member {
    const formValue = this.memberForm.value;
    return new Member({
      fullName: formValue.fullName ?? '',
      email: formValue.email ?? '',
      phone: formValue.phoneNumber ?? '',
      memberType:
        (formValue.membershipType as MemberType) ?? MemberType.Regular,
      address: formValue.address ?? '',
    });
  }
}
