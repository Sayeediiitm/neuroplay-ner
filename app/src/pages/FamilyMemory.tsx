import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db, logEvent, getOrCreateDefaultPatient, type Patient } from '../db/db';
import { v4 as uuidv4 } from '../db/uuid';

interface FamilyMember {
  id: string;
  patientId: string;
  name: string;
  relationship: string;
  note: string;
  photo: string | null; // store data URL for simplicity
}

export default function FamilyMemory({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [note, setNote] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Load patient and existing family members
  useEffect(() => {
    getOrCreateDefaultPatient().then((p) => {
      setPatient(p);
      loadMembers(p.id);
    });
  }, []);

  const loadMembers = async (patientId: string) => {
    const items = await db.memory_items
      .where('patientId')
      .equals(patientId)
      .filter((i) => i.type === 'name')
      .toArray();
    const mapped: FamilyMember[] = items.map((i) => {
      const payload = i.payload as Record<string, string> | undefined;
      return {
        id: i.id,
        patientId: i.patientId,
        name: i.label,
        relationship: payload?.relationship ?? '',
        note: payload?.note ?? '',
        photo: payload?.photo ?? null,
      };
    });
    setMembers(mapped);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    let photoData: string | null = null;
    if (photoFile) {
      photoData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(photoFile);
      });
    }
    const newItem = {
      id: uuidv4(),
      patientId: patient.id,
      type: 'name' as const,
      label: name,
      blob: null,
      payload: { relationship, note, photo: photoData },
      createdAt: new Date().toISOString(),
      addedBy: 'patient' as const,
    };
    await db.memory_items.add(newItem);
    await logEvent('family_photo_viewed', patient.id, { memberId: newItem.id });
    setName('');
    setRelationship('');
    setNote('');
    setPhotoFile(null);
    loadMembers(patient.id);
  };

  return (
    <div className="page-wrapper" data-testid="family-memory-page">
      <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0 1rem' }}>
        <button className="btn-secondary" onClick={onBack} aria-label={t('back')} style={{ minWidth: '56px', padding: '0 1rem' }}>
          ← {t('back')}
        </button>
        <h2>{t('tile_family')}</h2>
      </header>

      <section style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleAdd}>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>{t('family_name') ?? 'Name'}:</label><br />
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>{t('relationship') ?? 'Relationship'}:</label><br />
            <input type="text" value={relationship} onChange={(e) => setRelationship(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>{t('note') ?? 'Note'}:</label><br />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>{t('photo') ?? 'Photo'}:</label><br />
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
          </div>
          <button type="submit" className="btn-primary">{t('add_family') ?? 'Add Family Member'}</button>
        </form>
      </section>

      <section>
        <h3>{t('family_members') ?? 'Family Members'}</h3>
        {members.length === 0 && <p>{t('no_family') ?? 'No family members saved.'}</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {members.map((m) => (
            <li key={m.id} style={{ marginBottom: '0.75rem', border: '1px solid var(--color-divider)', padding: '0.5rem', borderRadius: '4px' }}>
              <strong>{m.name}</strong> – {m.relationship}<br />
              <small>{m.note}</small>
              {m.photo && <div><img src={m.photo} alt={m.name} style={{ maxWidth: '100%', marginTop: '0.5rem' }} /></div>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
