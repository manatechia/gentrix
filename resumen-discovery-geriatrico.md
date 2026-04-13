# Discovery Summary — Sistema para Geriátricos / RLE

## Objetivo de este documento
Resumen ejecutivo y estructurado de las conversaciones con negocio para usar como referencia rápida dentro del código y compartir con stakeholders.

Está escrito para que una IA o un desarrollador entienda rápido:
- qué problema se está resolviendo
- cuáles son los temas principales
- qué parece entrar al MVP
- qué no debería entrar todavía
- qué dudas siguen abiertas

---

## 1. Contexto general
El producto no debería pensarse como una simple ficha de paciente/residente.

Lo que apareció en las entrevistas es un sistema que cruza tres capas:
1. **Cumplimiento / habilitación provincial**
2. **Operación diaria del geriátrico**
3. **Continuidad del cuidado del residente**

Hoy gran parte de eso se resuelve con:
- papel
- cuadernos
- memoria operativa
- grupos de teléfono
- experiencia del personal

---

## 2. Hallazgos principales

### 2.1 La historia clínica es obligatoria
La historia clínica ya no es un extra. Es parte de los requisitos para habilitación provincial.

Implicancia:
- el producto no vende solo orden
- también vende cumplimiento documental y operativo

### 2.2 Hay dos capas de información distintas
#### Historia clínica
Incluye:
- datos personales
- familiares / responsables
- lugar donde se atiende
- médico de cabecera
- evoluciones
- prestaciones
- registros asistenciales

#### Historia de vida
Incluye:
- hábitos
- gustos
- rutinas
- vínculos familiares
- contexto emocional/social
- preferencias del día a día

Conclusión:
**historia clínica** e **historia de vida** no deberían mezclarse como una sola cosa.

### 2.3 El registro diario es por excepción, no exhaustivo
No se registra todo lo normal. Se registra lo relevante o anómalo.

Ejemplos:
- si comió normal, no se anota
- si no comió, sí se anota
- si estuvo como siempre, no se anota
- si estuvo distinto, sí se anota
- si no orinó o no evacuó cuando debía, sí se anota

Conclusión:
el sistema debe optimizar la carga de **novedades / excepciones**, no obligar a documentar cada cosa rutinaria.

### 2.4 El pase de guardia es central
El pase de guardia es un proceso operativo crítico.

Características:
- cambio de turno
- cama por cama / residente por residente
- chequeo presencial
- revisión de novedades
- continuidad entre guardias

Conclusión:
no debería modelarse como una nota libre cualquiera. Es un flujo propio del producto.

### 2.5 “En observación” es un estado operativo
“Observación” no significa diagnóstico. Significa que la persona está distinta y el próximo turno tiene que seguir mirándola.

Ejemplos:
- más callado de lo habitual
- menos apetito
- menos movilidad
- decaimiento inespecífico
- signos poco claros todavía

Conclusión:
el sistema debería poder poner a un residente **en observación**, seguirlo entre turnos y cerrarlo explícitamente.

### 2.6 Hay una cadena de escalamiento clara
Flujo operativo observado:
- asistente detecta algo
- enfermera valida / interpreta
- si no cierra, se escala a responsable / médico
- si es urgente, se llama a emergencias directamente

Conclusión:
el sistema debe permitir trazabilidad básica de:
- quién detectó
- quién validó
- a quién se escaló
- si hubo llamada a médico / emergencias

### 2.7 La enfermera es el nodo operativo del turno
No solo registra. También:
- supervisa asistentes
- interpreta señales
- organiza el turno
- valida novedades
- escala problemas
- participa del pase de guardia

Conclusión:
la enfermera es un rol clave y no puede ser tratada como un “usuario más”.

### 2.8 El residente no se identifica por cama
La identidad principal es la persona.

La operación usa:
- nombre
- nombre habitual
- apodo / forma de referencia

La cama/habitación:
- puede cambiar
- es logística
- no define identidad estable

Conclusión:
la entidad principal debe ser el **residente**, no la cama.

### 2.9 La ubicación física sigue siendo relevante
Aunque no define identidad, sí importa operativamente:
- habitación
- cama
- cambios de ubicación
- observación
- convivencia
- necesidad de equipos

Conclusión:
se necesita manejar **ubicación actual** e **historial de traslados**.

### 2.10 La admisión requiere valoración, no solo alta administrativa
Al ingresar a una persona se hace una valoración funcional/asistencial.

Se releva, entre otras cosas:
- movilidad
- alimentación
- piel / lesiones
- dependencia
- necesidad de asistencia
- complejidad del cuidado
- equipamiento especial

Conclusión:
el ingreso real parece ser:
**admisión + valoración geriátrica integral**, no solo alta administrativa.

### 2.11 El costo depende de la complejidad del cuidado
No está definido principalmente por comida.
Depende más de:
- nivel de dependencia
- necesidad de asistencia
- ayuda para comer
- postración
- necesidad de kinesiólogo
- uso de grúa u otros apoyos
- intensidad del cuidado

Conclusión:
a futuro el sistema podría reflejar complejidad de cuidado y su impacto operativo/económico.

### 2.12 Existe una necesidad real de stock, pero no parece el núcleo del MVP
Hoy controlan stock de:
- alimentos
- limpieza
- higiene
- mercadería general

Se lleva a mano y luego se pasa a Drive.

Conclusión:
existe como necesidad real, pero en las entrevistas no apareció como el dolor principal comparado con cuidado, guardias y cumplimiento.

---

## 3. Temas principales detectados

### A. Cumplimiento / habilitación
- historia clínica obligatoria
- habilitación provincial vs municipal
- categorías/modalidades del establecimiento
- roles mínimos
- espacios y condiciones mínimas

