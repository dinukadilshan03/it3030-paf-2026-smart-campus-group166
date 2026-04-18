ALTER TABLE tickets
    ADD COLUMN reconsideration_note TEXT,
    ADD COLUMN reconsideration_requested_at TIMESTAMP,
    ADD COLUMN reconsideration_reviewed_at TIMESTAMP,
    ADD COLUMN reconsideration_request_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN staff_review_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN admin_review_count INTEGER NOT NULL DEFAULT 0;
