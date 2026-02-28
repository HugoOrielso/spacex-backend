import { z } from "zod";

export const LaunchSchema = z.object({
  launch_id:      z.string(),
  mission_name:   z.string().nullable().optional(),
  flight_number:  z.number().nullable().optional(),
  date_utc:       z.string().nullable().optional(),
  date_local:     z.string().nullable().optional(),
  status:         z.enum(["success", "failed", "upcoming", "unknown"]).optional(),
  upcoming:       z.boolean().nullable().optional(),
  success:        z.boolean().nullable().optional(),
  details:        z.string().nullable().optional(),
  launchpad_id:   z.string().nullable().optional(),
  rocket_id:      z.string().nullable().optional(),
  article:        z.string().nullable().optional(),
  webcast:        z.string().nullable().optional(),
  wikipedia:      z.string().nullable().optional(),
  patch_small:    z.string().nullable().optional(),
  patch_large:    z.string().nullable().optional(),
});

export type Launch = z.infer<typeof LaunchSchema>;

export interface Summary {
  total:    number;
  success:  number;
  failed:   number;
  upcoming: number;
  unknown:  number;
}

export interface YearStat {
  year:     number;
  total:    number;
  success:  number;
  failed:   number;
  upcoming: number;
}

export interface LaunchFilters {
  status?: string;
  year?:   number;
  search?: string;
  limit?:  number;
  offset?: number;
}