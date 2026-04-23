import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  UserSchedule,
  UserScheduleCreateInput,
  UserScheduleUpdateInput,
} from '@gentrix/shared-types';

import { UsersService } from '../../users/application/users.service';
import {
  SCHEDULE_REPOSITORY,
  type ScheduleRepository,
} from '../domain/repositories/schedule.repository';

@Injectable()
export class SchedulesService {
  constructor(
    @Inject(SCHEDULE_REPOSITORY)
    private readonly scheduleRepository: ScheduleRepository,
    @Inject(UsersService)
    private readonly usersService: UsersService,
  ) {}

  async listByUserId(
    userId: string,
    organizationId: string,
  ): Promise<UserSchedule[]> {
    const membershipId = await this.usersService.getMembershipIdForUser(
      userId,
      organizationId,
    );

    return this.scheduleRepository.listByMembershipId(
      membershipId as UserSchedule['userId'],
    );
  }

  async create(
    userId: string,
    input: UserScheduleCreateInput,
    actor: string,
    organizationId: string,
  ): Promise<UserSchedule> {
    const membershipId = await this.usersService.getMembershipIdForUser(
      userId,
      organizationId,
    );
    validateScheduleInput(input);

    return this.scheduleRepository.create(
      membershipId as UserSchedule['userId'],
      userId as UserSchedule['userId'],
      normalizeScheduleInput(input),
      actor,
    );
  }

  async update(
    scheduleId: string,
    input: UserScheduleUpdateInput,
    actor: string,
    organizationId: string,
  ): Promise<UserSchedule> {
    const existingSchedule = await this.scheduleRepository.findById(
      scheduleId as UserSchedule['id'],
    );

    if (!existingSchedule) {
      throw new NotFoundException('No encontre el horario solicitado.');
    }

    // Verifico que el usuario dueño del schedule pertenezca a la org del
    // caller; si no, 404 en vez de exponer datos.
    await this.usersService.getMembershipIdForUser(
      existingSchedule.userId,
      organizationId,
    );
    validateScheduleInput(input);

    return this.scheduleRepository.update(
      scheduleId as UserSchedule['id'],
      existingSchedule.userId,
      normalizeScheduleInput(input),
      actor,
    );
  }
}

function validateScheduleInput(
  input: UserScheduleCreateInput | UserScheduleUpdateInput,
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
  input: UserScheduleCreateInput | UserScheduleUpdateInput,
): UserScheduleCreateInput {
  return {
    weekday: input.weekday,
    startTime: input.startTime.trim(),
    endTime: input.endTime.trim(),
    exceptionDate: input.exceptionDate?.trim() || undefined,
    coverageNote: input.coverageNote?.trim() || undefined,
  };
}
