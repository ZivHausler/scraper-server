import { GetLinksResult } from "../models/index.js";
import { RequestStatus } from "../models/enums.js";
import { fetchLinksByRequestId } from "../repositories/linkRepository.js";
import { findRequestById } from "../repositories/requestRepository.js";

export async function handleGetLinks(
  requestId: number
): Promise<GetLinksResult | null> {
  const row = await findRequestById(requestId);
  if (!row) {
    return null;
  }

  if (row.status === RequestStatus.Done) {
    const linkRows = await fetchLinksByRequestId(requestId);
    return {
      status: RequestStatus.Done,
      links: linkRows.map((row) => ({ rel: row.rel, href: row.href })),
    };
  }

  return {
    status: row.status,
    // Could also return { links: [] } on statuses 'pending', 'failed', or 'canceled'
  };
}
