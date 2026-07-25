export enum MemberType {
  Regular = 'Regular',
  VIP = 'VIP',
  Staff = 'Staff',
}

export class Member {
  phone: string;
  fullName: string;
  email: string;
  memberType: MemberType;
  address: string;

  constructor(data?: Partial<Member>) {
    this.phone = data?.phone ?? '';
    this.fullName = data?.fullName ?? '';
    this.email = data?.email ?? '';
    this.memberType = data?.memberType ?? MemberType.Regular;
    this.address = data?.address ?? '';
  }
}