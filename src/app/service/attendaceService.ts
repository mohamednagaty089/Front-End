import { HttpClient } from "@angular/common/http";
import { ApiResponse, GenericService } from "./genericService";
import { Member } from "../model/class/Member";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiConstants } from "../Common/ApiConstants";

@Injectable({
  providedIn: 'root',
})
export class AttendanceService extends GenericService<Member> {
  constructor(http: HttpClient) {
    super(http);
  }

    takeAttendance(barcode: string |undefined): Observable<ApiResponse<Member>> {
      const endpoint = `${ApiConstants.ENDPOINTS.ATTANDENCE}/${ApiConstants.ENDPOINTS.SCAN}`;
      return this.scan(endpoint, { barcode });
    }
  
}