### B. Admisión del residente
- datos personales
- responsables/familia
- médico de cabecera
- modalidad de ingreso
- evaluación inicial
- valoración geriátrica integral

### C. Historia del residente
- historia clínica
- historia de vida
- hábitos
- gustos
- rutina
- contexto social/familiar

### D. Seguimiento asistencial
- evolución médica semanal
- evolución de enfermería
- curaciones
- kinesiología
- podología
- otras prestaciones

### E. Operación de turnos
- turno mañana / tarde / noche
- pase de guardia
- entrega / recepción
- cuaderno/report
- continuidad entre turnos

### F. Registro por excepción
- no comió
- no orinó
- no evacuó
- no quiso levantarse
- conducta inusual
- lesiones / moretones / ronchas
- cambios relevantes

### G. Observación e incidencias
- residente en observación
- motivo de observación
- seguimiento por turno
- cierre de observación
- urgencias / emergencias

### H. Roles
- mucama
- asistente
- enfermera
- médico
- responsable / directora

### I. Ubicación física
- habitación
- cama
- cambios de cama/habitación
- espacio de observación / enfermería

### J. Gestión
- complejidad del residente
- costo asociado al cuidado
- stock e insumos

---

## 4. Entidades / conceptos de dominio detectados
Estos conceptos aparecen como candidatos fuertes a modelo de dominio.

### Núcleo
- Residente
- Admisión
- Responsable / familiar
- Historia clínica
- Historia de vida
- Valoración geriátrica integral

### Operación diaria
- Turno
- Pase de guardia
- Novedad
- Observación
- Incidencia
- Escalamiento

### Atención asistencial
- Evolución médica
- Evolución de enfermería
- Prestación / intervención
- Actividad

### Logística
- Habitación
- Cama
- Asignación de cama
- Historial de traslados

### Organización
- Rol
- Usuario / personal
- Dotación mínima / estructura operativa

### Gestión futura
- Complejidad del cuidado
- Costo del residente
- Stock / insumos

---

## 5. Flujos operativos detectados

### 5.1 Ingreso de residente
1. entrevista con familia / responsables
2. recolección de datos personales y contexto
3. valoración geriátrica integral
4. definición del nivel de dependencia / cuidado
5. asignación inicial de ubicación
6. apertura de historia clínica + historia de vida

### 5.2 Turno diario
1. personal atiende residentes
2. registra excepciones y novedades
3. enfermería valida o interpreta situaciones
4. si corresponde, escala a responsable / médico / emergencias

### 5.3 Pase de guardia
1. entra nuevo turno
2. se revisa residente por residente
3. se leen / transmiten novedades
4. se detectan omisiones o nuevos hallazgos
5. se deja continuidad al siguiente turno

### 5.4 Observación
1. un residente aparece “distinto”
2. se marca en observación
3. el siguiente turno sigue mirando
4. puede cerrarse o escalarse

---

## 6. Qué parece entrar al MVP
Esto no es alcance cerrado todavía. Es una primera lectura de lo más fuerte que apareció.

### Muy probable MVP
- alta / admisión básica del residente
- datos personales y responsables
- historia clínica básica
- historia de vida básica
- valoración de ingreso
- gestión de turnos
- pase de guardia
- registro de novedades / excepciones
- estado “en observación”
- incidencias relevantes
- evoluciones / prestaciones básicas
- habitación/cama como dato operativo
- roles básicos del personal

### Importante pero posiblemente segunda etapa
- trazabilidad más profunda de escalamiento
- reportes de cumplimiento
- cálculo operativo de complejidad
- historial más fino de movimientos
- actividades y participación más completas

### Parece posterior / no core MVP
- stock completo
- costos avanzados
- pricing detallado por complejidad
- reportes financieros
- soporte exhaustivo de todas las modalidades comerciales
- cumplimiento normativo fino de todas las variantes

---

## 7. Qué no conviene hacer en la primera versión
- modelar el sistema solo como “ficha de paciente”
- modelar identidad por cama/habitación
- obligar carga exhaustiva de todo en todos los turnos
- mezclar historia clínica con historia de vida sin separación
- arrancar por stock/finanzas antes de resolver operación diaria
- imponer una lógica hospitalaria rígida que no refleje cómo trabaja realmente un geriátrico

---

## 8. Dudas abiertas / temas a validar después
Estos puntos siguen abiertos y son claves para definir alcance fino.

- qué puede registrar cada rol
- qué requiere validación de enfermería
- qué requiere firma médica o profesional
- qué parte del cuaderno/report pasa a historia formal
- qué instrumento exacto usan para la valoración geriátrica
- qué reportes realmente necesitan en el día a día
- qué documentación revisa concretamente una inspección
- qué necesita ver cada perfil de usuario
- qué entra realmente en el MVP y qué queda fuera

---

## 9. Conclusión ejecutiva
La conversación no describe un simple sistema de fichas.

Describe un producto que debería cubrir este núcleo:

**admisión + perfil del residente + historia clínica + historia de vida + valoración de ingreso + guardias + pase de guardia + observación + novedades/incidencias + continuidad del cuidado**

La mejor forma de pensar el producto es como un sistema para:
- sostener la operación diaria
- documentar lo importante
- mejorar la continuidad entre turnos
- y ayudar a cumplir con requisitos formales

---

## 10. Próximo paso sugerido
Usar este documento para construir una tabla con tres columnas:
- **entra al MVP**
- **no entra al MVP**
- **queda abierto / requiere validación**

Y después bajar eso a tareas concretas con Codex.
