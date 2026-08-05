export enum SubscriptionStatus {
  Active = 'Active',
  Pending = 'Pending',
  Expired = 'Expired',
  Suspended = 'Suspended',
}

export enum PaymentMethod {
  Cash = 'Cash',
  InstaPay = 'InstaPay',
  Visa = 'Visa',
  VodafoneCash = 'VodafoneCash',
  BankTransfer = 'BankTransfer',
}

export class MemberSubscription {
  id: number;
  memberId: number;
  memberName: string;
  startDate: string;
  endDate: string;
  sessionsCount: number | null;
  status: SubscriptionStatus;
  paymentMethod: PaymentMethod;
  amount: number | null;
  notes: string;

  constructor(data?: Partial<MemberSubscription>) {
    this.id = data?.id ?? 0;
    this.memberId = data?.memberId ?? 0;
    this.memberName = data?.memberName ?? '';
    this.startDate = data?.startDate ?? '';
    this.endDate = data?.endDate ?? '';
    this.sessionsCount = data?.sessionsCount ?? null;
    this.status = data?.status ?? SubscriptionStatus.Active;
    this.paymentMethod = data?.paymentMethod ?? PaymentMethod.Cash;
    this.amount = data?.amount ?? null;
    this.notes = data?.notes ?? '';
  }
}
