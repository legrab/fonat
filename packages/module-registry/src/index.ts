import { generatedInstalledModules } from './generated.js';
export { generatedInstalledModules } from './generated.js';
export const installedModules = generatedInstalledModules;
export const registeredNodeTypes = [
  ...new Set(installedModules.flatMap((module) => ('nodeTypes' in module ? (module.nodeTypes ?? []) : [])))
];
export const registeredRelationTypes = [
  ...new Set(
    installedModules.flatMap((module) => ('relationTypes' in module ? (module.relationTypes ?? []) : []))
  )
];
export const registeredExerciseTypes = [
  ...new Set(
    installedModules.flatMap((module) => ('exerciseTypes' in module ? (module.exerciseTypes ?? []) : []))
  )
];

type PortableSchema = { safeParse(value: unknown): { success: boolean; data?: unknown; error?: unknown } };
const payloadSchemas = new Map<string, PortableSchema>();
for (const module of installedModules) {
  if (!('payloadSchemas' in module) || !module.payloadSchemas) continue;
  for (const [type, schema] of Object.entries(module.payloadSchemas))
    payloadSchemas.set(type, schema as PortableSchema);
}

export function isRegisteredNodeType(value: string) {
  return registeredNodeTypes.includes(value as never);
}
export function isRegisteredRelationType(value: string) {
  return registeredRelationTypes.includes(value as never);
}
export function validateRegisteredNodePayload(type: string, payload: unknown) {
  if (!isRegisteredNodeType(type))
    return { success: false as const, reason: `Unregistered node type: ${type}` };
  const schema = payloadSchemas.get(type);
  if (!schema)
    return { success: false as const, reason: `No payload schema registered for node type: ${type}` };
  const parsed = schema.safeParse(payload);
  return parsed.success
    ? { success: true as const, data: parsed.data }
    : { success: false as const, reason: `Invalid ${type} payload`, details: parsed.error };
}
