// services/member.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, GenericService } from './genericService';
import { ApiConstants } from '../Common/ApiConstants';
import { Member } from '../model/class/Member';
import { MemberSubscription } from '../model/class/MemberSubscription';
import { SearchRequest } from '../model/class/SearchRequest';

@Injectable({
  providedIn: 'root',
})
export class MemberService extends GenericService<Member> {
  constructor(http: HttpClient) {
    super(http);
  }

  createMember(member: Member): Observable<ApiResponse<Member>> {
    const endpoint = `${ApiConstants.ENDPOINTS.MEMBERS}/${ApiConstants.ENDPOINTS.MEMBERS_ADD}`;
    return this.create(endpoint, member);
  }

  getTopTenMembers(): Observable<ApiResponse<Member[]>> {
    const endpoint = `${ApiConstants.ENDPOINTS.MEMBERS}/${ApiConstants.ENDPOINTS.MEMBERS_GET_TO_TEN}`;
    return this.get<Member[]>(endpoint);
  }

  getMembers(searchRequest:SearchRequest): Observable<ApiResponse<Member[]>> {
    const endpoint = `${ApiConstants.ENDPOINTS.MEMBERS}/${ApiConstants.ENDPOINTS.MEMBERS_SEARCH}`;
    return this.Search<SearchRequest,Member[]>(endpoint,searchRequest);
  }

  updateMember(id: number, member: Member): Observable<ApiResponse<Member>> {
    const endpoint = `${ApiConstants.ENDPOINTS.MEMBERS}/${ApiConstants.ENDPOINTS.MEMBERS_UPDATE}`;
    return this.update(endpoint, id, member);
  }

  deleteMember(id: number): Observable<ApiResponse<boolean>> {
    const endpoint = `${ApiConstants.ENDPOINTS.MEMBERS}/${ApiConstants.ENDPOINTS.MEMBERS_DELETE}`;
    return this.delete<boolean>(endpoint, id);
  }

  /** Fetch member barcode image as base64 from backend */
  getMemberBarcode(
    memberId: number
  ): Observable<
    ApiResponse<string | { base64?: string; imageBase64?: string; data?: string }>
  > {
    const endpoint = ApiConstants.ENDPOINTS.MEMBERS_BARCODE(memberId);
    return this.get(endpoint);
  }

  getAllMemberSubscriptions(): Observable<ApiResponse<MemberSubscription[]>> {
    const endpoint = `${ApiConstants.ENDPOINTS.MEMBER_SUBSCRIPTIONS}/${ApiConstants.ENDPOINTS.MEMBER_SUBSCRIPTIONS_GET_ALL}`;
    return this.get<MemberSubscription[]>(endpoint);
  }

  createMemberSubscription(
    subscription: MemberSubscription
  ): Observable<ApiResponse<MemberSubscription>> {
    const endpoint = `${ApiConstants.ENDPOINTS.MEMBER_SUBSCRIPTIONS}/${ApiConstants.ENDPOINTS.MEMBER_SUBSCRIPTIONS_ADD}`;
    return this.create<MemberSubscription>(endpoint, subscription);
  }

  updateMemberSubscription(
    id: number,
    subscription: MemberSubscription
  ): Observable<ApiResponse<MemberSubscription>> {
    const endpoint = `${ApiConstants.ENDPOINTS.MEMBER_SUBSCRIPTIONS}/${ApiConstants.ENDPOINTS.MEMBER_SUBSCRIPTIONS_UPDATE}`;
    return this.update<MemberSubscription>(endpoint, id, subscription);
  }

  deleteMemberSubscription(id: number): Observable<ApiResponse<boolean>> {
    const endpoint = `${ApiConstants.ENDPOINTS.MEMBER_SUBSCRIPTIONS}/${ApiConstants.ENDPOINTS.MEMBER_SUBSCRIPTIONS_DELETE}`;
    return this.delete<boolean>(endpoint, id);
  }
}
