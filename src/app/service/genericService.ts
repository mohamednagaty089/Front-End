// services/generic-service-with-response.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import { ApiConstants } from '../Common/ApiConstants';

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class GenericService<T> {
  private baseUrl: string;

  constructor(private http: HttpClient) {
    this.baseUrl = environment.api.baseUrl || ApiConstants.BASE_URL; // Prefer proxy-aware API base URL
  }
  private getUrl(endpoint: string): string {
    const trimmedBaseUrl = this.baseUrl.replace(/\/+$/, '');
    const trimmedEndpoint = endpoint.replace(/^\/+/, '');
    return `${trimmedBaseUrl}/${trimmedEndpoint}`;
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => new Error(error.message || 'Server error'));
  }

  // GET all with pagination and filtering
  getAll(endpoint: string, params?: HttpParams): Observable<ApiResponse<T[]>> {
    return this.http.get<ApiResponse<T[]>>(this.getUrl(endpoint), { params })
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

 // ✅ Generic GET method - T is the data type
     get<T>(endpoint: string): Observable<ApiResponse<T>> {
        return this.http.get<ApiResponse<T>>(this.getUrl(endpoint))
            .pipe(
                retry(1),
                catchError(this.handleError)
            );
    }
  

  // GET by ID
  getById(endpoint: string, id: number | string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.getUrl(endpoint)}/${id}`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  // CREATE
  create<T>(endpoint: string, item: T): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.getUrl(endpoint), item)
      .pipe(
        catchError(this.handleError)
      );
  }

  // UPDATE
  update<T>(endpoint: string, id: number | string, item: T): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.getUrl(endpoint)}/${id}`, item)
      .pipe(
        catchError(this.handleError)
      );
  }

  // PARTIAL UPDATE
  patch(endpoint: string, id: number | string, item: Partial<T>): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(`${this.getUrl(endpoint)}/${id}`, item)
      .pipe(
        catchError(this.handleError)
      );
  }

  // DELETE
  delete<TResponse = T>(endpoint: string, id: number | string): Observable<ApiResponse<TResponse>> {
    return this.http.delete<ApiResponse<TResponse>>(`${this.getUrl(endpoint)}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Bulk operations
  bulkCreate(endpoint: string, items: T[]): Observable<ApiResponse<T[]>> {
    return this.http.post<ApiResponse<T[]>>(`${this.getUrl(endpoint)}/bulk`, items)
      .pipe(
        catchError(this.handleError)
      );
  }

  bulkDelete(endpoint: string, ids: (number | string)[]): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.getUrl(endpoint)}/bulk`, {
      body: { ids }
    })
      .pipe(
        catchError(this.handleError)
      );
  }
}