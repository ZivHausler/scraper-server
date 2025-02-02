import {
  insertRequest,
  setRequestCanonical,
  updateRequestStatus,
} from "../repositories/requestRepository.js";
import { saveLinkTags } from "../repositories/linkRepository.js";
import { abortSignalStore } from "../abortSignalStore.js";
import { scrapeUrl } from "../services/scrapingService.js";
import { RequestStatus } from "../models/enums.js";
import { runInTransaction } from "../transactionHelper.js";

const DELAY = process.env.NODE_ENV === "test" ? 0 : 10000;

export async function handlePostUrl(originalUrl: string): Promise<number> {
  const rowId = await insertRequest(originalUrl);

  // No need to wait for this function to end
  scrapeInBackground(rowId, originalUrl);

  return rowId;
}

async function scrapeInBackground(
  requestId: number,
  inputUrl: string
): Promise<void> {
  const controller = new AbortController();
  abortSignalStore.set(requestId, controller);

  try {
    await new Promise((res) => setTimeout(res, DELAY)); // Artificial delay to see "pending" status

    const { canonicalUrl, linkTags } = await scrapeUrl(
      inputUrl,
      controller.signal
    );

    await runInTransaction(async () => {
      await setRequestCanonical(requestId, canonicalUrl);
      await saveLinkTags(requestId, linkTags);
      await updateRequestStatus(requestId, RequestStatus.Done);
    });
  } catch (error: any) {
    if (
      error.name === "CanceledError" ||
      error.message?.includes(RequestStatus.Canceled)
    ) {
      await updateRequestStatus(requestId, RequestStatus.Canceled);
    } else {
      console.error(`Scrape error for requestId=${requestId}:`, error);
      await updateRequestStatus(requestId, RequestStatus.Failed);
    }
  } finally {
    abortSignalStore.delete(requestId); // Remove from map so we don't leak
  }
}
