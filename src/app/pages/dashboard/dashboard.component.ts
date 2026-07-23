import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MasterService } from '../../service/master.service';
import { IParentDept, IProject, IProjectEmployee } from '../../model/interface/master';
import { Employee } from '../../model/class/Employee';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule], // Import CommonModule here
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  dashboardData: any = {
    totalEmployee: 0,
    totalProject: 0,
    activeProjectEmployees: 0,
    recentProjects: [],
    recentEmployee: [],
  };
  parentDepartments: IParentDept[] = [];

  // Statistics data
  projects: IProject[] = [];
  employees: Employee[] = [];
  projectEmployees: IProjectEmployee[] = [];

  // Calculated statistics
  projectStats: {
    nonArchived: number;
    archived: number;
    active: number;
    inactive: number;
    planning: number;
    assigned: number;
    nonAssigned: number;
    activeAssignments: number;
    inactiveAssignments: number;
  } = {
    nonArchived: 0,
    archived: 0,
    active: 0,
    inactive: 0,
    planning: 0,
    assigned: 0,
    nonAssigned: 0,
    activeAssignments: 0,
    inactiveAssignments: 0,
  };

  constructor(private masterService: MasterService) {}

  ngOnInit(): void {
    this.getDashboardData();
    this.getParentDepartments();
    this.loadStatisticsData();
  }

  getDashboardData() {
    this.masterService.getDashboardData().subscribe((data: any) => {
      this.dashboardData = data;
    });
  }

  getParentDepartments() {
    this.masterService.getAllDept().subscribe((response) => {
      if (response?.result && Array.isArray(response.data)) {
        this.parentDepartments = response.data;
      } else if (Array.isArray(response)) {
        // in case API returns array directly
        this.parentDepartments = response as unknown as IParentDept[];
      }
    });
  }

  loadStatisticsData(): void {
    let projectsLoaded = false;
    let employeesLoaded = false;
    let projectEmployeesLoaded = false;

    const checkAndCalculate = () => {
      if (projectsLoaded && employeesLoaded && projectEmployeesLoaded) {
        this.calculateProjectStatistics();
      }
    };

    // Load projects, employees, and project-employees in parallel
    this.masterService.getAllProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        projectsLoaded = true;
        checkAndCalculate();
      },
      error: (error) => {
        console.error('[Dashboard] Failed to load projects', error);
        this.projects = [];
        projectsLoaded = true;
        checkAndCalculate();
      },
    });

    this.masterService.getAllEmp().subscribe({
      next: (employees) => {
        this.employees = employees;
        employeesLoaded = true;
        checkAndCalculate();
      },
      error: (error) => {
        console.error('[Dashboard] Failed to load employees', error);
        this.employees = [];
        employeesLoaded = true;
        checkAndCalculate();
      },
    });

    this.masterService.getProjectEmp().subscribe({
      next: (projectEmployees) => {
        this.projectEmployees = projectEmployees;
        projectEmployeesLoaded = true;
        checkAndCalculate();
      },
      error: (error) => {
        console.error('[Dashboard] Failed to load project employees', error);
        this.projectEmployees = [];
        projectEmployeesLoaded = true;
        checkAndCalculate();
      },
    });
  }

  calculateProjectStatistics(): void {
    if (!this.projects.length) {
      return;
    }

    // Separate archived projects
    const archivedProjects = this.projects.filter(
      (p) => p.archivedAt != null && p.archivedAt !== ''
    );
    const nonArchivedProjects = this.projects.filter(
      (p) => !p.archivedAt || p.archivedAt === ''
    );

    // Filter to only active assignments
    const activeProjectEmployees = this.projectEmployees.filter(
      (pe) =>
        pe.isActive === 'Y' ||
        pe.isActive === 'y' ||
        pe.isActive === 'true' ||
        String(pe.isActive).toLowerCase() === 'true'
    );

    // Get project IDs with active assignments
    const projectIdsWithActiveAssignments = new Set(
      activeProjectEmployees.map((pe) => pe.projectId)
    );

    // Categorize non-archived projects
    const activeProjects: IProject[] = [];
    const inactiveProjects: IProject[] = [];
    const planningProjects: IProject[] = [];
    const assignedProjects: IProject[] = [];
    const nonAssignedProjects: IProject[] = [];

    nonArchivedProjects.forEach((p) => {
      const hasActiveAssignments = projectIdsWithActiveAssignments.has(p.projectId);
      const hasLead = p.leadByEmpId != null;

      // Assigned vs Non-assigned
      if (hasActiveAssignments) {
        assignedProjects.push(p);
      } else {
        nonAssignedProjects.push(p);
      }

      // Active vs Inactive vs Planning
      if (hasActiveAssignments) {
        // Has active assignments = Active
        activeProjects.push(p);
      } else if (hasLead) {
        // Has lead but no active assignments = Planning/Startup
        planningProjects.push(p);
        activeProjects.push(p); // Planning projects are also considered "active"
      } else {
        // No lead and no active assignments = Inactive
        inactiveProjects.push(p);
      }
    });

    // Calculate active and inactive assignments
    const activeAssignmentsCount = this.projectEmployees.filter((pe) =>
      this.isActive(pe.isActive)
    ).length;
    const inactiveAssignmentsCount =
      this.projectEmployees.length - activeAssignmentsCount;

    // Update statistics
    this.projectStats = {
      nonArchived: nonArchivedProjects.length,
      archived: archivedProjects.length,
      active: activeProjects.length,
      inactive: inactiveProjects.length,
      planning: planningProjects.length,
      assigned: assignedProjects.length,
      nonAssigned: nonAssignedProjects.length,
      activeAssignments: activeAssignmentsCount,
      inactiveAssignments: inactiveAssignmentsCount,
    };
  }

  // Helper method to check if assignment is active (matching project-employee component logic)
  private isActive(value: string | boolean | null | undefined): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return ['y', 'yes', 'true', '1'].includes(value.toLowerCase());
    }
    return false;
  }

  getDepartmentLogo(logo: string): string {
    if (!logo) {
      return '';
    }
    return logo.startsWith('/') ? logo : `/${logo}`;
  }
}
