export interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatarUrl: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'arch-1',
    name: 'Elena Vance',
    role: 'Principal Architect',
    initials: 'EV',
    avatarUrl: '/src/assets/images/avatar_lead_architect_1794580460778.jpg',
  },
  {
    id: 'eng-1',
    name: 'Marcus Sterling',
    role: 'Staff Systems Engineer',
    initials: 'MS',
    avatarUrl: '/src/assets/images/avatar_systems_engineer_1794580460722.jpg',
  },
  {
    id: 'pm-1',
    name: 'Priya Nair',
    role: 'Technical Product Lead',
    initials: 'PN',
    avatarUrl: '/src/assets/images/avatar_product_director_1794580461522.jpg',
  },
];

export function getTeamMember(id: string): TeamMember {
  return TEAM_MEMBERS.find((m) => m.id === id) ?? TEAM_MEMBERS[0];
}
