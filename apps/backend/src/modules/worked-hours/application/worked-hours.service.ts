import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  EntityId,
  HourSettlement,
  HourSettlementDetail,
  HourSettlementIssueInput,
  HourSettlementLine,
  HourSettlementPeriodInput,
  HourSettlementPreview,
  IsoDateString,
  MembershipHourlyRate,
  MembershipHourlyRateCreateInput,
  MembershipHourlyRateUpdateInput,
  WorkedHourEntry,
  WorkedHourEntryCreateInput,
  WorkedHourEntryUpdateInput,
} from '@gentrix/shared-types';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { UsersService } from '../../users/application/users.service';
import {
  HOUR_SETTLEMENT_REPOSITORY,
  type HourSettlementRepository,
  type SettlementEntryFreeze,
} from '../domain/repositories/hour-settlement.repository';
import {
  HOURLY_RATE_REPOSITORY,
  type HourlyRateRepository,
} from '../domain/repositories/hourly-rate.repository';
import {
  WORKED_HOUR_ENTRY_REPOSITORY,
  type WorkedHourEntryRepository,
} from '../domain/repositories/worked-hour-entry.repository';

@Injectable()
export class WorkedHoursService {
  constructor(
    @Inject(HOURLY_RATE_REPOSITORY)
    private readonly rates: HourlyRateRepository,
    @Inject(WORKED_HOUR_ENTRY_REPOSITORY)
    private readonly entries: WorkedHourEntryRepository,
    @Inject(HOUR_SETTLEMENT_REPOSITORY)
    private readonly settlements: HourSettlementRepository,
    @Inject(UsersService)
    private readonly users: UsersService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  // ---- Tarifas ----------------------------------------------------------

  async listHourlyRates(
    userId: string,
    organizationId: string,
  ): Promise<MembershipHourlyRate[]> {
    const membershipId = await this.resolveExternalMembership(
      userId,
      organizationId,
    );
    return this.rates.listByMembership(membershipId as EntityId);
  }

  async createHourlyRate(
    userId: string,
    input: MembershipHourlyRateCreateInput,
    actor: string,
    organizationId: string,
  ): Promise<MembershipHourlyRate> {
    const membershipId = await this.resolveExternalMembership(
      userId,
      organizationId,
    );
    const effectiveFrom = parseDateOnly(
      input.effectiveFrom,
      'effectiveFrom',
    );

    // Cierra la tarifa previa vigente en `effectiveFrom - 1 día` para que
    // no queden dos tarifas activas al mismo tiempo.
    await this.rates.closePrevious(
      membershipId as EntityId,
      effectiveFrom,
      actor,
    );

    return this.rates.create({
      membershipId: membershipId as EntityId,
      rate: input.rate,
      currency: input.currency,
      effectiveFrom,
      actor,
    });
  }

  async updateHourlyRate(
    rateId: string,
    input: MembershipHourlyRateUpdateInput,
    actor: string,
    organizationId: string,
  ): Promise<MembershipHourlyRate> {
    const existing = await this.rates.findById(rateId as EntityId);
    if (!existing) {
      throw new NotFoundException('No encontré la tarifa.');
    }
    // Autoriza al caller: la tarifa tiene que pertenecer a la org activa.
    await this.resolveExternalMembership(existing.userId, organizationId);

    return this.rates.update(rateId as EntityId, {
      rate: input.rate,
      currency: input.currency,
      effectiveFrom: input.effectiveFrom
        ? parseDateOnly(input.effectiveFrom, 'effectiveFrom')
        : undefined,
      actor,
    });
  }

  // ---- Entries ----------------------------------------------------------

  async listEntries(
    userId: string,
    organizationId: string,
    options: { from?: string; to?: string; settled?: boolean },
  ): Promise<WorkedHourEntry[]> {
    const membershipId = await this.resolveExternalMembership(
      userId,
      organizationId,
    );
    return this.entries.listByMembership(membershipId as EntityId, {
      from: options.from ? parseDateOnly(options.from, 'from') : undefined,
      to: options.to ? parseDateOnly(options.to, 'to') : undefined,
      settled: options.settled,
    });
  }

  async createEntry(
    userId: string,
    input: WorkedHourEntryCreateInput,
    actor: string,
    organizationId: string,
  ): Promise<WorkedHourEntry> {
    const membershipId = await this.resolveExternalMembership(
      userId,
      organizationId,
    );
    return this.entries.create({
      membershipId: membershipId as EntityId,
      workDate: parseDateOnly(input.workDate, 'workDate'),
      hours: input.hours,
      notes: input.notes ?? null,
      actor,
    });
  }

  async updateEntry(
    entryId: string,
    input: WorkedHourEntryUpdateInput,
    actor: string,
    organizationId: string,
  ): Promise<WorkedHourEntry> {
    const existing = await this.entries.findById(entryId as EntityId);
    if (!existing) {
      throw new NotFoundException('No encontré la entrada de horas.');
    }
    if (existing.settlementId !== null) {
      throw new ConflictException(
        'La entrada ya fue liquidada; cancelá la liquidación para volver a editarla.',
      );
    }
    await this.resolveExternalMembership(existing.userId, organizationId);

    return this.entries.update(entryId as EntityId, {
      workDate: parseDateOnly(input.workDate, 'workDate'),
      hours: input.hours,
      notes: input.notes ?? null,
      actor,
    });
  }

  async deleteEntry(
    entryId: string,
    actor: string,
    organizationId: string,
  ): Promise<void> {
    const existing = await this.entries.findById(entryId as EntityId);
    if (!existing) {
      throw new NotFoundException('No encontré la entrada de horas.');
    }
    if (existing.settlementId !== null) {
      throw new ConflictException(
        'No se puede eliminar una entrada liquidada.',
      );
    }
    await this.resolveExternalMembership(existing.userId, organizationId);
    await this.entries.softDelete(entryId as EntityId, actor);
  }

  // ---- Settlements ------------------------------------------------------

  async previewSettlement(
    userId: string,
    input: HourSettlementPeriodInput,
    organizationId: string,
  ): Promise<HourSettlementPreview> {
    const membershipId = await this.resolveExternalMembership(
      userId,
      organizationId,
    );
    const { periodStart, periodEnd } = this.parsePeriod(input);

    const entries = await this.entries.listByMembership(
      membershipId as EntityId,
      { from: periodStart, to: periodEnd, settled: false },
    );

    if (entries.length === 0) {
      throw new BadRequestException(
        'No hay horas sin liquidar en el período seleccionado.',
      );
    }

    const lines = await Promise.all(
      entries.map(async (entry) => {
        const rate = await this.rates.findApplicable(
          membershipId as EntityId,
          parseDateOnly(entry.workDate, 'workDate'),
        );
        if (!rate) {
          throw new ConflictException(
            `No hay tarifa vigente para la fecha ${entry.workDate}.`,
          );
        }
        const subtotal = (
          Number.parseFloat(entry.hours) * Number.parseFloat(rate.rate)
        ).toFixed(2);
        const line: HourSettlementLine = {
          entryId: entry.id,
          workDate: entry.workDate,
          hours: entry.hours,
          appliedRate: rate.rate,
          appliedCurrency: rate.currency,
          subtotal,
          notes: entry.notes,
        };
        return line;
      }),
    );

    const currencies = new Set(lines.map((line) => line.appliedCurrency));
    if (currencies.size > 1) {
      throw new ConflictException(
        'El período mezcla monedas distintas; dividí el rango o unificá la tarifa antes de liquidar.',
      );
    }

    const totalHours = lines
      .reduce((acc, line) => acc + Number.parseFloat(line.hours), 0)
      .toFixed(2);
    const totalAmount = lines
      .reduce((acc, line) => acc + Number.parseFloat(line.subtotal), 0)
      .toFixed(2);

    return {
      userId: userId as HourSettlementPreview['userId'],
      periodStart: input.periodStart as IsoDateString,
      periodEnd: input.periodEnd as IsoDateString,
      lines,
      totalHours,
      totalAmount,
      currency: lines[0]?.appliedCurrency ?? 'ARS',
    };
  }

  async issueSettlement(
    userId: string,
    input: HourSettlementIssueInput,
    actor: string,
    organizationId: string,
  ): Promise<HourSettlementDetail> {
    const membershipId = await this.resolveExternalMembership(
      userId,
      organizationId,
    );
    const { periodStart, periodEnd } = this.parsePeriod(input);

    const overlap = await this.settlements.findOverlappingActive(
      membershipId as EntityId,
      periodStart,
      periodEnd,
    );
    if (overlap) {
      throw new ConflictException(
        `El período se superpone con la liquidación existente ${overlap.periodStart} → ${overlap.periodEnd}.`,
      );
    }

    const preview = await this.previewSettlement(
      userId,
      { periodStart: input.periodStart, periodEnd: input.periodEnd },
      organizationId,
    );

    const frozen: SettlementEntryFreeze[] = preview.lines.map((line) => ({
      entryId: line.entryId,
      appliedRate: line.appliedRate,
      appliedCurrency: line.appliedCurrency,
    }));

    return this.settlements.issue(
      {
        membershipId: membershipId as EntityId,
        periodStart,
        periodEnd,
        notes: input.notes ?? null,
        actor,
      },
      frozen,
    );
  }

  async listSettlements(
    userId: string,
    organizationId: string,
  ): Promise<HourSettlement[]> {
    const membershipId = await this.resolveExternalMembership(
      userId,
      organizationId,
    );
    return this.settlements.listByMembership(membershipId as EntityId);
  }

  async getSettlementDetail(
    settlementId: string,
    organizationId: string,
  ): Promise<HourSettlementDetail> {
    const detail = await this.settlements.findDetailById(
      settlementId as EntityId,
    );
    if (!detail) {
      throw new NotFoundException('No encontré la liquidación.');
    }
    await this.resolveExternalMembership(detail.userId, organizationId);
    return detail;
  }

  async markSettlementPaid(
    settlementId: string,
    actor: string,
    organizationId: string,
  ): Promise<HourSettlementDetail> {
    const existing = await this.settlements.findById(settlementId as EntityId);
    if (!existing) {
      throw new NotFoundException('No encontré la liquidación.');
    }
    if (existing.status === 'cancelled') {
      throw new ConflictException(
        'No se puede marcar como pagada una liquidación cancelada.',
      );
    }
    if (existing.status === 'paid') {
      throw new ConflictException('La liquidación ya estaba marcada como pagada.');
    }
    await this.resolveExternalMembership(existing.userId, organizationId);
    return this.settlements.markPaid(settlementId as EntityId, actor);
  }

  async cancelSettlement(
    settlementId: string,
    actor: string,
    organizationId: string,
  ): Promise<HourSettlementDetail> {
    const existing = await this.settlements.findById(settlementId as EntityId);
    if (!existing) {
      throw new NotFoundException('No encontré la liquidación.');
    }
    if (existing.status === 'cancelled') {
      throw new ConflictException('La liquidación ya está cancelada.');
    }
    await this.resolveExternalMembership(existing.userId, organizationId);
    return this.settlements.cancel(settlementId as EntityId, actor);
  }

  // ---- Helpers ----------------------------------------------------------

  private parsePeriod(input: HourSettlementPeriodInput): {
    periodStart: Date;
    periodEnd: Date;
  } {
    const periodStart = parseDateOnly(input.periodStart, 'periodStart');
    const periodEnd = parseDateOnly(input.periodEnd, 'periodEnd');
    if (periodEnd < periodStart) {
      throw new BadRequestException(
        'El fin del período debe ser posterior o igual al inicio.',
      );
    }
    return { periodStart, periodEnd };
  }

  /// Resuelve `userId` a un `membershipId` de la org activa y verifica que
  /// el rol sea `external`. Es la única puerta de entrada a las
  /// operaciones de worked-hours en fase 1.
  private async resolveExternalMembership(
    userId: string,
    organizationId: string,
  ): Promise<string> {
    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        userId,
        organizationId,
        deletedAt: null,
        user: { deletedAt: null },
      },
      include: { role: true },
    });
    if (!membership) {
      throw new NotFoundException(
        'El usuario no pertenece a esta organización.',
      );
    }
    if (membership.role.code !== 'external') {
      throw new ForbiddenException(
        'La carga y liquidación de horas en fase 1 está habilitada sólo para usuarios externos.',
      );
    }
    return membership.id;
  }
}

function parseDateOnly(value: string, field: string): Date {
  const match = /^\d{4}-\d{2}-\d{2}/.exec(value);
  if (!match) {
    throw new BadRequestException(
      `El campo ${field} debe venir en formato YYYY-MM-DD.`,
    );
  }
  const date = new Date(`${match[0]}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`El campo ${field} es una fecha inválida.`);
  }
  return date;
}
