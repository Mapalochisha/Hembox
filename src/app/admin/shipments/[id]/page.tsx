"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface ShipmentEvent {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  trackingNumber: string | null;
  createdAt: string;
}

interface ShipmentItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  priceAtPurchase: number | string;
  variantSnapshot: unknown;
  product: {
    name: string;
  };
}

interface ShipmentOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number | string;
  shippingCost: number | string;
  total: number | string;
  createdAt: string;
  updatedAt: string;
  guestName: string | null;
  guestEmail: string | null;
  shippingAddress: string | null;
  trackingNumber: string | null;
  notes: string | null;
  customer: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  } | null;
  items: ShipmentItem[];
}

interface Shipment {
  id: string;
  orderId: string;
  status: string;
  allowedTransitions: string[];

  selectionMethod: string;
  shippingPoints: number;
  customerShippingPrice: number | string | null;
  courierCost: number | string | null;
  currencyCode: string;
  trackingNumber: string | null;

  destinationCountryCode: string;
  destinationProvince: string;
  destinationTown: string;

  courierCodeSnapshot: string | null;
  courierNameSnapshot: string | null;

  zoneCodeSnapshot: string | null;
  zoneNameSnapshot: string | null;

  tierCodeSnapshot: string | null;
  tierNameSnapshot: string | null;
  tierMinPointsSnapshot: number | null;
  tierMaxPointsSnapshot: number | null;
  tierIsCustomSnapshot: boolean | null;

  rateIdSnapshot: string | null;
  pricingStrategySnapshot: string | null;
  pricingValueSnapshot: number | string | null;

  createdAt: string;
  updatedAt: string;
  statusChangedAt: string;

  collectedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;

  order: ShipmentOrder;

  courier: {
    id: string;
    name: string;
    code: string;
  } | null;

  deliveryZone: {
    id: string;
    name: string;
    code: string;
  } | null;

  packageTier: {
    id: string;
    name: string;
    code: string;
    minPoints: number | null;
    maxPoints: number | null;
    isCustom: boolean;
  } | null;

  events: ShipmentEvent[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:
    "bg-yellow-50 text-yellow-700 border-yellow-200",
  READY_FOR_COURIER:
    "bg-blue-50 text-blue-700 border-blue-200",
  COLLECTED:
    "bg-purple-50 text-purple-700 border-purple-200",
  IN_TRANSIT:
    "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED:
    "bg-green-50 text-green-700 border-green-200",
  FAILED_DELIVERY:
    "bg-orange-50 text-orange-700 border-orange-200",
  RETURNED:
    "bg-orange-50 text-orange-700 border-orange-200",
  CANCELLED:
    "bg-red-50 text-red-700 border-red-200",
  LOST:
    "bg-red-50 text-red-700 border-red-200",
  DAMAGED:
    "bg-red-50 text-red-700 border-red-200",
};

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function formatMoney(
  value: number | string | null,
  currency: string,
): string {
  if (value === null || value === undefined) {
    return "—";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return `${currency} ${amount.toFixed(2)}`;
}

function getCustomerName(
  shipment: Shipment,
): string {
  return (
    shipment.order.customer?.name ??
    shipment.order.guestName ??
    "Guest"
  );
}

function getCustomerEmail(
  shipment: Shipment,
): string {
  return (
    shipment.order.customer?.email ??
    shipment.order.guestEmail ??
    ""
  );
}

function getCustomerPhone(
  shipment: Shipment,
): string {
  return shipment.order.customer?.phone ?? "";
}

function getVariantLabel(
  item: ShipmentItem,
): string {
  if (
    item.variantSnapshot &&
    typeof item.variantSnapshot === "object"
  ) {
    const snapshot =
      item.variantSnapshot as Record<
        string,
        unknown
      >;

    const name =
      typeof snapshot.name === "string"
        ? snapshot.name
        : null;

    const sku =
      typeof snapshot.sku === "string"
        ? snapshot.sku
        : null;

    if (name && sku) {
      return `${name} (${sku})`;
    }

    if (name) {
      return name;
    }

    if (sku) {
      return sku;
    }
  }

  return item.variantId;
}

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();

  const shipmentId = String(
    params.id ?? "",
  ).trim();

  const [shipment, setShipment] =
    useState<Shipment | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updateError, setUpdateError] =
    useState("");

  const [updating, setUpdating] =
    useState(false);

  const [trackingNumber, setTrackingNumber] =
    useState("");

  const [trackingSaving, setTrackingSaving] =
    useState(false);

  const [note, setNote] =
    useState("");

  const [selectedStatus, setSelectedStatus] =
    useState("");

