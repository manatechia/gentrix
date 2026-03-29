import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  StaffSchedule,
  StaffScheduleCreateInput,
  StaffScheduleUpdateInput,
} from '@gentrix/shared-types';

import { StaffService } from '../../staff/application/staff.service';
import {
  SCHEDULE_REPOSITORY,
  type ScheduleRepository,
} from '../domain/repositories/schedule.repository';

@Injectable()
export class SchedulesService {
  constructor(
    @Inject(SCHEDULE_REPOSITORY)
    private readonly scheduleRepository: ScheduleRepository,
    @Inject(StaffService)
    private readonly staffService: StaffService,
  ) {}

  async listByStaffId(staffId: string): Promise<StaffSchedule[]> {
    await this.staffService.getStaffEntityById(staffId);
    return this.scheduleRepository.listByStaffId(staffId as StaffSchedule['staffId']);
  }

  async create(
    staffId: string,
    input: StaffScheduleCreateInput,
    actor: string,
  ): Promise<StaffSchedule> {
    await this.staffService.getStaffEntityById(staffId);
    validateScheduleInput(input);

    return this.scheduleRepository.create(
      staffId as StaffSchedule['staffId'],
      normalizeScheduleInput(input),
      actor,
    );
  }

  async update(
    scheduleId: string,
    input: StaffScheduleUpdateInput,
    actor: string,
  ): Promise<StaffSchedule> {
    const existingSchedule = await this.scheduleRepository.findById(
      scheduleId as StaffSchedule['id'],
    );

    if (!existingSchedule) {
      throw new NotFoundException('No encontre el horario solicitado.');
    }

    await this.staffService.getStaffEntityById(existingSchedule.staffId);
    validateScheduleInput(input);

    return this.scheduleRepository.update(
      scheduleId as StaffSchedule['id'],
      normalizeScheduleInput(input),
      actor,
    );
  }
}

function validateScheduleInput(
  input: StaffScheduleCreateInput | StaffScheduleUpdateInput,
): void {
  if (input.weekday < 1 || input.weekday > 7) {
    throw new BadRequestException('El dia semanal debe estar entre 1 y 7.');
  }

  if (input.startTime >= input.endTime) {
    throw new BadRequestException(
      'La hora de inicio debe ser anterior a la hora de fin.',
    );
  }
}

function normalizeScheduleInput(
  input: StaffScheduleCreateInput | StaffScheduleUpdateInput,
): StaffScheduleCreateInput {
  return {
    weekday: input.weekday,
    startTime: input.startTime.trim(),
    endTime: input.endTime.trim(),
    exceptionDate: input.exceptionDate?.trim() || undefined,
    coverageNote: input.coverageNote?.trim() || undefined,
  };
}
