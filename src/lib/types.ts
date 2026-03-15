import type { Database } from './database.types'

type Tables = Database['public']['Tables']

export type Project = Tables['project']['Row']
export type ProjectInsert = Tables['project']['Insert']

export type Thread = Tables['thread']['Row']
export type ThreadInsert = Tables['thread']['Insert']

export type Episode = Tables['episode']['Row']
export type EpisodeInsert = Tables['episode']['Insert']
export type EpisodeUpdate = Tables['episode']['Update']

export type ArcCell = Tables['arc_cell']['Row']
export type ArcCellInsert = Tables['arc_cell']['Insert']

export type Beat = Tables['beat']['Row']
export type BeatInsert = Tables['beat']['Insert']
export type BeatUpdate = Tables['beat']['Update']
export type BeatLabel = Beat['label']

export type Character = Tables['character']['Row']
export type CharacterInsert = Tables['character']['Insert']

export type BeatCharacter = Tables['beat_character']['Row']

export type CharacterNote = Tables['character_note']['Row']
export type CharacterNoteInsert = Tables['character_note']['Insert']
