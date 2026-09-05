import { VariantGroup } from "@/components/admin/VariantBuilder";

type SubAttributeWithId = VariantGroup["subAttributes"][number] & { id?: string };

export function flattenVariantGroups(groups: VariantGroup[], productSlug: string) {
  const variants: {
    id?: string;
    sku: string;
    price: number;
    comparePrice: number | null;
    inventory: number;
    attributes: Record<string, string>;
    linkedImageIndex: number | null;
    shippingPointsOverride: number | null;
  }[] = [];

  for (const group of groups) {
    if (!group.masterValue.trim()) continue;

    for (const sub of group.subAttributes) {
      if (!sub.value.trim()) continue;

      const price = sub.priceOverride
        ? parseFloat(sub.priceOverride)
        : parseFloat(group.groupPrice || "0");

      const comparePrice = group.comparePrice
        ? parseFloat(group.comparePrice)
        : null;

      const sku = sub.sku.trim() ||
        `HB-${productSlug.toUpperCase().slice(0, 8)}-${group.masterValue.replace(/\s+/g, "-").toUpperCase().slice(0, 5)}-${sub.value.replace(/\s+/g, "-").toUpperCase().slice(0, 5)}`;

      const parsedShippingPoints = sub.shippingPointsOverride.trim() === ""
        ? null
        : parseInt(sub.shippingPointsOverride, 10);

      const attributes: Record<string, string> = {
        [group.masterKey]: group.masterValue,
        [sub.attributeKey]: sub.value,
        _masterKey: group.masterKey,
        _linkedImageIndex: group.imageIndex !== null ? String(group.imageIndex) : "",
      };

      const subWithId = sub as SubAttributeWithId;
      const variant = {
        ...(subWithId.id ? { id: subWithId.id } : {}),
        sku,
        price,
        comparePrice,
        inventory: sub.stock,
        attributes,
        linkedImageIndex: group.imageIndex,
        shippingPointsOverride: Number.isInteger(parsedShippingPoints) && parsedShippingPoints >= 0
          ? parsedShippingPoints
          : null,
      };

      variants.push(variant);
    }
  }

  return variants;
}

export function groupVariantsForBuilder(variants: any[]): VariantGroup[] {
  const groupMap: Record<string, VariantGroup> = {};

  for (const v of variants) {
    const attributes = v.attributes ?? {};

    const allKeys = Object.keys(attributes).filter(k => !k.startsWith("_"));
    const masterKey = attributes._masterKey && allKeys.includes(attributes._masterKey)
      ? attributes._masterKey
      : allKeys[0];

    if (!masterKey) continue;

    const masterValue = attributes[masterKey];
    const groupKey = `${masterKey}:${masterValue}`;

    const linkedImageIndex = attributes._linkedImageIndex !== undefined && attributes._linkedImageIndex !== ""
      ? parseInt(attributes._linkedImageIndex)
      : null;

    if (!groupMap[groupKey]) {
      groupMap[groupKey] = {
        id: Math.random().toString(36).slice(2, 8),
        masterKey,
        masterValue,
        groupPrice: v.price?.toString() ?? "",
        comparePrice: v.comparePrice?.toString() ?? "",
        imageIndex: linkedImageIndex,
        subAttributes: [],
      };
    }

    const subKey = allKeys.find(k => k !== masterKey);
    const subValue = subKey ? attributes[subKey] : "";

    const subAttribute = {
      ...(v.id ? { id: v.id } : {}),
      attributeKey: subKey ?? masterKey,
      value: subValue,
      stock: v.inventory ?? 0,
      priceOverride: "",
      shippingPointsOverride: v.shippingPointsOverride === null || v.shippingPointsOverride === undefined
        ? ""
        : String(v.shippingPointsOverride),
      sku: v.sku ?? "",
    };

    groupMap[groupKey].subAttributes.push(subAttribute);
  }

  return Object.values(groupMap);
}
