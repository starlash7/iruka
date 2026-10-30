-- A fresh idempotency key cannot repeat the same financial operation for a turn.
CREATE UNIQUE INDEX credit_ledger_turn_operation_unique
  ON credit_ledger(turn_request_id, kind)
  WHERE turn_request_id IS NOT NULL;
