import { MOCK_STUDENT_DASHBOARD } from "@/features/growth-v2/data/student-dashboard.mock";
import type { StudentGrowthDashboard } from "@/features/growth-v2/types/student-dashboard";

export interface StudentDashboardRepository {
  getStudentDashboard(): Promise<StudentGrowthDashboard>;
}

class MockStudentDashboardRepository implements StudentDashboardRepository {
  async getStudentDashboard(): Promise<StudentGrowthDashboard> {
    return MOCK_STUDENT_DASHBOARD;
  }
}

export const studentDashboardRepository: StudentDashboardRepository =
  new MockStudentDashboardRepository();
