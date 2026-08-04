export class Employee {
  employeeId: number;
  employeeName: string;
  contactNo: string;
  emailId: string;
  deptId: number;
  password: string;
  gender: string;
  role: string;
  department: string; // Ensure this property is included
  title?: string;
  avatarUrl?: string;
  location?: string;
  timezone?: string;
  employmentType?: string;
  managerId?: number;
  hireDate?: string;
  bio?: string;
  about?: string;
  notes?: string;
  tags: string[];
  skills: string[];
  certifications: string[];
  interests: string[];
  languages: string[];
  socialLinks?: Record<string, string>;
  workPreferences?: Record<string, unknown>;
  availability?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
  performanceSnapshot?: Record<string, unknown>;
  documents?: Array<Record<string, unknown>>;
  customFields?: Record<string, unknown>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastActiveAt?: string;

  constructor() {
    this.employeeId = 0;
    this.employeeName = '';
    this.contactNo = '';
    this.emailId = '';
    this.deptId = 0;
    this.password = '';
    this.gender = '';
    this.role = '';
    this.department = ''; // Initialize this property
    this.tags = [];
    this.skills = [];
    this.certifications = [];
    this.interests = [];
    this.languages = [];
    this.isActive = true;
  }
}
