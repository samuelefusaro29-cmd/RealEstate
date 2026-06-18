ALTER TABLE auctions
    ADD COLUMN current_winner_id INT NULL,
    ADD CONSTRAINT fk_auction_current_winner
        FOREIGN KEY (current_winner_id) REFERENCES users(id)
        ON DELETE SET NULL;