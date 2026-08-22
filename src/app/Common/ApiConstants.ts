// constants/api.constants.ts
export class ApiConstants {
  // Base URLs
  static readonly BASE_URL = 'http://localhost:8090/api';
  static readonly AUTH_URL = 'http://localhost:3000/auth';
  static readonly UPLOAD_URL = 'http://localhost:3000/uploads';
  
  // API Version
  static readonly API_VERSION = 'v1';
  
  // Endpoints
  static readonly ENDPOINTS = {
    // Auth endpoints
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    
    // Member endpoints
    MEMBERS: 'members',
    MEMBERS_SEARCH: 'search',
    MEMBERS_ADD: 'add',
    MEMBERS_UPDATE: 'update',
    MEMBERS_DELETE: 'delete',
    MEMBERS_GET_TO_TEN:'getAll',
    GET_ALL_ACTIVE_MEMBERS: 'getAllActive',
    MEMBERS_OVERDUE: 'members/overdue',
    MEMBERS_STATS: 'members/stats',
    MEMBERS_EXPORT: 'members/export-csv',
    MEMBERS_IMPORT: 'members/import',
    MEMBERS_PAYMENTS: (id: number) => `members/${id}/payments`,
    MEMBERS_BARCODE: (id: number) => `members/barCode/${id}`,

    // Member subscription endpoints
    MEMBER_SUBSCRIPTIONS: 'membersSubscription',
    MEMBER_SUBSCRIPTIONS_ADD: 'add',
    MEMBER_SUBSCRIPTIONS_UPDATE: 'update',
    MEMBER_SUBSCRIPTIONS_DELETE: 'delete',
    MEMBER_SUBSCRIPTIONS_GET_ALL: 'getAll',
    
    // Employee endpoints
    EMPLOYEES: '/employees',
    EMPLOYEES_DEPARTMENT: '/employees/department',
    EMPLOYEES_POSITION: '/employees/position',

    
    // ATTANDENCE endpoints
    ATTANDENCE: 'attendance',
    ATTANDENCE_CHECKIN: 'attandence/checkin',
    ATTANDENCE_CHECKOUT: 'attandence/checkout', 
    SCAN: 'scan',
    GET_ACTIVE_MEMBER_COUNT: 'getDailyAttendanceCount',
  
    
    

    
  
HEADERS: {
    CONTENT_TYPE: 'application/json',
    ACCEPT: 'application/json',
    AUTHORIZATION: 'Authorization',
    BEARER: 'Bearer '
  },
  

  }
  static readonly  STATUS ={
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER: 500
  }

  static readonly ATTENDANCE_SCAN = {
    SUCCESS: 'SUCCESS',
    DUPLICATE: 'DUPLICATE',
    NO_SUBSCRIPTION: 'NO_SUBSCRIPTION',
    MEMBER_NOT_FOUND: 'MEMBER_NOT_FOUND',
    LIMIT_REACHED: 'LIMIT_REACHED',
    INVALID_FORMAT: 'INVALID_FORMAT',
    ERROR: 'ERROR',
  } as const
}