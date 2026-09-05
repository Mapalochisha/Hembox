export interface ShippingCartLine {
  variantId: string;
  productId: string;
  quantity: number;
  shippingPoints: number;
  shippingPointsOverride: number | null;
}

export interface ShippingPointLineResult {
  variantId: string;
  productId: string;
  quantity: number;
  pointsPerUnit: number;
  pointSource:
    | "VARIANT_OVERRIDE"
    | "PRODUCT_DEFAULT"
    | "SYSTEM_DEFAULT";
  totalPoints: number;
}

export interface ShippingPointsResult {
  totalPoints: number;
  lines: ShippingPointLineResult[];
}