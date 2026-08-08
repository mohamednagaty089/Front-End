import {
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { MemberService } from '../../service/memberService';
import { Member } from '../../model/class/Member';
import { AttendanceRecord } from '../../model/class/AttendanceRecord';
import { ApiResponse } from '@/app/service/genericService';
import { ToastService } from '@/app/components/ui/toast.service';
import { UbButtonDirective } from '@/app/components/ui/button';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, UbButtonDirective],
  providers: [DatePipe],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class AttendanceComponent implements OnInit, OnDestroy {
  private readonly memberService = inject(MemberService);
  private readonly toast = inject(ToastService);
  private readonly datePipe = inject(DatePipe);

  private scanner: Html5Qrcode | null = null;
  private readonly scannerElementId = 'qr-attendance-reader';
  private lastScanValue = '';
  private lastScanAt = 0;

  readonly members = signal<Member[]>([]);
  readonly attendanceLog = signal<AttendanceRecord[]>([]);
  readonly isScanning = signal(false);
  readonly isStarting = signal(false);
  readonly cameraError = signal('');
  readonly lastResult = signal<AttendanceRecord | null>(null);
  readonly flashState = signal<'idle' | 'success' | 'warning' | 'error'>('idle');

  manualCode = '';

  readonly todayCount = computed(
    () => this.attendanceLog().filter((item) => item.status === 'present').length
  );

  ngOnInit(): void {
    this.loadMembers();
  }

  ngOnDestroy(): void {
    void this.stopScanner();
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

  async startScanner() {
    if (this.isScanning() || this.isStarting()) {
      return;
    }

    this.cameraError.set('');
    this.isStarting.set(true);

    try {
      if (!this.scanner) {
        this.scanner = new Html5Qrcode(this.scannerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
          ],
          verbose: false,
        });
      }

      await this.scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1,
        },
        (decodedText) => this.handleScan(decodedText),
        () => undefined
      );

      this.isScanning.set(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'تعذر تشغيل الكاميرا. تأكد من منح صلاحية الوصول.';
      this.cameraError.set(message);
      this.flashState.set('error');
      this.toast.error({
        title: 'خطأ في الكاميرا',
        description: 'تحقق من صلاحيات الكاميرا ثم حاول مرة أخرى.',
      });
    } finally {
      this.isStarting.set(false);
    }
  }

  async stopScanner() {
    if (!this.scanner) {
      this.isScanning.set(false);
      return;
    }

    try {
      await this.scanner.stop();
      await this.scanner.clear();
    } catch {
      // Ignore stop errors when camera already closed
    } finally {
      this.isScanning.set(false);
    }
  }

  async toggleScanner() {
    if (this.isScanning()) {
      await this.stopScanner();
      return;
    }
    await this.startScanner();
  }

  submitManualCode() {
    const code = this.manualCode.trim();
    if (!code) {
      this.toast.error({
        title: 'أدخل الكود',
        description: 'يرجى كتابة كود الـ QR أو الباركود أولاً.',
      });
      return;
    }
    this.handleScan(code);
    this.manualCode = '';
  }

  clearLog() {
    this.attendanceLog.set([]);
    this.lastResult.set(null);
    this.flashState.set('idle');
  }

  formattedTime(value: string) {
    return this.datePipe.transform(value, 'h:mm:ss a') ?? value;
  }

  private handleScan(rawCode: string) {
    const code = rawCode.trim();
    if (!code) {
      return;
    }

    const now = Date.now();
    if (code === this.lastScanValue && now - this.lastScanAt < 2500) {
      return;
    }
    this.lastScanValue = code;
    this.lastScanAt = now;

    const member = this.findMemberByCode(code);
    if (!member) {
      this.flashState.set('error');
      this.toast.error({
        title: 'مشترك غير موجود',
        description: `لم يتم العثور على مشترك بالكود: ${code}`,
      });
      return;
    }

    const alreadyPresent = this.attendanceLog().some(
      (item) =>
        item.memberId === member.id &&
        item.status === 'present' &&
        this.isSameDay(item.scannedAt, new Date().toISOString())
    );

    if (alreadyPresent) {
      const duplicate: AttendanceRecord = {
        id: `${member.id}-${now}`,
        memberId: member.id,
        memberName: member.fullName,
        barcodeId: member.code || code,
        scannedAt: new Date().toISOString(),
        status: 'duplicate',
      };
      this.lastResult.set(duplicate);
      this.flashState.set('warning');
      this.toast.error({
        title: 'تم التسجيل مسبقاً',
        description: `${member.fullName} مسجل حضوره اليوم بالفعل.`,
      });
      return;
    }

    const record: AttendanceRecord = {
      id: `${member.id}-${now}`,
      memberId: member.id,
      memberName: member.fullName,
      barcodeId: member.code || code,
      scannedAt: new Date().toISOString(),
      status: 'present',
    };

    this.attendanceLog.update((list) => [record, ...list]);
    this.lastResult.set(record);
    this.flashState.set('success');
    this.toast.success({
      title: 'تم تسجيل الحضور',
      description: `مرحباً ${member.fullName}`,
    });
  }

  private findMemberByCode(code: string): Member | undefined {
    const normalized = code.trim().toLowerCase();
    return this.members().find((member) => {
      const barcode = member.code?.trim().toLowerCase();
      const idMatch = String(member.id) === code.trim();
      const nameMatch = member.fullName?.trim().toLowerCase() === normalized;
      return barcode === normalized || idMatch || nameMatch;
    });
  }

  private isSameDay(a: string, b: string) {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  }
}
