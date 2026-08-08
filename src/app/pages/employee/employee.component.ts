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
      fullName: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          // Arabic letters only, must not start with a space or special character
          Validators.pattern(/^[\u0621-\u064A][\u0621-\u064A\s]*$/),
        ],
      ],
      email: ['', Validators.email],
      phoneNumber: [
        '',
        [Validators.required, Validators.pattern(/^01[0-9]{9}$/)],
      ],
      address: [''],
      membershipType: [''],
      code: [''],
      nationalId: ['', Validators.pattern(/^[0-9]{14}$/)],
      birthDate: [''],
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.memberForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  hasError(controlName: string, error: string): boolean {
    const control = this.memberForm.get(controlName);
    return (
      !!control &&
      control.hasError(error) &&
      (control.touched || control.dirty)
    );
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
    this.editingEmployeeId = member.id ?? null;
    this.expandedEmployeeId = member.id ?? null;
    // Format hireDate for date input (YYYY-MM-DD)
    const formatDateForInput = (dateStr: string | null | undefined): string => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      } catch {
        return '';
      }
    };

    this.memberForm.patchValue({
      id: member.id ?? null,
      fullName: member.fullName ?? '',
      email: member.email ?? '',
      phoneNumber: member.phone ?? null,
      membershipType: member.memberType ?? '',
      nationalId: member.nationalId ?? '',
      // employmentType: member.employmentType ?? '',
      // contactNo: member.contactNo ?? '',
      // emailId: member.emailId ?? '',
      // location: member.location ?? '',
      // timezone: employee.timezone ?? '',
      birthDate: formatDateForInput(member.birthDate?.toString()),
      // skills: Array.isArray(employee.skills) ? employee.skills.join(', ') : '',
      // tags: Array.isArray(employee.tags) ? employee.tags.join(', ') : '',
    });
  }

  cancelEdit() {
    this.isSaving = false;
    this.editingEmployeeId = null;
    this.memberForm.reset({
      id: null,
      fullName: '',
      email: '',
      phoneNumber: null,
      membershipType: '',
      nationalId: '',
      // employmentType: member.employmentType ?? '',
      // contactNo: member.contactNo ?? '',
      // emailId: member.emailId ?? '',
      // location: member.location ?? '',
      // timezone: employee.timezone ?? '',
      birthDate: '',
      // skills: Array.isArray(employee.skills) ? employee.skills.join(', ') : '',
      // tags: Array.isArray(employee.tags) ? employee.tags.join(', ') : '',
    });
  }
  

  promptDelete(member: Member) {
    this.pendingDelete = member as Member;
  }

  confirmDelete(confirmed: boolean) {
    if (!confirmed || !this.pendingDelete?.id) {
      this.pendingDelete = null;
      return;
    }
    const deletedMember = this.pendingDelete;
    if (!deletedMember?.id) {
      this.pendingDelete = null;
      return;
    }

    this.isDeleting = true;
    this.memberService.deleteMember(deletedMember.id).subscribe(
      () => {
        this.isDeleting = false;
        this.pendingDelete = null;
        this.membersSignal.update((list) =>
          list.filter((emp) => emp.id !== deletedMember.id)
        );
        this.toast.success({
          title: 'تم الحذف',
          message: `${deletedMember.fullName} تم حذفه بنجاح.`,
        });
        if (this.expandedEmployeeId === deletedMember.id) {
          this.expandedEmployeeId = null;
        }
      },
      () => {
        this.isDeleting = false;
        this.toast.error({
          title: 'فشل الحذف',
          message: 'تعذر حذف المشترك الآن.',
        });
      }
    );
  }

  updateMember(id:number) {
    if (this.memberForm.invalid) {
      this.memberForm.markAllAsTouched();
      this.toast.error({
        title: 'بيانات غير صالحة',
        message: 'يرجى تصحيح الحقول المميزة قبل الحفظ.',
      });
      return;
    }
    if (this.memberForm.valid && !this.isSaving) {
      const member = this.buildMemberPayload();
      this.isSaving = true;
      if (id) {
        // Update existing employee
        this.memberService.updateMember(id,member).subscribe(
          () => {
            this.isSaving = false;
            this.getMembers();
            this.memberForm.reset();
            this.toast.success({
              title: 'تم التحديث',
              message: 'تم حفظ بيانات العضو بنجاح.',
            });
            this.editingEmployeeId = null;
          },
          () => {
            this.isSaving = false;
            this.toast.error({
              title: 'فشل التحديث',
              message: 'حدثت مشكلة أثناء حفظ التغييرات.',
            });
          }
        );
      } 
      // else {
      //   // Create new employee
      //   this.masterService.saveEmp(employee).subscribe(
      //     () => {
      //       this.isSaving = false;
      //       this.getEmployees();
      //       this.memberForm.reset();
      //       this.toast.success({
      //         title: 'Employee created',
      //         description: 'A new employee record is now available.',
      //       });
      //       this.showCreatePanel = false;
      //     },
      //     () => {
      //       this.isSaving = false;
      //       this.toast.error({
      //         title: 'Creation failed',
      //         description: 'Unable to save the new employee.',
      //       });
      //     }
      //   );
      // }
    }
  }

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
    if (this.memberForm.invalid) {
      this.memberForm.markAllAsTouched();
      this.toast.error({
        title: 'بيانات غير صالحة',
        message: 'يرجى تصحيح الحقول المميزة قبل الحفظ.',
      });
      return;
    }
    if (this.memberForm.valid && !this.isSaving) {
      const member = this.buildMemberPayload();
      const barcodeId = `eeeee-33${member.memberType}`;
      member.barcodeId = barcodeId;
      this.isSaving = true;

      this.memberService.createMember(member).subscribe(
        (res) => {
          this.isSaving = false;
          this.getMembers();
          const successBarcode = res?.data?.barcodeId ?? barcodeId;
          this.toast.success({
            title: 'تم الحفظ',
            message: `تم إنشاء العضو الجديد بنجاح. الرمز: ${successBarcode}`,
          });
          this.memberForm.reset();
          this.showCreatePanel = false;
        },
        () => {
          this.isSaving = false;
          this.toast.error({
            title: 'فشل الحفظ',
            message: 'تعذر حفظ العضو في الوقت الحالي.',
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
