-- DROP existing tables if they exist (in dependency-safe order)
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS production_finished;
DROP TABLE IF EXISTS production_raw;
DROP TABLE IF EXISTS production_batches;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS accounts;


-- 1) PRODUCTS
CREATE TABLE products (
  id           SERIAL         PRIMARY KEY,
  name         VARCHAR(255)   NOT NULL,
  description  TEXT,
  price        DECIMAL(10,2)  NOT NULL,           -- selling price
  cost_price   DECIMAL(10,2),                     -- average/buy cost price
  in_stock     DOUBLE PRECISION NOT NULL DEFAULT 0,
  unit         VARCHAR(20)    NOT NULL DEFAULT 'pcs',
  user_uid     VARCHAR(255)   NOT NULL,
  category     VARCHAR(50)
);

-- 2) ACCOUNTS
CREATE TABLE accounts (
  id          SERIAL       PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255),
  phone       VARCHAR(20),
  user_uid    VARCHAR(255) NOT NULL,
  status      VARCHAR(20)  NOT NULL CHECK (status IN ('active','inactive')),
  type        VARCHAR(20)  NOT NULL CHECK (type IN ('customer','supplier')),
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3) ORDERS
CREATE TABLE orders (
  id            SERIAL        PRIMARY KEY,
  accounts_id   INTEGER       REFERENCES accounts(id),
  total_amount  DECIMAL(10,2) NOT NULL,
  user_uid      VARCHAR(255)  NOT NULL,
  status        VARCHAR(20)   NOT NULL CHECK (status IN ('pending','completed','cancelled')),
  type          TEXT          NOT NULL DEFAULT 'sale' CHECK (type IN ('purchase', 'sale')),
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4) ORDER_ITEMS
CREATE TABLE order_items (
  id         SERIAL        PRIMARY KEY,
  order_id   INTEGER       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER       NOT NULL REFERENCES products(id),
  quantity   INTEGER       NOT NULL,
  price      DECIMAL(10,2) NOT NULL
);

-- 5) TRANSACTIONS
CREATE TABLE transactions (
  id                SERIAL        PRIMARY KEY,
  description       TEXT,
  order_id          INTEGER       REFERENCES orders(id),
  amount            DECIMAL(10,2) NOT NULL,
  paid_amount       DECIMAL(10,2) NOT NULL DEFAULT 0,
  user_uid          VARCHAR(255)  NOT NULL,
  type              VARCHAR(20)   CHECK (type IN ('income','expense')),
  category          VARCHAR(100),
  status            VARCHAR(20)   CHECK (status IN ('paid','unpaid','partial')),
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6) PRODUCTION BATCH HEADERS
CREATE TABLE production_batches (
  id          SERIAL    PRIMARY KEY,
  user_uid    VARCHAR   NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 7) RAW MATERIALS CONSUMED
CREATE TABLE production_raw (
  id                   SERIAL           PRIMARY KEY,
  production_batch_id  INTEGER          NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
  product_id           INTEGER          NOT NULL REFERENCES products(id),
  quantity             DOUBLE PRECISION NOT NULL
);

-- 8) FINISHED PRODUCTS CREATED
CREATE TABLE production_finished (
  id                   SERIAL           PRIMARY KEY,
  production_batch_id  INTEGER          NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
  product_id           INTEGER          NOT NULL REFERENCES products(id),
  quantity             DOUBLE PRECISION NOT NULL
);

-- 9) STOCK MOVEMENT AUDIT TRAIL
CREATE TABLE stock_movements (
  id            SERIAL    PRIMARY KEY,
  product_id    INTEGER   NOT NULL REFERENCES products(id),
  type          VARCHAR   NOT NULL,  -- e.g., 'sale','purchase','manufacture'
  reference_id  INTEGER,             -- e.g., orders.id or production_batches.id
  description   TEXT,
  user_uid      VARCHAR   NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
