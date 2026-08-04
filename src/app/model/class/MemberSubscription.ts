export class MemberSubscription {
  id: number;
  memberId: number;
  memberName: string;
  startDate: string;
  endDate: string;
  sessionsCount: number | null;
  notes: string;

  constructor(data?: Partial<MemberSubscription>) {
    this.id = data?.id ?? 0;
    this.memberId = data?.memberId ?? 0;
    this.memberName = data?.memberName ?? '';
    this.startDate = data?.startDate ?? '';
    this.endDate = data?.endDate ?? '';
    this.sessionsCount = data?.sessionsCount ?? null;
    this.notes = data?.notes ?? '';
  }
}
