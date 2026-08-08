import {
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberService } from '../../service/memberService';
import { Member } from '../../model/class/Member';
import { ApiResponse } from '@/app/service/genericService';
import { ToastService } from '@/app/components/ui/toast.service';
import { UbButtonDirective } from '@/app/components/ui/button';

@Component({
  selector: 'app-barcode-generator',
  standalone: true,
  imports: [CommonModule, UbButtonDirective],
  templateUrl: './barcode-generator.component.html',
  styleUrls: ['./barcode-generator.component.css'],
})
export class BarcodeGeneratorComponent implements OnInit {
  private readonly memberService = inject(MemberService);
  private readonly toast = inject(ToastService);

  readonly members = signal<Member[]>([]);
  readonly selectedMember = signal<Member | null>(null);
  readonly memberDropdownOpen = signal(false);
  readonly isLoading = signal(false);
  readonly barcodeBase64 = signal('');
  readonly searchTerm = signal('');

  readonly filteredMembers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.members();
    }
    return this.members().filter(
      (member) =>
        member.fullName?.toLowerCase().includes(term) ||
        member.phone?.toLowerCase().includes(term) ||
        member.code?.toLowerCase().includes(term)
    );
  });

  readonly barcodeImageSrc = computed(() => {
    const raw = this.barcodeBase64().trim();
    if (!raw) {
      return '';
    }
    if (raw.startsWith('data:image')) {
      return raw;
    }
    return `data:image/png;base64,${raw}`;
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.barcode-dropdown')) {
      this.memberDropdownOpen.set(false);
    }
  }

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers() {
    this.memberService.getTopTenMembers().subscribe({
      next: (res: ApiResponse<Member[]>) => {
        this.members.set(res?.data ?? []);
      },
      error: () => {
        this.toast.error({
          title: 'تعذر التحميل',
          description: 'تعذر تحميل قائمة المشتركين.',
        });
      },
    });
  }

  toggleMemberDropdown(event?: Event) {
    event?.stopPropagation();
    this.memberDropdownOpen.update((open) => !open);
  }

  updateSearch(term: string) {
    this.searchTerm.set(term);
  }

  selectMember(member: Member) {
    this.selectedMember.set(member);
    this.memberDropdownOpen.set(false);
    this.searchTerm.set('');
    this.barcodeBase64.set('');
  }

  clearMember(event?: Event) {
    event?.stopPropagation();
    this.selectedMember.set(null);
    this.barcodeBase64.set('');
  }

  generateBarcode() {
    const member = this.selectedMember();
    if (!member?.id) {
      this.toast.error({
        title: 'اختر المشترك',
        description: 'يرجى اختيار مشترك أولاً لتوليد الباركود.',
      });
      return;
    }
    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.memberService.getMemberBarcode(member.id).subscribe({
      next: (res: ApiResponse<string | { base64?: string; imageBase64?: string; data?: string }>) => {
        this.isLoading.set(false);
        const payload = res?.data;
        let base64 = '';
        if (typeof payload === 'string') {
          base64 = payload.trim();
        } else if (payload && typeof payload === 'object') {
          base64 = (
            payload.base64 ||
            payload.imageBase64 ||
            payload.data ||
            ''
          )
            .toString()
            .trim();
        }
        if (!base64) {
          this.toast.error({
            title: 'لا توجد صورة',
            description: 'الخادم لم يُرجع صورة باركود صالحة.',
          });
          return;
        }
        this.barcodeBase64.set(base64);
        this.toast.success({
          title: 'تم التوليد',
          description: `تم جلب باركود ${member.fullName} بنجاح.`,
        });
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error({
          title: 'فشل التوليد',
          description: 'تعذر جلب الباركود من الخادم حالياً.',
        });
      },
    });
  }

  downloadBarcode() {
    const src = this.barcodeImageSrc();
    const member = this.selectedMember();
    if (!src) {
      this.toast.error({
        title: 'لا توجد صورة',
        description: 'قم بتوليد الباركود أولاً قبل التحميل.',
      });
      return;
    }

    const link = document.createElement('a');
    const safeName = (member?.fullName || member?.code || 'barcode')
      .replace(/[^\w\u0600-\u06FF\-]+/g, '_')
      .slice(0, 40);
    link.href = src;
    link.download = `barcode-${safeName || member?.id || 'member'}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    this.toast.success({
      title: 'تم التحميل',
      description: 'تم تنزيل صورة الباركود.',
    });
  }
}
