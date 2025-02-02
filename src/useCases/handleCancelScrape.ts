import { CancelScrapeResult, RequestStatus } from "../models/enums.js";
import {
  findRequestById,
  updateRequestStatus,
} from "../repositories/requestRepository.js";
import { abortSignalStore } from "../abortSignalStore.js";

export async function handleCancelScrape(
  requestId: number
): Promise<CancelScrapeResult> {
  const row = await findRequestById(requestId);
  if (!row) {
    return CancelScrapeResult.NotFound;
  }

  if (row.status !== RequestStatus.Pending) {
    return CancelScrapeResult.Conflict;
  }

  const controller = abortSignalStore.get(requestId);
  if (controller) {
    controller.abort();
  }

  try {
    await updateRequestStatus(requestId, RequestStatus.Canceled);
    return CancelScrapeResult.Success;
  } finally {
    abortSignalStore.delete(requestId);
  }
}
