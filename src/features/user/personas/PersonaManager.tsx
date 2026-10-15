import {useEffect, useRef, useState, type FormEvent} from 'react';
import {Button, Input, Modal} from '../../../ui';
import type {PersonaDto} from '../../../shared/contracts';
import {validatePersona, type PersonaClient} from './client';
import './personas.css';

export function PersonaManager({client}: {client: PersonaClient}) {
  const [personas, setPersonas] = useState<PersonaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState<PersonaDto | 'new' | null>(null);
  const [deleting, setDeleting] = useState<PersonaDto | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const pending = useRef(false);
  const newButton = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError('');
    client.list().then(items => { if (active) setPersonas(items); })
      .catch(() => { if (active) setLoadError('페르소나를 불러오지 못했어요. 다시 시도해 주세요.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [client, revision]);
  useEffect(() => {
    if (deleting || notice !== '삭제했어요.') return;
    const frame = requestAnimationFrame(() => newButton.current?.querySelector('button')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [deleting, notice]);
  function openEditor(persona: PersonaDto | 'new') {
    setName(persona === 'new' ? '' : persona.name);
    setDescription(persona === 'new' ? '' : persona.description);
    setError(''); setNotice(''); setEditor(persona);
  }
  function closeDialog() {
    if (pending.current) return;
    setEditor(null); setDeleting(null); setError('');
  }
  async function savePersona(event: FormEvent) {
    event.preventDefault();
    if (pending.current || !editor) return;
    const invalid = validatePersona({name, description});
    if (invalid) { setError(invalid); return; }
    pending.current = true; setBusy(true); setError('');
    try {
      const saved = editor === 'new' ? await client.create({name, description}) : await client.update(editor.id, {name, description});
      setPersonas(items => editor === 'new' ? [...items, saved] : items.map(item => item.id === saved.id ? saved : item));
      setEditor(null); setNotice('저장했어요.');
    } catch { setError('저장하지 못했어요. 입력 내용을 확인하고 다시 시도해 주세요.'); }
    finally { pending.current = false; setBusy(false); }
  }
  async function deletePersona() {
    if (pending.current || !deleting) return;
    pending.current = true; setBusy(true); setError('');
    try {
      await client.remove(deleting.id);
      setPersonas(items => items.filter(item => item.id !== deleting.id));
      setDeleting(null); setNotice('삭제했어요.');
    } catch { setError('삭제하지 못했어요. 다시 시도해 주세요.'); }
    finally { pending.current = false; setBusy(false); }
  }
  return <div className="personas">
    <div ref={newButton}><Button disabled={loading || !!loadError} onClick={() => openEditor('new')}>새 페르소나</Button></div>
    <p role="status" className="persona-notice">{notice}</p>
    {loading && <p role="status">불러오는 중…</p>}
    {loadError && <div><p role="alert">{loadError}</p><Button variant="secondary" onClick={() => setRevision(value => value + 1)}>다시 시도</Button></div>}
    {!loading && !loadError && !personas.length && <p>아직 페르소나가 없어요.</p>}
    {!loading && !loadError && <ul className="persona-list">{personas.map(persona => <li key={persona.id} className="persona-card">
      <h2>{persona.name}</h2><p className="persona-description">{persona.description || '소개 없음'}</p>
      <div className="persona-actions">
        <Button variant="secondary" aria-label={`${persona.name} 수정`} onClick={() => openEditor(persona)}>수정</Button>
        <Button variant="ghost" aria-label={`${persona.name} 삭제`} onClick={() => { setError(''); setNotice(''); setDeleting(persona); }}>삭제</Button>
      </div>
    </li>)}</ul>}
    <Modal open={!!editor} title={editor === 'new' ? '새 페르소나' : '페르소나 수정'} onClose={closeDialog}>
      <form className="persona-form" onSubmit={savePersona} aria-busy={busy}>
        <Input label="이름" value={name} onChange={event => setName(event.target.value)} required maxLength={50} disabled={busy} autoFocus />
        <label className="persona-field">소개<textarea value={description} onChange={event => setDescription(event.target.value)} maxLength={500} rows={5} disabled={busy} /></label>
        {error && <p role="alert">{error}</p>}
        <div className="persona-actions"><Button type="submit" disabled={busy}>{busy ? '저장 중…' : '저장'}</Button><Button variant="secondary" disabled={busy} onClick={closeDialog}>취소</Button></div>
      </form>
    </Modal>
    <Modal open={!!deleting} title="페르소나 삭제" onClose={closeDialog}>
      <div className="persona-form" aria-busy={busy}><p className="persona-description">‘{deleting?.name}’ 페르소나를 삭제할까요?</p>
        {error && <p role="alert">{error}</p>}
        <div className="persona-actions"><Button variant="secondary" autoFocus disabled={busy} onClick={closeDialog}>취소</Button><Button disabled={busy} onClick={deletePersona}>{busy ? '삭제 중…' : '삭제'}</Button></div>
      </div>
    </Modal>
  </div>;
}