  async function loadShipment() {
    if (!shipmentId) {
      setError("Shipment ID is missing");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/shipments/${shipmentId}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load shipment",
        );
      }

      setShipment(data);

      setTrackingNumber(
        data.trackingNumber ?? "",
      );

      setSelectedStatus("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load shipment",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShipment();
  }, [shipmentId]);

  const customDelivery = useMemo(() => {
    return (
      shipment?.selectionMethod ===
      "CUSTOM_CONTACT_REQUIRED"
    );
  }, [shipment]);

  async function updateShipmentStatus() {
    if (!shipment || !selectedStatus) {
      return;
    }

    if (
      !shipment.allowedTransitions.includes(
        selectedStatus,
      )
    ) {
      setUpdateError(
        "That shipment status transition is not allowed.",
      );
      return;
    }

    setUpdating(true);
    setUpdateError("");

    try {
      const response = await fetch(
        `/api/admin/shipments/${shipment.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: selectedStatus,
            trackingNumber:
              trackingNumber.trim() || null,
            note: note.trim() || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update shipment",
        );
      }

      setShipment(data);

      setTrackingNumber(
        data.trackingNumber ?? "",
      );

      setSelectedStatus("");
      setNote("");
    } catch (err) {
      setUpdateError(
        err instanceof Error
          ? err.message
          : "Unable to update shipment",
      );
    } finally {
      setUpdating(false);
    }
  }

  async function saveTrackingNumber() {
    if (!shipment) {
      return;
    }

    setTrackingSaving(true);
    setUpdateError("");

    try {
      const response = await fetch(
        `/api/admin/shipments/${shipment.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            trackingNumber:
              trackingNumber.trim() || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update tracking number",
        );
      }

      setShipment(data);

      setTrackingNumber(
        data.trackingNumber ?? "",
      );
    } catch (err) {
      setUpdateError(
        err instanceof Error
          ? err.message
          : "Unable to update tracking number",
      );
    } finally {
      setTrackingSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-10 text-sm text-gray-400">
        Loading shipment...
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div>
        <div className="mb-6">
          <Link
            href="/admin/shipments"
            className="text-sm text-gray-500 hover:text-[#2D2D2D]"
          >
            ← Back to Shipments
          </Link>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error || "Shipment not found"}
        </div>
      </div>
    );
  }

  const currency =
    shipment.currencyCode || "ZMW";

  const tierName =
    shipment.tierNameSnapshot ??
    shipment.packageTier?.name ??
    "Custom";

  const zoneName =
    shipment.zoneNameSnapshot ??
    shipment.deliveryZone?.name ??
    "Custom";

  const courierName =
    shipment.courierNameSnapshot ??
    shipment.courier?.name ??
    "Not assigned";

  const hasAllowedTransitions =
    shipment.allowedTransitions.length > 0;

  return (
    <div className="max-w-7xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <Link
            href="/admin/shipments"
            className="text-sm text-gray-500 hover:text-[#2D2D2D]"
          >
            ← Back to Shipments
          </Link>

          <div className="flex flex-wrap items-center gap-3 mt-3">
            <h1 className="text-2xl font-bold text-[#2D2D2D]">
              Shipment
            </h1>

            <span
              className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full border ${
                STATUS_COLORS[
                  shipment.status
                ] ??
                "bg-gray-50 text-gray-600 border-gray-200"
              }`}
            >
              {formatStatus(
                shipment.status,
              )}
            </span>
          </div>

          <p className="text-sm text-gray-400 mt-1 font-mono">
            {shipment.id}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/admin/orders/${shipment.order.id}`}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View Order
          </Link>

          <button
            type="button"
            onClick={() =>
              router.push("/admin/shipments")
            }
            className="rounded-lg bg-[#2D2D2D] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            All Shipments
          </button>
        </div>
      </div>

      {customDelivery && (
        <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 px-5 py-4">
          <p className="font-semibold text-orange-800">
            Custom delivery requires contact
          </p>

          <p className="text-sm text-orange-700 mt-1">
            This shipment did not resolve to a
            standard courier option. Contact the
            customer to arrange delivery before
            proceeding with fulfillment.
          </p>
        </div>
      )}

      {updateError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {updateError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <section className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#2D2D2D]">
                Shipment Status
              </h2>

              <p className="text-xs text-gray-400 mt-1">
                Only valid next statuses are
                available for this shipment.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <select
                  value={selectedStatus}
                  onChange={(event) =>
                    setSelectedStatus(
                      event.target.value,
                    )
                  }
                  disabled={
                    updating ||
                    !hasAllowedTransitions
                  }
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2D2D2D] disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">
                    {hasAllowedTransitions
                      ? "Select new status..."
                      : "No further transitions available"}
                  </option>

                  {shipment.allowedTransitions.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {formatStatus(status)}
                      </option>
                    ),
                  )}
                </select>

                <button
                  type="button"
                  onClick={
                    updateShipmentStatus
                  }
                  disabled={
                    updating ||
                    !selectedStatus ||
                    !hasAllowedTransitions
                  }
                  className="rounded-lg bg-[#2D2D2D] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
                >
                  {updating
                    ? "Updating..."
                    : "Update Status"}
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Shipment note
                </label>

                <textarea
                  value={note}
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                  rows={3}
                  placeholder="Optional note about this status change..."
                  disabled={
                    updating ||
                    !hasAllowedTransitions
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#2D2D2D] disabled:bg-gray-50"
                />
              </div>

              {!hasAllowedTransitions && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  <strong>
                    {formatStatus(
                      shipment.status,
                    )}
                  </strong>{" "}
                  is a terminal shipment status.
                  No further status transitions
                  are currently permitted.
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#2D2D2D]">
                Tracking
              </h2>

              <p className="text-xs text-gray-400 mt-1">
                The tracking number is stored on
                the shipment and captured in status
                history when a status changes.
              </p>
            </div>

            <div className="p-5">
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(event) =>
                    setTrackingNumber(
                      event.target.value,
                    )
                  }
                  placeholder="Enter tracking number"
                  disabled={trackingSaving}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#2D2D2D] disabled:bg-gray-50"
                />

                <button
                  type="button"
                  onClick={saveTrackingNumber}
                  disabled={trackingSaving}
                  className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  {trackingSaving
                    ? "Saving..."
                    : "Save Tracking"}
                </button>
              </div>

              {shipment.trackingNumber && (
                <p className="text-xs text-gray-400 mt-2">
                  Current tracking number:{" "}
                  <span className="font-mono text-gray-600">
                    {shipment.trackingNumber}
                  </span>
                </p>
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#2D2D2D]">
                Shipment Timeline
              </h2>
            </div>

            <div className="p-5">
              {shipment.events.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No shipment events recorded yet.
                </p>
              ) : (
                <div className="space-y-5">
                  {shipment.events.map(
                    (event, index) => (
                      <div
                        key={event.id}
                        className="relative pl-6"
                      >
                        {index <
                          shipment.events.length -
                            1 && (
                          <div className="absolute left-[7px] top-3 bottom-[-20px] w-px bg-gray-200" />
                        )}

                        <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#2D2D2D] shadow-sm" />

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            {event.fromStatus && (
                              <>
                                <span className="text-sm font-medium text-gray-600">
                                  {formatStatus(
                                    event.fromStatus,
                                  )}
                                </span>

                                <span className="text-gray-300">
                                  →
                                </span>
                              </>
                            )}

                            <span className="text-sm font-semibold text-[#2D2D2D]">
                              {formatStatus(
                                event.toStatus,
                              )}
                            </span>
                          </div>

                          <p className="text-xs text-gray-400 mt-1">
                            {formatDateTime(
                              event.createdAt,
                            )}
                          </p>

                          {event.note && (
                            <p className="text-sm text-gray-600 mt-2">
                              {event.note}
                            </p>
                          )}

                          {event.trackingNumber && (
                            <p className="text-xs text-gray-400 mt-2">
                              Tracking:{" "}
                              <span className="font-mono text-gray-600">
                                {
                                  event.trackingNumber
                                }
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#2D2D2D]">
                Items
              </h2>
            </div>

            <div className="divide-y divide-gray-100">
              {shipment.order.items.map(
                (item) => (
                  <div
                    key={item.id}
                    className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#2D2D2D]">
                        {item.product.name}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        {getVariantLabel(item)}
                      </p>
                    </div>

                    <div className="flex items-center gap-5 text-sm">
                      <span className="text-gray-500">
                        Qty: {item.quantity}
                      </span>

                      <span className="font-medium text-[#2D2D2D]">
                        {formatMoney(
                          Number(
                            item.priceAtPurchase,
                          ) *
                            item.quantity,
                          currency,
                        )}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#2D2D2D]">
                Shipment Summary
              </h2>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Status
                </span>

                <span className="text-sm font-medium text-right">
                  {formatStatus(
                    shipment.status,
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Shipping points
                </span>

                <span className="text-sm font-medium">
                  {shipment.shippingPoints}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Selection method
                </span>

                <span className="text-sm font-medium text-right">
                  {formatStatus(
                    shipment.selectionMethod,
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Customer price
                </span>

                <span className="text-sm font-medium">
                  {formatMoney(
                    shipment.customerShippingPrice,
                    currency,
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Courier cost
                </span>

                <span className="text-sm font-medium">
                  {formatMoney(
                    shipment.courierCost,
                    currency,
                  )}
                </span>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#2D2D2D]">
                Delivery
              </h2>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-gray-400">
                  Destination
                </p>

                <p className="text-sm font-medium text-[#2D2D2D] mt-1">
                  {shipment.destinationTown}
                </p>

                <p className="text-xs text-gray-500 mt-0.5">
                  {shipment.destinationProvince},{" "}
                  {
                    shipment.destinationCountryCode
                  }
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  Courier
                </p>

                <p className="text-sm font-medium text-[#2D2D2D] mt-1">
                  {courierName}
                </p>

                {shipment.courierCodeSnapshot && (
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">
                    {
                      shipment.courierCodeSnapshot
                    }
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  Delivery zone
                </p>

                <p className="text-sm font-medium text-[#2D2D2D] mt-1">
                  {zoneName}
                </p>

                {shipment.zoneCodeSnapshot && (
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">
                    {shipment.zoneCodeSnapshot}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  Package tier
                </p>

                <p className="text-sm font-medium text-[#2D2D2D] mt-1">
                  {tierName}
                </p>

                {shipment.tierCodeSnapshot && (
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">
                    {shipment.tierCodeSnapshot}
                  </p>
                )}
              </div>

              {shipment.tierIsCustomSnapshot && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700">
                  This shipment uses a custom
                  package tier.
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#2D2D2D]">
                Customer
              </h2>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <p className="text-xs text-gray-400">
                  Name
                </p>

                <p className="text-sm font-medium text-[#2D2D2D] mt-1">
                  {getCustomerName(
                    shipment,
                  )}
                </p>
              </div>

              {getCustomerEmail(
                shipment,
              ) && (
                <div>
                  <p className="text-xs text-gray-400">
                    Email
                  </p>

                  <p className="text-sm text-gray-700 mt-1 break-all">
                    {getCustomerEmail(
                      shipment,
                    )}
                  </p>
                </div>
              )}

              {getCustomerPhone(
                shipment,
              ) && (
                <div>
                  <p className="text-xs text-gray-400">
                    Phone
                  </p>

                  <p className="text-sm text-gray-700 mt-1">
                    {getCustomerPhone(
                      shipment,
                    )}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#2D2D2D]">
                Order
              </h2>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Order
                </span>

                <Link
                  href={`/admin/orders/${shipment.order.id}`}
                  className="text-sm font-medium text-[#2D2D2D] hover:underline"
                >
                  {shipment.order.orderNumber}
                </Link>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Order status
                </span>

                <span className="text-sm font-medium text-right">
                  {formatStatus(
                    shipment.order.status,
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Payment status
                </span>

                <span className="text-sm font-medium text-right">
                  {formatStatus(
                    shipment.order.paymentStatus,
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Subtotal
                </span>

                <span className="text-sm font-medium">
                  {formatMoney(
                    shipment.order.subtotal,
                    currency,
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Shipping
                </span>

                <span className="text-sm font-medium">
                  {formatMoney(
                    shipment.order.shippingCost,
                    currency,
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between gap-4">
                <span className="text-sm font-semibold text-[#2D2D2D]">
                  Total
                </span>

                <span className="text-sm font-bold text-[#2D2D2D]">
                  {formatMoney(
                    shipment.order.total,
                    currency,
                  )}
                </span>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#2D2D2D]">
                Important Dates
              </h2>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Created
                </span>

                <span className="text-sm text-right">
                  {formatDateTime(
                    shipment.createdAt,
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Last updated
                </span>

                <span className="text-sm text-right">
                  {formatDateTime(
                    shipment.updatedAt,
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Status changed
                </span>

                <span className="text-sm text-right">
                  {formatDateTime(
                    shipment.statusChangedAt,
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Collected
                </span>

                <span className="text-sm text-right">
                  {formatDate(
                    shipment.collectedAt,
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Delivered
                </span>

                <span className="text-sm text-right">
                  {formatDate(
                    shipment.deliveredAt,
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Cancelled
                </span>

                <span className="text-sm text-right">
                  {formatDate(
                    shipment.cancelledAt,
                  )}
                </span>
              </div>
            </div>
          </section>

          {shipment.order.shippingAddress && (
            <section className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-[#2D2D2D]">
                  Shipping Address
                </h2>
              </div>

              <div className="p-5">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {shipment.order.shippingAddress}
                </p>
              </div>
            </section>
          )}

          {shipment.order.notes && (
            <section className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-[#2D2D2D]">
                  Order Notes
                </h2>
              </div>

              <div className="p-5">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {shipment.order.notes}
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}