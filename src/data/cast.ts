// Band Quest — cast inicial e modelo de membro (feature 0007).
// Espelho de band-quest-docs/docs/features/band-members-and-roster/planning/design.md
// Atributos fixos por personagem (sem progressão nesta feature).

export type MemberRole = 'vocal' | 'guitar' | 'bass' | 'drums' | 'keys'

export interface MemberAttributes {
  technique: number
  charisma: number
  creativity: number
  energy: number
}

export interface CastCharacter {
  id: string // slug, ex.: 'lila-tavares'
  name: string
  role: MemberRole
  attributes: MemberAttributes
  accent: string // token CSS, ex.: 'var(--bq-stat-fans)'
  icon: string // arquivo em src/assets/members, ex.: 'member-lila-tavares.svg'
}

export interface BandMember extends CastCharacter {
  memberId: string // id da instância no roster
}

export const ROLE_LABEL: Record<MemberRole, string> = {
  vocal: 'Vocal',
  guitar: 'Guitarra',
  bass: 'Baixo',
  drums: 'Bateria',
  keys: 'Teclado',
}

// Eixos de atributo e a cor (token) usada nas barras do card.
export const ATTRIBUTE_META: ReadonlyArray<{
  key: keyof MemberAttributes
  label: string
  color: string
}> = [
  { key: 'technique', label: 'Técnica', color: 'var(--bq-stat-rep)' },
  { key: 'charisma', label: 'Carisma', color: 'var(--bq-stat-fans)' },
  { key: 'creativity', label: 'Criatividade', color: 'var(--bq-spotlight)' },
  { key: 'energy', label: 'Energia', color: 'var(--bq-stat-fatigue)' },
]

function character(
  id: string,
  name: string,
  role: MemberRole,
  [technique, charisma, creativity, energy]: [number, number, number, number],
  accent: string,
): CastCharacter {
  return {
    id,
    name,
    role,
    attributes: { technique, charisma, creativity, energy },
    accent,
    icon: `member-${id}.svg`,
  }
}

export const CAST: readonly CastCharacter[] = [
  // Vocal (máx. 1, não repete)
  character('lila-tavares', 'Lila Tavares', 'vocal', [55, 90, 60, 70], 'var(--bq-stat-fans)'),
  character('jucara-bonfim', 'Juçara Bonfim', 'vocal', [50, 65, 92, 55], 'var(--bq-ember)'),
  character('dilson-prado', 'Dílson Prado', 'vocal', [85, 50, 58, 62], 'var(--bq-info)'),
  // Guitarra
  character('rita-camargo', 'Rita Camargo', 'guitar', [92, 55, 70, 58], 'var(--bq-spotlight)'),
  character('brenno-sales', 'Brenno Sales', 'guitar', [68, 52, 90, 60], 'var(--bq-stat-cash)'),
  character('teo-vasconcelos', 'Téo Vasconcelos', 'guitar', [70, 88, 55, 66], 'var(--bq-stat-fans)'),
  // Baixo
  character('nara-siqueira', 'Nara Siqueira', 'bass', [88, 58, 62, 64], 'var(--bq-stat-cash)'),
  character('iuri-mendes', 'Iuri Mendes', 'bass', [66, 56, 85, 60], 'var(--bq-info)'),
  character('caique-romero', 'Caíque Romero', 'bass', [64, 60, 55, 92], 'var(--bq-stat-fatigue)'),
  // Bateria (obrigatória)
  character('tuca-andrade', 'Tuca Andrade', 'drums', [90, 50, 60, 70], 'var(--bq-spotlight)'),
  character('janaina-costa', 'Janaína Costa', 'drums', [68, 58, 54, 95], 'var(--bq-ember)'),
  character('mari-sato', 'Mari Sato', 'drums', [72, 55, 88, 66], 'var(--bq-stat-cash)'),
  // Teclado
  character('vava-coutinho', 'Vavá Coutinho', 'keys', [90, 52, 66, 58], 'var(--bq-info)'),
  character('caca-lemos', 'Cacá Lemos', 'keys', [62, 90, 64, 60], 'var(--bq-stat-fans)'),
  character('ailton-reis', 'Aílton Reis', 'keys', [70, 58, 92, 55], 'var(--bq-spotlight)'),
]

export function getCharacter(id: string): CastCharacter {
  const c = CAST.find((x) => x.id === id)
  if (!c) throw new Error(`Unknown cast character: ${id}`)
  return c
}

export function createMember(character: CastCharacter, instance = 1): BandMember {
  return { ...character, memberId: `${character.id}#${instance}` }
}

// Regras de composição (design.md): 3–5 membros; vocal opcional e máx. 1;
// instrumentos podem repetir; mín. 3 instrumentistas, com pelo menos 1 baterista.
export const ROSTER_MIN = 3
export const ROSTER_MAX = 5
export const MIN_INSTRUMENTALISTS = 3

export function validateRoster(members: BandMember[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (members.length < ROSTER_MIN || members.length > ROSTER_MAX) {
    errors.push(`A banda precisa ter de ${ROSTER_MIN} a ${ROSTER_MAX} membros.`)
  }
  const vocals = members.filter((m) => m.role === 'vocal').length
  if (vocals > 1) errors.push('Só pode haver um vocalista.')
  const instrumentalists = members.filter((m) => m.role !== 'vocal').length
  if (instrumentalists < MIN_INSTRUMENTALISTS) {
    errors.push(`A banda precisa de pelo menos ${MIN_INSTRUMENTALISTS} instrumentistas.`)
  }
  const drummers = members.filter((m) => m.role === 'drums').length
  if (drummers < 1) errors.push('A banda precisa de pelo menos um baterista.')
  return { valid: errors.length === 0, errors }
}

// Formação inicial padrão (interina, até a tela de seleção da 0005d/0010):
// 1 vocal + guitarra + baixo + bateria — válida pelas regras acima.
export const DEFAULT_LINEUP_IDS = [
  'lila-tavares',
  'rita-camargo',
  'nara-siqueira',
  'tuca-andrade',
] as const

export function createDefaultRoster(): BandMember[] {
  return DEFAULT_LINEUP_IDS.map((id) => createMember(getCharacter(id)))
}
