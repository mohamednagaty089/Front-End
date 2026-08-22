import {
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { MemberService } from '../../service/memberService';
import { Member } from '../../model/class/Member';
import {
  AttendanceRecord,
  AttendanceScanStatus,
} from '../../model/class/AttendanceRecord';
import { ApiResponse } from '@/app/service/genericService';
import { ToastService } from '@/app/components/ui/toast.service';
import { UbButtonDirective } from '@/app/components/ui/button';
import { AttendanceService } from '@/app/service/attendaceService';
import { ApiConstants } from '@/app/Common/ApiConstants';

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
  private scanBuffer = '';
  private lastScanKeyAt = 0;
  private readonly scanKeyGapMs = 120;
  private readonly ngZone = inject(NgZone);

  readonly members = signal<Member[]>([]);
  readonly attendanceLog = signal<AttendanceRecord[]>([]);
  readonly dailyCount = signal<number | null>(null);
  readonly isScanning = signal(false);
  readonly isStarting = signal(false);
  readonly cameraError = signal('');
  readonly lastResult = signal<AttendanceRecord | null>(null);
  readonly flashState = signal<'idle' | 'success' | 'warning' | 'error'>('idle');

  manualCode = '';

  readonly todayCount = computed(() => {
    const server = this.dailyCount();
    if (typeof server === 'number') return server;
    return this.attendanceLog().filter((item) => item.status === 'SUCCESS').length;
  });
   constructor(private attendanceService: AttendanceService ) {
   }
  ngOnInit(): void {
    this.loadMembers();
    this.loadDailyCount();
    // Use non-passive capture listeners so we can preventDefault in time
    window.addEventListener('keydown', this.onKeydown, { capture: true, passive: false });
    window.addEventListener('keyup', this.onKeyup, { capture: true, passive: false });
    window.addEventListener('keypress', this.onKeypress, { capture: true, passive: false });
  }

  loadDailyCount() {
    this.attendanceService.getDailyAttendanceCount().subscribe({
      next: (res: ApiResponse<number>) => {
        this.dailyCount.set(res?.data ?? 0);
      },
      error: () => {
        this.dailyCount.set(null);
      },
    });
  }

  ngOnDestroy(): void {
    void this.stopScanner();
    window.removeEventListener('keydown', this.onKeydown, { capture: true });
    window.removeEventListener('keyup', this.onKeyup, { capture: true });
    window.removeEventListener('keypress', this.onKeypress, { capture: true });
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
  }

  clearLog() {
    this.attendanceLog.set([]);
    this.lastResult.set(null);
    this.flashState.set('idle');
  }

  formattedTime(value: string) {
    return this.datePipe.transform(value, 'h:mm:ss a') ?? value;
  }

  resultLabel(status: AttendanceScanStatus): string {
    switch (status) {
      case 'SUCCESS':
        return 'تم التسجيل';
      case 'DUPLICATE':
        return 'مسجل مسبقاً';
      case 'NO_SUBSCRIPTION':
        return 'لا يوجد اشتراك';
      case 'MEMBER_NOT_FOUND':
        return 'غير موجود';
      case 'LIMIT_REACHED':
        return 'الحصص انتهت';
      case 'INVALID_FORMAT':
        return 'باركود غير صالح';
      default:
        return 'خطأ';
    }
  }

  resultToneClass(status: AttendanceScanStatus): string {
    if (status === 'SUCCESS') {
      return '';
    }
    if (status === 'DUPLICATE' || status === 'LIMIT_REACHED') {
      return 'is-duplicate';
    }
    return 'is-error';
  }

  private handleScan(rawCode: string) {
    const code = rawCode.trim();
    if (!code) {
      return;
    }

    this.ngZone.run(() => {
      this.manualCode = code;
      this.scanBuffer = code;
    });

    const now = Date.now();
    if (code === this.lastScanValue && now - this.lastScanAt < 2500) {
      return;
    }
    this.lastScanValue = code;
    this.lastScanAt = now;

    this.attendanceService.takeAttendance(code).subscribe({
      next: (res: ApiResponse<any>) => {
        this.applyScanOutcome(code, res, ApiConstants.STATUS.OK);
      },
      error: (err: HttpErrorResponse) => {
        this.applyScanOutcome(code, err.error, err.status);
      },
    });
  }

  private applyScanOutcome(barcode: string, body: any, httpStatus: number) {
    this.ngZone.run(() => {
      const scanStatus = this.resolveScanStatus(body, httpStatus);
      const outcome = this.scanOutcome(scanStatus);
      const memberName = this.memberNameFromPayload(body?.data ?? body, barcode);
      const record: AttendanceRecord = {
        id: `${memberName}-${Date.now()}`,
        memberId: this.memberIdFromPayload(body?.data ?? body),
        memberName,
        barcodeId: barcode,
        scannedAt: new Date().toISOString(),
        status: scanStatus,
        message: this.pickMessage(body, outcome.description),
      };

      this.lastResult.set(record);
      this.flashState.set(outcome.flash);
      this.attendanceLog.update((list) => [record, ...list]);

      const toastPayload = {
        title: outcome.title,
        description: record.message || outcome.description,
      };
      if (outcome.flash === 'success') {
        this.toast.success(toastPayload);
      } else if (outcome.flash === 'warning') {
        this.toast.warning(toastPayload);
      } else {
        this.toast.error(toastPayload);
      }
    });
  }

  private resolveScanStatus(body: any, httpStatus: number): AttendanceScanStatus {
    const candidates = [
      body?.code,
      body?.errorCode,
      body?.statusCode,
      typeof body?.status === 'string' ? body.status : null,
      body?.data?.code,
      body?.data?.status,
      body?.message,
      body?.error,
    ];

    for (const candidate of candidates) {
      const mapped = this.normalizeScanStatus(candidate);
      if (mapped) {
        return mapped;
      }
    }

    const message = String(body?.message ?? body?.error ?? '').toLowerCase();
    if (message.includes('already attended') || message.includes('duplicate')) {
      return 'DUPLICATE';
    }
    if (message.includes('no active subscription')) {
      return 'NO_SUBSCRIPTION';
    }
    if (message.includes('member not found')) {
      return 'MEMBER_NOT_FOUND';
    }
    if (message.includes('lessons used') || message.includes('limit')) {
      return 'LIMIT_REACHED';
    }
    if (message.includes('barcode format') || message.includes('invalid format')) {
      return 'INVALID_FORMAT';
    }
    if (message.includes('attendance saved') || message.includes('success')) {
      return 'SUCCESS';
    }

    switch (httpStatus) {
      case ApiConstants.STATUS.OK:
      case ApiConstants.STATUS.CREATED:
        return 'SUCCESS';
      case ApiConstants.STATUS.CONFLICT:
        return 'DUPLICATE';
      case ApiConstants.STATUS.FORBIDDEN:
        return 'LIMIT_REACHED';
      case ApiConstants.STATUS.BAD_REQUEST:
        return 'INVALID_FORMAT';
      case ApiConstants.STATUS.NOT_FOUND:
        return 'MEMBER_NOT_FOUND';
      default:
        return 'ERROR';
    }
  }

  private normalizeScanStatus(value: unknown): AttendanceScanStatus | null {
    const raw = String(value ?? '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
    const known = Object.values(ApiConstants.ATTENDANCE_SCAN) as AttendanceScanStatus[];
    return known.includes(raw as AttendanceScanStatus) ? (raw as AttendanceScanStatus) : null;
  }

  private scanOutcome(status: AttendanceScanStatus): {
    title: string;
    description: string;
    flash: 'success' | 'warning' | 'error';
  } {
    switch (status) {
      case 'SUCCESS':
        return {
          title: 'تم تسجيل الحضور',
          description: 'Attendance saved',
          flash: 'success',
        };
      case 'DUPLICATE':
        return {
          title: 'تم التسجيل مسبقاً',
          description: 'Already attended today',
          flash: 'warning',
        };
      case 'NO_SUBSCRIPTION':
        return {
          title: 'لا يوجد اشتراك فعال',
          description: 'No active subscription',
          flash: 'error',
        };
      case 'MEMBER_NOT_FOUND':
        return {
          title: 'مشترك غير موجود',
          description: 'Member not found',
          flash: 'error',
        };
      case 'LIMIT_REACHED':
        return {
          title: 'تم استهلاك الحصص',
          description: 'Lessons used up',
          flash: 'warning',
        };
      case 'INVALID_FORMAT':
        return {
          title: 'صيغة الباركود غير صحيحة',
          description: 'Bad barcode format',
          flash: 'error',
        };
      default:
        return {
          title: 'حدث خطأ غير متوقع',
          description: 'Unexpected error',
          flash: 'error',
        };
    }
  }

  private pickMessage(body: any, fallback: string): string {
    const message = body?.message ?? body?.error ?? body?.data?.message;
    return typeof message === 'string' && message.trim() ? message.trim() : fallback;
  }

  private memberNameFromPayload(data: any, fallback: string): string {
    if (!data || typeof data !== 'object') {
      return fallback;
    }
    return (
      data.fullName ||
      data.memberName ||
      data.name ||
      data.member?.fullName ||
      fallback
    );
  }

  private memberIdFromPayload(data: any): number | undefined {
    const id = data?.id ?? data?.memberId ?? data?.member?.id;
    return typeof id === 'number' ? id : undefined;
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

  private onKeydown = (e: KeyboardEvent) => {
    this.blockDevToolsShortcuts(e);
    this.captureScannerKeydown(e);
  };

  private onKeyup = (e: KeyboardEvent) => {
    this.blockDevToolsShortcuts(e);
  };

  private onKeypress = (e: KeyboardEvent) => {
    this.blockDevToolsShortcuts(e);
  };

  private blockDevToolsShortcuts(e: KeyboardEvent) {
    if (!this.isDevToolsShortcut(e)) {
      return;
    }

    if (e.cancelable) {
      e.preventDefault();
    }
    e.stopImmediatePropagation();
    e.stopPropagation();
  }

  private isDevToolsShortcut(e: KeyboardEvent): boolean {
    const key = e.key || '';
    const code = e.code || '';
    const lower = key.toLowerCase();
    const keyCode = e.keyCode || e.which || 0;

    // USB barcode scanners often send F12 (or another F-key) as a suffix after Enter.
    // Detect F12 even when `key` is empty/Unidentified (common with HID wedges).
    const isF12 =
      key === 'F12' ||
      code === 'F12' ||
      keyCode === 123;
    if (isF12) {
      return true;
    }

    // Other function keys some scanners emit as prefix/suffix (F1 help, F5 refresh, ...)
    if (/^F\d{1,2}$/.test(key) || /^F\d{1,2}$/.test(code) || (keyCode >= 112 && keyCode <= 123)) {
      return true;
    }

    // Ctrl/Cmd + Shift + (I|J|C|K) -> DevTools / console
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (lower === 'i' || lower === 'j' || lower === 'c' || lower === 'k')) {
      return true;
    }

    // Ctrl/Cmd + U -> view-source
    if ((e.ctrlKey || e.metaKey) && lower === 'u') {
      return true;
    }

    // Ctrl/Cmd + Shift + P / ? command palette
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (lower === 'p' || lower === '?')) {
      return true;
    }

    return false;
  }

  private captureScannerKeydown(e: KeyboardEvent) {
    if (this.isTypingInOtherField(e.target)) {
      return;
    }

    if (e.key === 'Enter') {
      if (!this.scanBuffer.trim() && !this.manualCode.trim()) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      this.ngZone.run(() => {
        if (this.scanBuffer.trim()) {
          this.manualCode = this.scanBuffer.trim();
        }
        this.submitManualCode();
        this.scanBuffer = this.manualCode;
      });
      return;
    }

    if (e.key === 'Backspace') {
      if (!this.scanBuffer && !this.manualCode) {
        return;
      }
      e.preventDefault();
      this.ngZone.run(() => {
        this.scanBuffer = (this.scanBuffer || this.manualCode).slice(0, -1);
        this.manualCode = this.scanBuffer;
      });
      return;
    }

    if (!this.isPrintableScanKey(e)) {
      return;
    }

    const now = Date.now();
    if (now - this.lastScanKeyAt > this.scanKeyGapMs) {
      this.scanBuffer = '';
    }
    this.lastScanKeyAt = now;

    e.preventDefault();
    this.ngZone.run(() => {
      this.scanBuffer += e.key;
      this.manualCode = this.scanBuffer;
    });
  }

  private isPrintableScanKey(e: KeyboardEvent): boolean {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return false;
    }
    return e.key.length === 1;
  }

  private isTypingInOtherField(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    const tag = target.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !target.isContentEditable) {
      return false;
    }
    return target.id !== 'manual-code';
  }
}
