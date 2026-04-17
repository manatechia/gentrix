# Deuda técnica: sobrediseño heredado de asistentes de IA

**Estado:** abierta
**Origen:** auditoría del repo el 2026-04-17 tras limpiar carpetas de asistentes de IA, worktrees, `.github/` de skills, docs duplicados y `scripts/` innecesarios.
**Alcance estimado:** ~500+ líneas de boilerplate repartidas entre `apps/backend` y `apps/frontend`.

## Contexto

Gran parte del código se generó con asistentes de IA (Claude, Codex, Cursor y otros).
El patrón recurrente es DDD "textbook" aplicado sin dominio complejo que lo
justifique: repositorios con una sola implementación, query services con mappers
dedicados, adaptadores triviales, tipos fragmentados y validaciones duplicadas.

Esta deuda no bloquea producto, pero pesa en:

- tiempo de lectura y onboarding
- fricción al agregar features (hay que pasar por varias capas triviales)
- mantenimiento de mappers y tipos en paralelo

## Inventario

### Pesados (mayor retorno al refactorizar)

1. **Repository pattern con una sola implementación**
   - 13 módulos con `*Repository` interface + Symbol + `Prisma*Repository`.
   - Ej: `apps/backend/src/modules/medication/infrastructure/persistence/prisma/prisma-medication.repository.ts`
     son ~176 líneas de mapping Prisma→Domain sin variaciones reales.
   - Dev normal: `PrismaService` directo en el service, o un helper genérico.

2. **Query Services con mappers dedicados**
   - `apps/backend/src/modules/residents/application/resident-live-profile.query.service.ts`
     con `toResidentLiveProfileResident` de ~30 líneas.
   - Dev normal: mapping inline en el controller o un helper chico.

3. **Validación duplicada DTO + Service**
   - `apps/backend/src/modules/medication/application/medication.service.ts`
     líneas 280-384 repiten regex y validaciones que los decoradores
     `@IsArray`, `@Matches`, `@MaxLength` ya cubren en el DTO.
   - Dev normal: confiar en el DTO; mover solo reglas de dominio al service.

### Medios

4. **Tipos fragmentados para formularios**
   - `apps/frontend/src/features/residents/types/resident-form-values.ts` define
     11 interfaces (`ResidentInsuranceFormValues`, `ResidentTransferFormValues`,
     `ResidentPsychiatryFormValues`, etc.) para el mismo formulario. 123 líneas.
   - Dev normal: un `type` plano o un schema Yup/Zod que deduplica solo.

5. **Adaptadores triviales**
   - `apps/frontend/src/features/medication/lib/medication-form-adapter.ts`:
     `toMedicationEditFormValues` solo llama a `toMedicationFormValues`.
     38 líneas para 8 campos.
   - Dev normal: mapping inline en el hook.

6. **Helpers de fechas hechos a mano**
   - `apps/frontend/src/features/residents/lib/resident-form-utils.ts`, ~216
     líneas de parseo de fechas. `toResidentBirthDateIso` es alias muerto de
     `toResidentDateIso`.
   - Dev normal: `date-fns` o un schema de validación.

### Chicos

7. **Wrappers de axios de 1-2 líneas**
   - `apps/frontend/src/shared/lib/api-envelope.ts`: `unwrapEnvelope` es
     literalmente `payload.data`.
   - Dev normal: interceptor de axios configurado una vez.

8. **Constantes de Tailwind "reutilizables"**
   - `apps/frontend/src/shared/ui/class-names.ts`: 7 strings de clases que
     aparecen 2-3 veces en todo el repo.
   - Dev normal: inline + `cn()`.

9. **Componentes extraídos sin reuso**
   - `apps/frontend/src/features/dashboard/ui/` tiene componentes como
     `StatusNotice.tsx` y `WorkspaceToolbar.tsx` usados 1-2 veces con texto
     hardcodeado en español.
   - Dev normal: JSX inline hasta que haya reuso real.

10. **Métodos privados de 2 líneas**
    - `apps/backend/src/modules/medication/application/medication.service.ts`
      líneas 252-278 extraen `getRequiredMedicationCatalogItem` y
      `getRequiredMedicationOrder` como métodos privados por "legibilidad".
    - Dev normal: inline en el método público.

## Riesgos si no se aborda

- Cada nueva feature replica el patrón y la deuda crece.
- Onboarding se alarga porque hay que entender 4 capas para una operación CRUD.
- Refactors futuros (ej. migrar a TanStack Query en frontend, o mover lógica a
  libs de dominio) son más caros por la cantidad de mappers paralelos a mantener.

## Cómo abordarlo

Tres olas sugeridas, en orden de seguridad:

1. **Ola segura (items 3, 6, 7, 8, 10):** borrar duplicación local. Son cambios
   acotados a un archivo o a helpers aislados. Bajo riesgo, lectura más limpia.
2. **Ola media (items 4, 5, 9):** consolidar tipos/adapters de formularios e
   inlinear componentes poco reusados. Requiere revisar imports, pero contenido
   en frontend.
3. **Ola pesada (items 1, 2):** remover la capa de repositorios y query services
   en módulos donde solo hay Prisma. Es el cambio con más retorno pero también
   el más invasivo: tocar todos los services, tests y registros DI.

No es obligatorio hacer las tres; el MVP funciona con la deuda actual. Abordar
cuando duela concretamente (ej. cuando agregar una feature se siente lento o
repetitivo).

## Referencias

- Auditoría completa: ver historial de conversación del 2026-04-17.
- Patrón inverso recomendado: ver `docs/engineering-working-agreement.md`
  sección DDD — el acuerdo permite DDD, pero no obliga a abstracciones sin
  variaciones reales.
