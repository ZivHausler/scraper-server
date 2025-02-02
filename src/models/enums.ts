export enum CancelScrapeResult {
  NotFound = "notFound",
  Conflict = "conflict",
  Success = "success",
}

export enum RequestStatus {
  Pending = "pending",
  Done = "done",
  Failed = "failed",
  Canceled = "canceled",
}

export enum TransactionStatus {
  Begin = "BEGIN TRANSACTION",
  Commit = "COMMIT",
  Rollback = "ROLLBACK",
}
