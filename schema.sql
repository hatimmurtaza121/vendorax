-- Drop existing tables if needed (optional)
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS payment_methods;
DROP TABLE IF EXISTS accounts;

-- 1) PRODUCTS
CREATE TABLE products (
  id          SERIAL       PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL,
  in_stock    INTEGER      NOT NULL DEFAULT 0,
  user_uid    VARCHAR(255) NOT NULL,
  category    VARCHAR(50)
);

-- 2) Accounts
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
  id            SERIAL       PRIMARY KEY,
  accounts_id   INTEGER      REFERENCES accounts(id),
  total_amount  DECIMAL(10,2) NOT NULL,
  user_uid      VARCHAR(255) NOT NULL,
  status        VARCHAR(20)  NOT NULL CHECK (status IN ('pending','completed','cancelled')),
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4) ORDER_ITEMS
CREATE TABLE order_items (
  id         SERIAL       PRIMARY KEY,
  order_id   INTEGER      NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER      NOT NULL REFERENCES products(id),
  quantity   INTEGER      NOT NULL,
  price      DECIMAL(10,2) NOT NULL
);

-- 5) PAYMENT_METHODS (updated as requested)
CREATE TABLE payment_methods (
  id   SERIAL       PRIMARY KEY,
  name VARCHAR(50)  NOT NULL UNIQUE
);

-- 6) TRANSACTIONS
CREATE TABLE transactions (
  id                SERIAL       PRIMARY KEY,
  description       TEXT,
  order_id          INTEGER      REFERENCES orders(id),
  payment_method_id INTEGER      REFERENCES payment_methods(id),
  amount            DECIMAL(10,2) NOT NULL,
  user_uid          VARCHAR(255) NOT NULL,
  type              VARCHAR(20)  CHECK (type IN ('income','expense')),
  category          VARCHAR(100),
  status            VARCHAR(20)  CHECK (status IN ('paid','unpaid')),
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7) Insert initial payment methods
INSERT INTO payment_methods (name) VALUES ('Card'), ('Cash');
