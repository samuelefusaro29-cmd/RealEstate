ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS listing_type VARCHAR(10) NOT NULL DEFAULT 'SALE',
    ADD COLUMN IF NOT EXISTS rental_price_monthly DECIMAL(10,2) NULL;

CREATE TABLE IF NOT EXISTS rental_request (
                                              id            SERIAL PRIMARY KEY,
                                              post_id       INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
                                              buyer_id      INT NOT NULL,
                                              message       TEXT,
                                              desired_start DATE,
                                              desired_end   DATE,
                                              status        VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                                              created_at    TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rental_contract (
                                               id            SERIAL PRIMARY KEY,
                                               post_id       INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
                                               tenant_id     INT NOT NULL,
                                               start_date    DATE          NOT NULL,
                                               end_date      DATE          NOT NULL,
                                               monthly_price DECIMAL(10,2) NOT NULL,
                                               status        VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
                                               created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_req_post   ON rental_request(post_id);
CREATE INDEX IF NOT EXISTS idx_rental_req_buyer  ON rental_request(buyer_id);
CREATE INDEX IF NOT EXISTS idx_rental_con_post   ON rental_contract(post_id);
CREATE INDEX IF NOT EXISTS idx_rental_con_tenant ON rental_contract(tenant_id);