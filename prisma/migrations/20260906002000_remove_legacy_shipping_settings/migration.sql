-- M8: remove the retired flat/free-shipping settings.
-- Shipping pricing is now derived exclusively from the shipping configuration domain.
-- This migration is intentionally data-only; shipping configuration remains in the shipping domain tables.
DELETE FROM "store_settings"
WHERE "key" IN ('default_shipping_cost', 'free_shipping_threshold');
