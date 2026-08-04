export interface AttendanceRecord {
  id: string;
  memberId: number;
  memberName: string;
  barcodeId: string;
  scannedAt: string;
  status: 'present' | 'duplicate';
}
