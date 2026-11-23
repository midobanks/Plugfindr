export type SpecialistProfileRow = {
  readonly id: string;
  readonly displayName: string;
  readonly headline: string;
  readonly bio: string | null;
  readonly location: string | null;
  readonly timeZone: string;
  readonly availability: string | null;
};

export type PublicSpecialistProfile = {
  readonly id: string;
  readonly displayName: string;
  readonly headline: string;
  readonly bio: string | null;
  readonly location: string | null;
  readonly timeZone: string;
  readonly availability: string | null;
};

export function toPublicSpecialistProfile(row: SpecialistProfileRow): PublicSpecialistProfile {
  return {
    id: row.id,
    displayName: row.displayName,
    headline: row.headline,
    bio: row.bio,
    location: row.location,
    timeZone: row.timeZone,
    availability: row.availability,
  };
}
