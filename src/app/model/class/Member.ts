export enum MemberType {
  Regular = 'Regular',
  VIP = 'VIP',
  Staff = 'Staff',
}

export class Member {
  id: number|undefined;
  phone: string;
  fullName: string;
  email: string;
  memberType: MemberType;
  address: string;
  nationalId: string;
  birthDate: Date;
  barcodeId: string;

  constructor(data?: Partial<Member>) {
    this.phone = data?.phone ?? '';
    this.fullName = data?.fullName ?? '';
    this.email = data?.email ?? '';
    this.memberType = data?.memberType ?? MemberType.Regular;
    this.address = data?.address ?? '';
    this.id = data?.id ?? undefined;
    this.nationalId = data?.nationalId ?? '';
    this.birthDate = data?.birthDate ?? new Date();
    this.barcodeId = data?.barcodeId ?? '';
  }
}