// services/member.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, GenericService } from './genericService';
import { ApiConstants } from '../Common/ApiConstants';
import { Member } from '../model/class/Member';


@Injectable({
  providedIn: 'root'
})
export class MemberService extends GenericService<Member> {

  constructor(http: HttpClient) {
    super(http);
  }

  // Get all members
//   getMembers(): Observable<Member[]> {
//     return this.getAll<Member>(this.MEMBERS_ENDPOINT);
//   }

  // Get member by ID
//   getMember(id: number): Observable<Member> {
//     return this.getById<Member>(this.MEMBERS_ENDPOINT, id);
//   }

  // Create member
  createMember(member: Member): Observable<ApiResponse<Member>> {
    const endpoint = `${ApiConstants.ENDPOINTS.MEMBERS}/${ApiConstants.ENDPOINTS.MEMBERS_ADD}`;
    return this.create(endpoint, member);
  }

  // Get top ten members
  getTopTenMembers(): Observable<ApiResponse<Member[]>> {
    const endpoint = `${ApiConstants.ENDPOINTS.MEMBERS}/${ApiConstants.ENDPOINTS.MEMBERS_GET_TO_TEN}`;
    return this.get<Member[]>(endpoint);
  }

  // Update member
  updateMember(id: number, member: Member): Observable<ApiResponse<Member>> {
    const endpoint = `${ApiConstants.ENDPOINTS.MEMBERS}/${ApiConstants.ENDPOINTS.MEMBERS_UPDATE}`;
    return this.update(endpoint, id, member);
  }

//   // Delete member
//   deleteMember(id: number): Observable<void> {
//     return this.delete<void>(this.MEMBERS_ENDPOINT, id);
//   }

//   // Search members
//   searchMembers(query: string): Observable<Member[]> {
//     return this.search<Member>(this.MEMBERS_ENDPOINT, query);
//   }

//   // Get members with filters
//   filterMembers(filters: MemberFilters): Observable<Member[]> {
//     return this.filter<Member>(this.MEMBERS_ENDPOINT, filters);
//   }

//   // Get paginated members
//   getMembersPaginated(page: number, limit: number, filters?: MemberFilters): Observable<any> {
//     return this.getPaginated<Member>(this.MEMBERS_ENDPOINT, page, limit, filters);
//   }




//   // Get members expiring soon
//   getExpiringMembers(days: number = 30): Observable<Member[]> {
//     return this.apiService.get<Member[]>(ApiConstants.ENDPOINTS.MEMBERS_EXPIRING, { days });
//   }

//   // Export members
//   exportMembers(format: 'csv' | 'excel' = 'csv', filters?: MemberFilters): Observable<Blob> {
//     return this.exportData(this.MEMBERS_ENDPOINT, format, filters);
//   }

//   // Import members
//   importMembers(file: File): Observable<{ imported: number; failed: number; errors: string[] }> {
//     return this.importData<any>(this.MEMBERS_ENDPOINT, file);
//   }
}