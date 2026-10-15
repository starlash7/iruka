import {createApiClient, type ApiClientOptions} from '../../../shared/apiClient.ts';
import type {PersonaDto} from '../../../shared/contracts.ts';
export type PersonaInput = Pick<PersonaDto, 'name' | 'description'>;
export function validatePersona(input: PersonaInput): string {
  if (!input.name.trim() || input.name.length > 50) return '이름은 1~50자로 입력해 주세요.';
  if (input.description.length > 500) return '소개는 500자 이내로 입력해 주세요.';
  return '';
}
export function createPersonaClient(options: ApiClientOptions) {
  const api = createApiClient(options);
  const path = '/api/me/personas';
  async function save(path: string, method: string, input: PersonaInput) {
    const error = validatePersona(input);
    if (error) throw new Error(error);
    return (await api.request<PersonaDto>(path, {method, headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({...input, name: input.name.trim()})})).data;
  }
  return {
    list: async () => (await api.request<PersonaDto[]>(path)).data,
    create: (input: PersonaInput) => save(path, 'POST', input),
    // Integration request: PATCH/DELETE do not exist in baseline 8ada036.
    update: (id: string, input: PersonaInput) => save(`${path}/${encodeURIComponent(id)}`, 'PATCH', input),
    remove: async (id: string) => { await api.request<null>(`${path}/${encodeURIComponent(id)}`, {method: 'DELETE'}); },
  };
}
export type PersonaClient = ReturnType<typeof createPersonaClient>;
