import { RequestStatus } from "./enums.js";

export interface RequestRow {
  id: number;
  original_url: string;
  canonical_url: string | null;
  status: RequestStatus;
}

export interface LinkRow {
  id: number;
  request_id: number;
  rel: string;
  href: string;
}

export interface LinkTag {
  rel: string | undefined;
  href: string | undefined;
}

export interface GetLinksResult {
  status: RequestStatus;
  links?: Array<{ rel: string; href: string }>;
}

export interface RefResponse {
  canonicalUrl: string;
  linkTags: LinkTag[];
}
