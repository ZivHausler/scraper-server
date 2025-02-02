import { Router, Request, Response } from "express";

import { handlePostUrl } from "./useCases/handlePostUrl.js";
import { handleGetLinks } from "./useCases/handleGetLinks.js";
import { handleCancelScrape } from "./useCases/handleCancelScrape.js";
import { CancelScrapeResult } from "./models/enums.js";

const router = Router();

/**
 * POST /links?url=someURL
 * Returns { id: number }
 */
router.post("/links", async (req: Request, res: Response) => {
  const urlParam = req.query.url;
  if (!urlParam || typeof urlParam !== "string") {
    return res.status(400).json({ error: "Missing or invalid ?url=" });
  }

  try {
    const newId = await handlePostUrl(urlParam);
    return res.json({ id: newId });
  } catch (err) {
    console.error("POST /links error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * GET /links/:id
 * Returns { status: string, links: [] }
 */
router.get("/links/:id", async (req: Request, res: Response) => {
  const numericId = parseInt(req.params.id, 10);
  if (isNaN(numericId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  try {
    const result = await handleGetLinks(numericId);
    if (!result) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json(result);
  } catch (err) {
    console.error("GET /links/:id error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /links/:id/cancel
 */
router.post("/links/:id/cancel", async (req: Request, res: Response) => {
  const numericId = parseInt(req.params.id, 10);
  if (isNaN(numericId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  try {
    const result = await handleCancelScrape(numericId);
    switch (result) {
      case CancelScrapeResult.NotFound:
        return res.status(404).json({ error: "Not found" });
      case CancelScrapeResult.Conflict:
        return res
          .status(409)
          .json({ error: "Cannot cancel a non-pending request" });
      case CancelScrapeResult.Success:
        return res.json({ message: "Request canceled" });
    }
  } catch (err) {
    console.error("POST /links/:id/cancel error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
