import { handleCancelScrape } from "../src/useCases/handleCancelScrape";
import * as requestRepo from "../src/repositories/requestRepository";
import { CancelScrapeResult, RequestStatus } from "../src/models/enums";
import { RequestRow } from "../src/models/index";
import { abortSignalStore } from "../src/abortSignalStore";
import { closeDatabase } from "../src/db";

jest.mock("../src/repositories/requestRepository");

describe("handleCancelScrape", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    abortSignalStore.clear();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it("should return NotFound if no row is found", async () => {
    (requestRepo.findRequestById as jest.Mock).mockResolvedValue(undefined);

    const result = await handleCancelScrape(123);
    expect(result).toBe(CancelScrapeResult.NotFound);
  });

  it("should return Conflict if status is not pending", async () => {
    const mockRow: RequestRow = {
      id: 2,
      original_url: "https://done.com",
      canonical_url: "https://done.com",
      status: RequestStatus.Done,
    };
    (requestRepo.findRequestById as jest.Mock).mockResolvedValue(mockRow);

    const result = await handleCancelScrape(2);
    expect(result).toBe(CancelScrapeResult.Conflict);
  });

  it("should return Success and abort the controller if status is pending", async () => {
    const mockRow: RequestRow = {
      id: 5,
      original_url: "https://pending.com",
      canonical_url: null,
      status: RequestStatus.Pending,
    };
    (requestRepo.findRequestById as jest.Mock).mockResolvedValue(mockRow);

    const controller = new AbortController();
    abortSignalStore.set(5, controller);

    const updateRequestStatusMock =
      requestRepo.updateRequestStatus as jest.Mock;
    updateRequestStatusMock.mockResolvedValue(undefined);

    const result = await handleCancelScrape(5);

    expect(result).toBe(CancelScrapeResult.Success);
    expect(updateRequestStatusMock).toHaveBeenCalledWith(
      5,
      RequestStatus.Canceled
    );
    expect(controller.signal.aborted).toBe(true);
  });

  it("should succeed even if no AbortController is found in the map", async () => {
    const mockRow: RequestRow = {
      id: 6,
      original_url: "https://pending.com",
      canonical_url: null,
      status: RequestStatus.Pending,
    };
    (requestRepo.findRequestById as jest.Mock).mockResolvedValue(mockRow);

    const updateRequestStatusMock =
      requestRepo.updateRequestStatus as jest.Mock;
    updateRequestStatusMock.mockResolvedValue(undefined);

    const result = await handleCancelScrape(6);
    expect(result).toBe(CancelScrapeResult.Success);
    expect(updateRequestStatusMock).toHaveBeenCalledWith(
      6,
      RequestStatus.Canceled
    );
  });

  it("should throw an error if database query fails", async () => {
    (requestRepo.findRequestById as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    await expect(handleCancelScrape(999)).rejects.toThrow("Database error");
  });

  it("should throw an error if updating request status fails", async () => {
    const mockRow: RequestRow = {
      id: 10,
      original_url: "https://pending.com",
      canonical_url: null,
      status: RequestStatus.Pending,
    };
    (requestRepo.findRequestById as jest.Mock).mockResolvedValue(mockRow);

    const updateRequestStatusMock =
      requestRepo.updateRequestStatus as jest.Mock;
    updateRequestStatusMock.mockRejectedValue(new Error("Update failed"));

    await expect(handleCancelScrape(10)).rejects.toThrow("Update failed");
  });

  it("should remove the AbortController from the store after cancellation", async () => {
    const requestId = 15;
    const mockRow: RequestRow = {
      id: requestId,
      original_url: "https://pending.com",
      canonical_url: null,
      status: RequestStatus.Pending,
    };
    (requestRepo.findRequestById as jest.Mock).mockResolvedValue(mockRow);

    const controller = new AbortController();
    abortSignalStore.set(requestId, controller);

    const updateRequestStatusMock =
      requestRepo.updateRequestStatus as jest.Mock;
    updateRequestStatusMock.mockResolvedValue(undefined);

    await handleCancelScrape(requestId);

    expect(abortSignalStore.has(requestId)).toBe(false);
  });
});
