import type {
  ApiEnvelope,
  StaffOverview,
  StaffSchedule,
  StaffScheduleCreateInput,
  StaffScheduleUpdateInput,
} from '@gentrix/shared-types';

import { apiClient } from '../../../shared/config/api-client';

export async function getStaff(): Promise<ApiEnvelope<StaffOverview[]>> {
  const response = await apiClient.get<ApiEnvelope<StaffOverview[]>>('/api/staff');

  return response.data;
}

export async function getStaffSchedules(
  staffId: string,
): Promise<ApiEnvelope<StaffSchedule[]>> {
  const response = await apiClient.get<ApiEnvelope<StaffSchedule[]>>(
    `/api/staff/${staffId}/schedules`,
  );

  return response.data;
}

export async function createStaffSchedule(
  staffId: string,
  input: StaffScheduleCreateInput,
): Promise<ApiEnvelope<StaffSchedule>> {
  const response = await apiClient.post<ApiEnvelope<StaffSchedule>>(
    `/api/staff/${staffId}/schedules`,
    input,
  );

  return response.data;
}

export async function updateStaffSchedule(
  scheduleId: string,
  input: StaffScheduleUpdateInput,
): Promise<ApiEnvelope<StaffSchedule>> {
  const response = await apiClient.put<ApiEnvelope<StaffSchedule>>(
    `/api/staff/schedules/${scheduleId}`,
    input,
  );

  return response.data;
}
