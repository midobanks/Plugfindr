import { describe, expect, it } from 'vitest';
import { toPublicSpecialistProfile } from './dto';

describe('public specialist profile DTO', () => {
  it('copies only the public fields from a row carrying sensitive fields', () => {
    const row = {
      id: 'specialist-001',
      displayName: 'Chidi Ọkòyè',
      headline: 'Product designer for fintech and marketplaces',
      bio: null,
      location: 'Port Harcourt',
      timeZone: 'Africa/Lagos',
      availability: 'available_now',
      phone: '+234 000 000 0000',
      whatsapp: '+234 000 000 0001',
      idNumber: '00000000000',
      storageKey: 'private/verification/id-card',
    };

    const dto = toPublicSpecialistProfile(row);
    const serialised = JSON.stringify(dto);

    expect(dto).toEqual({
      id: row.id,
      displayName: row.displayName,
      headline: row.headline,
      bio: row.bio,
      location: row.location,
      timeZone: row.timeZone,
      availability: row.availability,
    });
    expect(serialised).not.toContain('phone');
    expect(serialised).not.toContain('whatsapp');
    expect(serialised).not.toContain('idNumber');
    expect(serialised).not.toContain('storageKey');
  });

  it('keeps Nigerian diacritics intact', () => {
    const dto = toPublicSpecialistProfile({
      id: 'specialist-002',
      displayName: 'Ẹniọlá Balogun',
      headline: 'Brand designer',
      bio: 'Ọ̀rẹ́ àti iṣẹ́',
      location: 'Ibadan',
      timeZone: 'Africa/Lagos',
      availability: 'limited',
    });

    expect(dto.displayName).toBe('Ẹniọlá Balogun');
    expect(dto.bio).toBe('Ọ̀rẹ́ àti iṣẹ́');
  });
});
