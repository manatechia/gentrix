import type {
  ApiEnvelope,
  TeamMemberOverview,
  UserSchedule,
  UserScheduleCreateInput,
  UserScheduleUpdateInput,
} from '@gentrix/shared-types';

import { apiClient } from '../../../shared/config/api-client';

export async function getTeam(): Promise<ApiEnvelope<TeamMemberOverview[]>> {
  const response =
    await apiClient.get<ApiEnvelope<TeamMemberOverview[]>>('/api/users/team');

  return response.data;
}

export async function getUserSchedules(
  userId: string,
): Promise<ApiEnvelope<UserSchedule[]>> {
  const response = await apiClient.get<ApiEnvelope<UserSchedule[]>>(
    `/api/users/${userId}/schedules`,
  );

  return response.data;
}

export async function createUserSchedule(
  userId: string,
  input: UserScheduleCreateInput,
): Promise<ApiEnvelope<UserSchedule>> {
  const response = await apiClient.post<ApiEnvelope<UserSchedule>>(
    `/api/users/${userId}/schedules`,
    input,
  );

  return response.data;
}

export async function updateUserSchedule(
  scheduleId: string,
  input: UserScheduleUpdateInput,
): Promise<ApiEnvelope<UserSchedule>> {
  const response = await apiClient.put<ApiEnvelope<UserSchedule>>(
    `/api/users/schedules/${scheduleId}`,
    input,
  );

  return response.data;
}
