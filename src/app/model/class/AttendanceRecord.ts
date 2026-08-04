export interface AttendanceRecord {
  id: string;
  memberId: number|undefined;
  memberName: string;
  barcodeId: string;
  scannedAt: string;
  status: 'present' | 'duplicate';
}
