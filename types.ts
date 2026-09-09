export type TrackOccurrence = {
  position: number;
  file_path: string;
  filename: string;
  display_name: string;
};

export type Mix = {
  mix_name: string;
  mix_path: string;
  modified_at: string;
  track_count: number;
  tracks: TrackOccurrence[];
};

export type IndexData = {
  root_folder: string;
  scanned_at: string;
  mix_count: number;
  total_uses: number;
  mixes: Mix[];
};

export type FlatOccurrence = {
  display_name: string;
  filename: string;
  track_path: string;
  position: number;
  mix_name: string;
  mix_path: string;
  modified_at: string;
};

export type TrackGroup = {
  name: string;
  count: number;
  mixCount: number;
  lastUsed: string;
  occurrences: FlatOccurrence[];
};
