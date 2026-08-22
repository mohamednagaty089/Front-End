export type AttendanceScanStatus =
  | 'SUCCESS'
  | 'DUPLICATE'
  | 'NO_SUBSCRIPTION'
  | 'MEMBER_NOT_FOUND'
  | 'LIMIT_REACHED'
  | 'INVALID_FORMAT'
  | 'ERROR';

export interface AttendanceRecord {
  id: string;
  memberId: number|undefined;
  memberName: string;
  barcodeId: string;
  scannedAt: string;
  status: AttendanceScanStatus;
  message?: string;
}
