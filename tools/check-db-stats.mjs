/**
 * Script to check actual database statistics
 * Run with: node tools/check-db-stats.mjs
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env") });

const databaseUrl =
  process.env.NG_APP_PRISMA_URL ||
  process.env.NG_APP_MONGODB_URI ||
  process.env.DATABASE_URL ||
  process.env.MONGODB_URI;

if (!databaseUrl) {
  console.error("DATABASE_URL not found in environment variables");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function checkDatabaseStats() {
  try {
    console.log("🔍 Checking database statistics...\n");

    // Get all employees
    const employees = await prisma.employee.findMany({
      select: {
        employeeId: true,
        employeeName: true,
        isActive: true,
      },
    });

    // Get all projects
    const projects = await prisma.project.findMany({
      select: {
        projectId: true,
        projectName: true,
        status: true,
        archivedAt: true,
        leadByEmpId: true,
      },
    });

    // Get all project employees
    const projectEmployees = await prisma.projectEmployee.findMany({
      select: {
        empProjectId: true,
        projectId: true,
        empId: true,
        isActive: true,
      },
    });

    console.log("📊 EMPLOYEE STATISTICS:");
    console.log(`   Total Employees: ${employees.length}`);
    console.log(`   Active Employees: ${employees.filter(e => e.isActive === true || e.isActive === "Y").length}`);
    console.log(`   Inactive Employees: ${employees.filter(e => e.isActive === false || e.isActive === "N").length}`);
    console.log("\n   Employee Details:");
    employees.forEach(emp => {
      console.log(`   - ID: ${emp.employeeId}, Name: ${emp.employeeName}, isActive: ${emp.isActive} (type: ${typeof emp.isActive})`);
    });

    console.log("\n📊 PROJECT STATISTICS:");
    console.log(`   Total Projects: ${projects.length}`);
    const archivedProjects = projects.filter(p => p.archivedAt != null && p.archivedAt !== '');
    const nonArchivedProjects = projects.filter(p => !p.archivedAt || p.archivedAt === '');
    console.log(`   Non-Archived: ${nonArchivedProjects.length}`);
    console.log(`   Archived: ${archivedProjects.length}`);
    console.log(`   With Lead: ${projects.filter(p => p.leadByEmpId != null).length}`);
    console.log("\n   Project Details:");
    projects.forEach(proj => {
      console.log(`   - ID: ${proj.projectId}, Name: ${proj.projectName}, Status: ${proj.status}, Archived: ${proj.archivedAt ? 'Yes' : 'No'}, Lead: ${proj.leadByEmpId || 'None'}`);
    });

    console.log("\n📊 PROJECT EMPLOYEE ASSIGNMENT STATISTICS:");
    console.log(`   Total Assignments: ${projectEmployees.length}`);
    
    // Check isActive values
    const activeAssignments = projectEmployees.filter(pe => {
      const isActive = pe.isActive;
      return isActive === true || isActive === "Y" || isActive === "y" || String(isActive).toLowerCase() === "true";
    });
    const inactiveAssignments = projectEmployees.filter(pe => {
      const isActive = pe.isActive;
      return isActive === false || isActive === "N" || isActive === "n" || String(isActive).toLowerCase() === "false";
    });
    
    console.log(`   Active Assignments: ${activeAssignments.length}`);
    console.log(`   Inactive Assignments: ${inactiveAssignments.length}`);
    console.log("\n   Assignment Details:");
    projectEmployees.forEach(pe => {
      console.log(`   - Assignment ID: ${pe.empProjectId}, Project ID: ${pe.projectId}, Employee ID: ${pe.empId}, isActive: ${pe.isActive} (type: ${typeof pe.isActive})`);
    });

    // Check using Prisma count (what the dashboard uses)
    const prismaActiveCount = await prisma.projectEmployee.count({
      where: { isActive: true },
    });
    const prismaInactiveCount = await prisma.projectEmployee.count({
      where: { isActive: false },
    });
    const prismaTotalCount = await prisma.projectEmployee.count();

    console.log("\n📊 PRISMA COUNT QUERIES (what dashboard uses):");
    console.log(`   Total Count: ${prismaTotalCount}`);
    console.log(`   Active (isActive: true): ${prismaActiveCount}`);
    console.log(`   Inactive (isActive: false): ${prismaInactiveCount}`);

    // Check projects with active assignments
    const projectIdsWithActiveAssignments = new Set(
      activeAssignments.map(pe => pe.projectId)
    );
    const assignedProjects = nonArchivedProjects.filter(p => 
      projectIdsWithActiveAssignments.has(p.projectId)
    );
    const nonAssignedProjects = nonArchivedProjects.filter(p => 
      !projectIdsWithActiveAssignments.has(p.projectId)
    );

    console.log("\n📊 PROJECT CATEGORIZATION:");
    console.log(`   Assigned Projects: ${assignedProjects.length}`);
    console.log(`   Non-Assigned Projects: ${nonAssignedProjects.length}`);

    const activeProjects = nonArchivedProjects.filter(p => {
      const hasActiveAssignments = projectIdsWithActiveAssignments.has(p.projectId);
      const hasLead = p.leadByEmpId != null;
      return hasActiveAssignments || hasLead;
    });
    const inactiveProjects = nonArchivedProjects.filter(p => {
      const hasActiveAssignments = projectIdsWithActiveAssignments.has(p.projectId);
      const hasLead = p.leadByEmpId != null;
      return !hasActiveAssignments && !hasLead;
    });
    const planningProjects = nonArchivedProjects.filter(p => {
      const hasActiveAssignments = projectIdsWithActiveAssignments.has(p.projectId);
      const hasLead = p.leadByEmpId != null;
      return !hasActiveAssignments && hasLead;
    });

    console.log(`   Active Projects: ${activeProjects.length}`);
    console.log(`   Inactive Projects: ${inactiveProjects.length}`);
    console.log(`   Planning Projects: ${planningProjects.length}`);

    console.log("\n✅ Statistics check complete!");

  } catch (error) {
    console.error("❌ Error checking database statistics:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStats().catch((error) => {
  console.error(error);
  process.exit(1);
});

