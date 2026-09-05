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

const SHIPMENT_STATUSES = [
  "PENDING",
  "READY_FOR_COURIER",
  "COLLECTED",
  "IN_TRANSIT",
  "DELIVERED",
  "FAILED_DELIVERY",
  "RETURNED",
  "CANCELLED",
  "LOST",
  "DAMAGED",
];

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
  return (
    shipment.order.customer?.phone ?? ""
  );
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
                ] ?? "bg-gray-50 text-gray-600 border-gray-200"
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
            onClick={() => router.push("/admin/shipments")}
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
                Update the fulfillment progress
                and optionally record a note.
              </p>
            </div>

            <div className="p-5">
              <div className="flex flex-col md:flex-row gap-3">
                <select
                  value={selectedStatus}
                  onChange={(event) =>
                    setSelectedStatus(
                      event.target.value,
                    )
                  }
                  disabled={updating}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2D2D2D]"
                >
                  <option value="">
                    Select new status...
                  </option>

                  {SHIPMENT_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                        disabled={
                          status ===
                          shipment.status
                        }
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
                    !selectedStatus
                  }
                  className="rounded-lg bg-[#2D2D2D] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
                >
                  {updating
                    ? "Updating..."
                    : "Update Status"}
                </button>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="shipment-note"
                  className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
                >
                  Status Note
                </label>

                <textarea
                  id="shipment-note"
                  value={note}
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                  rows={3}
                  placeholder="Optional note about this status change..."
                  disabled={updating}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none resize-y focus:border-[#2D2D2D]"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#2D2D2D]">
                Tracking
              </h2>
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
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-mono outline-none focus:border-[#2D2D2D]"
                />

                <button
                  type="button"
                  onClick={saveTrackingNumber}
                  disabled={trackingSaving}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  {trackingSaving
                    ? "Saving..."
                    : "Save Tracking"}
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Leave empty to remove the tracking
                number.
              </p>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#2D2D2D]">
                Delivery Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 p-5">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Destination
                </p>
                <p className="text-sm font-medium text-gray-700 mt-1">
                  {shipment.destinationTown}
                </p>
                <p className="text-sm text-gray-500">
                  {shipment.destinationProvince}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {shipment.destinationCountryCode}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Delivery Zone
                </p>
                <p className="text-sm font-medium text-gray-700 mt-1">
                  {zoneName}
                </p>
                {shipment.zoneCodeSnapshot && (
                  <p className="text-xs text-gray-400">
                    {shipment.zoneCodeSnapshot}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Courier
                </p>
                <p className="text-sm font-medium text-gray-700 mt-1">
                  {courierName}
                </p>
                <p className="text-xs text-gray-400">
                  {shipment.courierCodeSnapshot ??
                    shipment.courier?.code ??
                    "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Package Tier
                </p>
                <p className="text-sm font-medium text-gray-700 mt-1">
                  {tierName}
                </p>
                <p className="text-xs text-gray-400">
                  {shipment.shippingPoints}{" "}
                  point
                  {shipment.shippingPoints !==
                  1
                    ? "s"
                    : ""}
                </p>

                {shipment.tierIsCustomSnapshot && (
                  <p className="text-xs text-orange-600 mt-1">
                    Custom tier
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Selection Method
                </p>
                <p className="text-sm font-medium text-gray-700 mt-1">
                  {formatStatus(
                    shipment.selectionMethod,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Rate
                </p>
                <p className="text-sm font-medium text-gray-700 mt-1 font-mono">
                  {shipment.rateIdSnapshot ??
                    "—"}
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#2D2D2D]">
                Shipment Timeline
              </h2>
            </div>

            {shipment.events.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                No shipment events recorded.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {shipment.events.map(
                  (event) => (
                    <div
                      key={event.id}
                      className="p-5"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            {event.fromStatus && (
                              <>
                                <span className="text-xs text-gray-500">
                                  {formatStatus(
                                    event.fromStatus,
                                  )}
                                </span>
                                <span className="text-gray-300">
                                  →
                                </span>
                              </>
                            )}

                            <span
                              className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full border ${
                                STATUS_COLORS[
                                  event.toStatus
                                ] ??
                                "bg-gray-50 text-gray-600 border-gray-200"
                              }`}
                            >
                              {formatStatus(
                                event.toStatus,
                              )}
                            </span>
                          </div>

                          {event.note && (
                            <p className="text-sm text-gray-600 mt-2">
                              {event.note}
                            </p>
                          )}

                          {event.trackingNumber && (
                            <p className="text-xs text-gray-400 font-mono mt-2">
                              Tracking:{" "}
                              {
                                event.trackingNumber
                              }
                            </p>
                          )}
                        </div>

                        <p className="text-xs text-gray-400 whitespace-nowrap">
                          {formatDateTime(
                            event.createdAt,
                          )}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
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
                  Customer price
                </span>
                <span className="text-sm font-semibold text-gray-700">
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
                <span className="text-sm font-semibold text-gray-700">
                  {formatMoney(
                    shipment.courierCost,
                    currency,
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Shipping points
                </span>
                <span className="text-sm font-semibold text-gray-700">
                  {shipment.shippingPoints}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Pricing strategy
                </span>
                <span className="text-sm font-medium text-gray-700 text-right">
                  {shipment.pricingStrategySnapshot
                    ? formatStatus(
                        shipment.pricingStrategySnapshot,
                      )
                    : "—"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Pricing value
                </span>
                <span className="text-sm font-semibold text-gray-700">
                  {formatMoney(
                    shipment.pricingValueSnapshot,
                    currency,
                  )}
                </span>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#2D2D2D]">
                Customer
              </h2>
            </div>

            <div className="p-5">
              <p className="text-sm font-semibold text-gray-700">
                {getCustomerName(shipment)}
              </p>

              {getCustomerEmail(
                shipment,
              ) && (
                <p className="text-sm text-gray-500 mt-1 break-all">
                  {getCustomerEmail(
                    shipment,
                  )}
                </p>
              )}

              {getCustomerPhone(
                shipment,
              ) && (
                <p className="text-sm text-gray-500 mt-1">
                  {getCustomerPhone(
                    shipment,
                  )}
                </p>
              )}

              <Link
                href={`/admin/orders/${shipment.order.id}`}
                className="inline-block mt-4 text-xs font-medium text-[#2D2D2D] hover:underline"
              >
                View customer/order →
              </Link>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#2D2D2D]">
                Order
              </h2>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Order Number
                </p>

                <Link
                  href={`/admin/orders/${shipment.order.id}`}
                  className="text-sm font-bold font-mono text-[#2D2D2D] hover:underline mt-1 inline-block"
                >
                  {shipment.order.orderNumber}
                </Link>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-500">
                  Order status
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {formatStatus(
                    shipment.order.status,
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-500">
                  Payment
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {formatStatus(
                    shipment.order
                      .paymentStatus,
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-500">
                  Order total
                </span>
                <span className="text-sm font-semibold text-gray-700">
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
                <span className="text-xs text-gray-600 text-right">
                  {formatDateTime(
                    shipment.createdAt,
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Last status change
                </span>
                <span className="text-xs text-gray-600 text-right">
                  {formatDateTime(
                    shipment.statusChangedAt,
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Collected
                </span>
                <span className="text-xs text-gray-600 text-right">
                  {formatDateTime(
                    shipment.collectedAt,
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Delivered
                </span>
                <span className="text-xs text-gray-600 text-right">
                  {formatDateTime(
                    shipment.deliveredAt,
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Cancelled
                </span>
                <span className="text-xs text-gray-600 text-right">
                  {formatDateTime(
                    shipment.cancelledAt,
                  )}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="bg-white rounded-xl border border-gray-200 mt-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#2D2D2D]">
            Items in Shipment
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">
                  Product
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">
                  Variant
                </th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">
                  Qty
                </th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">
                  Unit Price
                </th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">
                  Total
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {shipment.order.items.map(
                (item) => {
                  const unitPrice =
                    Number(
                      item.priceAtPurchase,
                    ) || 0;

                  const lineTotal =
                    unitPrice *
                    item.quantity;

                  return (
                    <tr key={item.id}>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-700">
                          {item.product.name}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs font-mono text-gray-500">
                          {item.variantId}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-right text-sm text-gray-700">
                        {item.quantity}
                      </td>

                      <td className="px-5 py-4 text-right text-sm text-gray-700">
                        {formatMoney(
                          unitPrice,
                          currency,
                        )}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold text-gray-700">
                        {formatMoney(
                          lineTotal,
                          currency,
                        )}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 mt-6 mb-8">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#2D2D2D]">
            Shipping Address
          </h2>
        </div>

        <div className="p-5">
          {shipment.order.shippingAddress ? (
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {shipment.order.shippingAddress}
            </p>
          ) : (
            <div>
              <p className="text-sm text-gray-500">
                {shipment.destinationTown}
              </p>
              <p className="text-sm text-gray-500">
                {shipment.destinationProvince}
              </p>
              <p className="text-sm text-gray-500">
                {
                  shipment.destinationCountryCode
                }
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}