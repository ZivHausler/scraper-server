import { handleGetLinks } from "../src/useCases/handleGetLinks";
import * as requestRepo from "../src/repositories/requestRepository";
import * as linkRepo from "../src/repositories/linkRepository";
import { RequestStatus } from "../src/models/enums";
import { closeDatabase } from "../src/db";

jest.mock("../src/repositories/requestRepository");
jest.mock("../src/repositories/linkRepository");

afterAll(async () => {
  await closeDatabase();
});

describe("handleGetLinks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return null if no request row is found", async () => {
    (requestRepo.findRequestById as jest.Mock).mockResolvedValue(null);

    const result = await handleGetLinks(123);
    expect(result).toBeNull();
  });

  it("should return status if status is pending (no links)", async () => {
    (requestRepo.findRequestById as jest.Mock).mockResolvedValue({
      id: 1,
      original_url: "https://pending.com",
      canonical_url: null,
      status: RequestStatus.Pending,
    });

    const result = await handleGetLinks(1);
    expect(result).toEqual({ status: RequestStatus.Pending });
  });

  it("should return status=done and fetched links when status is done", async () => {
    (requestRepo.findRequestById as jest.Mock).mockResolvedValue({
      id: 2,
      original_url: "https://done.com",
      canonical_url: "https://canonical.com",
      status: RequestStatus.Done,
    });

    (linkRepo.fetchLinksByRequestId as jest.Mock).mockResolvedValue([
      { rel: "stylesheet", href: "https://example.com/style.css" },
      { rel: "canonical", href: "https://canonical.com" },
    ]);

    const result = await handleGetLinks(2);
    expect(result).toEqual({
      status: RequestStatus.Done,
      links: [
        { rel: "stylesheet", href: "https://example.com/style.css" },
        { rel: "canonical", href: "https://canonical.com" },
      ],
    });
  });

  it("should return status if status is failed (no links)", async () => {
    (requestRepo.findRequestById as jest.Mock).mockResolvedValue({
      id: 3,
      original_url: "https://failed.com",
      canonical_url: null,
      status: RequestStatus.Failed,
    });

    const result = await handleGetLinks(3);
    expect(result).toEqual({ status: RequestStatus.Failed });
  });

  it("should return status if status is canceled (no links)", async () => {
    (requestRepo.findRequestById as jest.Mock).mockResolvedValue({
      id: 4,
      original_url: "https://canceled.com",
      canonical_url: null,
      status: RequestStatus.Canceled,
    });

    const result = await handleGetLinks(4);
    expect(result).toEqual({ status: RequestStatus.Canceled });
  });

  it("should handle if fetchLinksByRequestId returns an empty array", async () => {
    (requestRepo.findRequestById as jest.Mock).mockResolvedValue({
      id: 5,
      original_url: "https://no-links.com",
      canonical_url: "https://canonical.com",
      status: RequestStatus.Done,
    });

    (linkRepo.fetchLinksByRequestId as jest.Mock).mockResolvedValue([]);

    const result = await handleGetLinks(5);
    expect(result).toEqual({
      status: RequestStatus.Done,
      links: [],
    });
  });

  it("should handle a request with a null canonical URL", async () => {
    (requestRepo.findRequestById as jest.Mock).mockResolvedValue({
      id: 6,
      original_url: "https://null-canonical.com",
      canonical_url: null,
      status: RequestStatus.Done,
    });

    (linkRepo.fetchLinksByRequestId as jest.Mock).mockResolvedValue([
      { rel: "icon", href: "https://example.com/favicon.ico" },
    ]);

    const result = await handleGetLinks(6);
    expect(result).toEqual({
      status: RequestStatus.Done,
      links: [{ rel: "icon", href: "https://example.com/favicon.ico" }],
    });
  });
});
