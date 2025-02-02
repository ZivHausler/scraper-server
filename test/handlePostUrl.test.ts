import { handlePostUrl } from "../src/useCases/handlePostUrl";
import * as requestRepo from "../src/repositories/requestRepository";
import * as linkRepo from "../src/repositories/linkRepository";
import * as transactionHelper from "../src/transactionHelper";
import { scrapeUrl } from "../src/services/scrapingService";
import { abortSignalStore } from "../src/abortSignalStore";
import { RequestStatus } from "../src/models/enums";
import { closeDatabase } from "../src/db";

jest.mock("../src/repositories/requestRepository");
jest.mock("../src/repositories/linkRepository");
jest.mock("../src/services/scrapingService");
jest.mock("../src/transactionHelper");

describe("handlePostUrl", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    abortSignalStore.clear();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  async function waitForBackgroundExecution() {
    jest.runAllTimers();
    await Promise.resolve();
  }

  it("should insert a new request row and return its ID", async () => {
    const requestId = 42;
    (requestRepo.insertRequest as jest.Mock).mockResolvedValue(requestId);

    const resultId = await handlePostUrl("https://test.com");

    expect(resultId).toBe(requestId);
    expect(requestRepo.insertRequest).toHaveBeenCalledWith("https://test.com");
  });

  it("should call scraping in the background but return immediately", async () => {
    const requestId = 10;
    (requestRepo.insertRequest as jest.Mock).mockResolvedValue(requestId);
    (scrapeUrl as jest.Mock).mockResolvedValue({
      canonicalUrl: "https://background.com",
      linkTags: [],
    });

    await handlePostUrl("https://background.com");

    await waitForBackgroundExecution();

    expect(scrapeUrl).toHaveBeenCalledWith(
      "https://background.com",
      expect.any(AbortSignal)
    );
  });

  it("should update request status to failed when scraping throws an error", async () => {
    const requestId = 88;
    (requestRepo.insertRequest as jest.Mock).mockResolvedValue(requestId);
    (scrapeUrl as jest.Mock).mockRejectedValue(new Error("Scraping failed"));

    await handlePostUrl("https://failing-url.com");

    await waitForBackgroundExecution();

    expect(requestRepo.updateRequestStatus).toHaveBeenCalledWith(
      requestId,
      RequestStatus.Failed
    );
  });

  it("should update request to canceled when aborted", async () => {
    const requestId = 99;
    (requestRepo.insertRequest as jest.Mock).mockResolvedValue(requestId);

    const abortError = new Error("Request canceled");
    abortError.name = "CanceledError";

    (scrapeUrl as jest.Mock).mockRejectedValue(abortError);

    await handlePostUrl("https://canceled.com");

    await waitForBackgroundExecution();

    expect(requestRepo.updateRequestStatus).toHaveBeenCalledWith(
      requestId,
      RequestStatus.Canceled
    );
  });

  it("should throw an error if inserting request fails", async () => {
    (requestRepo.insertRequest as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    await expect(handlePostUrl("https://fail-insert.com")).rejects.toThrow(
      "Database error"
    );

    expect(scrapeUrl).not.toHaveBeenCalled();
  });
});
