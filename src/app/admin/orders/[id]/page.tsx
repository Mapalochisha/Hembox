"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ShipmentEvent {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  trackingNumber: string | null;
  createdAt: string;
}

interface Shipment {
  id: string;
  status: string;
  selectionMethod: string;
  shippingPoints: number;
  customerShippingPrice: number | null;
  courierCost: number | null;
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
  pricingStrategySnapshot: string | null;
  pricingValueSnapshot: number | null;
  createdAt: string;
  updatedAt: string;
  statusChangedAt: string;
  collectedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  events: ShipmentEvent[];
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  createdAt: string;
  guestName: string | null;
  guestEmail: string | null;
  notes: string | null;
  trackingNumber: string | null;
  shippingAddress: any;
  customer: {
    name: string | null;
    email: string;
    phone: string | null;
  } | null;
  items: {
    id: string;
    productName: string;
    sku: string;
    quantity: number;
    priceAtPurchase: number;
    total: number;
    variantSnapshot: any;
  }[];
  shipment: Shipment | null;
}

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "ARCHIVED",
];

const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

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

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(
  value: number | null,
  currency = "ZMW",
) {
  if (value === null) {
    return "—";
  }

  const prefix = currency === "ZMW" ? "K " : `${currency} `;

  return `${prefix}${Number(value).toFixed(2)}`;
}

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const [shipmentStatus, setShipmentStatus] = useState("");
  const [shipmentNote, setShipmentNote] = useState("");

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/admin/orders/${params.id}`,
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load order",
          );
        }

        setOrder(data);
        setStatus(data.status);
        setPaymentStatus(data.paymentStatus);
        setTrackingNumber(
          data.trackingNumber ??
            data.shipment?.trackingNumber ??
            "",
        );
        setShipmentStatus(
          data.shipment?.status ?? "",
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load order",
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [params.id]);

  async function handleSaveOrder() {
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/orders/${params.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            paymentStatus,
            trackingNumber,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to update order",
        );
      }

      setOrder(data);
      setStatus(data.status);
      setPaymentStatus(data.paymentStatus);
      setTrackingNumber(
        data.trackingNumber ??
          data.shipment?.trackingNumber ??
          "",
      );
      setShipmentStatus(
        data.shipment?.status ?? "",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update order",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleShipmentUpdate() {
    if (!order?.shipment) {
      return;
    }

    if (!shipmentStatus) {
      setError("Please select a shipment status.");
      return;
    }

    if (shipmentStatus === order.shipment.status) {
      setError(
        "Please select a different shipment status.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/orders/${params.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shipmentStatus,
            shipmentNote:
              shipmentNote.trim() || null,
            trackingNumber:
              trackingNumber.trim() || null,
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

      setOrder(data);
      setStatus(data.status);
      setPaymentStatus(data.paymentStatus);
      setTrackingNumber(
        data.trackingNumber ??
          data.shipment?.trackingNumber ??
          "",
      );
      setShipmentStatus(
        data.shipment?.status ?? "",
      );
      setShipmentNote("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update shipment",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (
      !confirm(
        "Archive this order? It will be hidden from the main orders view.",
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/orders/${params.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "ARCHIVED",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to archive order",
        );
      }

      router.push("/admin/orders");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to archive order",
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-gray-400 p-8">
        Loading order...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-sm text-gray-400 p-8">
        {error || "Order not found."}
      </div>
    );
  }

  const address = order.shippingAddress as
    | {
        address?: string;
        city?: string;
        province?: string;
        phone?: string;
      }
    | null;

  const shipment = order.shipment;

  const isCustomDelivery =
    shipment?.selectionMethod ===
    "CUSTOM_CONTACT_REQUIRED";

  const isFreeShipping =
    !isCustomDelivery &&
    shipment?.pricingStrategySnapshot === "FREE";

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/orders"
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft size={20} />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">
            Order {order.orderNumber}
          </h1>

          <p className="text-sm text-gray-400 mt-0.5">
            {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="col-span-2 space-y-6">
          {/* ITEMS */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-[#2D2D2D] mb-4">
              Items Ordered
            </h2>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start py-3 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {item.productName}
                    </p>

                    <p className="text-xs text-gray-400 mt-0.5">
                      SKU: {item.sku}
                    </p>

                    {item.variantSnapshot?.attributes &&
                      Object.keys(
                        item.variantSnapshot.attributes,
                      ).length > 0 && (
                        <p className="text-xs text-gray-400">
                          {Object.entries(
                            item.variantSnapshot
                              .attributes,
                          )
                            .map(
                              ([key, value]) =>
                                `${key}: ${value}`,
                            )
                            .join(" · ")}
                        </p>
                      )}

                    <p className="text-xs text-gray-400">
                      Qty: {item.quantity} × K{" "}
                      {Number(
                        item.priceAtPurchase,
                      ).toFixed(2)}
                    </p>
                  </div>

                  <p className="text-sm font-bold text-gray-800">
                    K{" "}
                    {Number(item.total).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span>
                <span>
                  K{" "}
                  {Number(
                    order.subtotal,
                  ).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-xs text-gray-500">
                <span>Shipping</span>

                <span>
                  {isCustomDelivery ? (
                    <span className="font-medium text-amber-700">
                      Requires confirmation
                    </span>
                  ) : isFreeShipping ? (
                    "Free"
                  ) : (
                    formatMoney(
                      Number(order.shippingCost),
                      shipment?.currencyCode ??
                        "ZMW",
                    )
                  )}
                </span>
              </div>

              <div className="flex justify-between text-sm font-bold text-gray-800 pt-1">
                <span>Total</span>
                <span>
                  K{" "}
                  {Number(order.total).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* SHIPMENT */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="font-semibold text-[#2D2D2D]">
                  Shipment
                </h2>

                <p className="text-xs text-gray-400 mt-1">
                  Physical fulfillment is managed separately
                  from order and payment status.
                </p>
              </div>

              {shipment && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  {formatStatus(shipment.status)}
                </span>
              )}
            </div>

            {!shipment ? (
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                <p className="text-sm text-gray-600">
                  No shipment record exists for this order.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400">
                      Courier
                    </p>
                    <p className="text-sm font-medium text-gray-800 mt-1">
                      {shipment.courierNameSnapshot ??
                        "Custom delivery"}
                    </p>
                    {shipment.courierCodeSnapshot && (
                      <p className="text-xs text-gray-400">
                        {shipment.courierCodeSnapshot}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400">
                      Package Tier
                    </p>
                    <p className="text-sm font-medium text-gray-800 mt-1">
                      {shipment.tierNameSnapshot ??
                        "Custom"}
                    </p>

                    {shipment.tierIsCustomSnapshot ? (
                      <p className="text-xs text-amber-600">
                        Custom tier
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">
                        {shipment.tierMinPointsSnapshot ??
                          "—"}{" "}
                        –{" "}
                        {shipment.tierMaxPointsSnapshot ??
                          "—"}{" "}
                        points
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400">
                      Delivery Zone
                    </p>
                    <p className="text-sm font-medium text-gray-800 mt-1">
                      {shipment.zoneNameSnapshot ??
                        "Custom delivery"}
                    </p>

                    {shipment.zoneCodeSnapshot && (
                      <p className="text-xs text-gray-400">
                        {shipment.zoneCodeSnapshot}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400">
                      Shipping Points
                    </p>
                    <p className="text-sm font-medium text-gray-800 mt-1">
                      {shipment.shippingPoints}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400">
                      Customer Shipping Price
                    </p>
                    <p className="text-sm font-medium text-gray-800 mt-1">
                      {isCustomDelivery
                        ? "Requires confirmation"
                        : formatMoney(
                            shipment.customerShippingPrice,
                            shipment.currencyCode,
                          )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400">
                      Courier Cost
                    </p>
                    <p className="text-sm font-medium text-gray-800 mt-1">
                      {formatMoney(
                        shipment.courierCost,
                        shipment.currencyCode,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400">
                      Selection
                    </p>
                    <p className="text-sm font-medium text-gray-800 mt-1">
                      {formatStatus(
                        shipment.selectionMethod,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400">
                      Created
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      {formatDate(
                        shipment.createdAt,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-gray-100">
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                    Destination
                  </p>

                  <p className="text-sm text-gray-800">
                    {shipment.destinationTown},{" "}
                    {shipment.destinationProvince}
                  </p>

                  <p className="text-xs text-gray-400 mt-0.5">
                    {shipment.destinationCountryCode}
                  </p>
                </div>

                {/* SHIPMENT UPDATE */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4">
                    Update Shipment
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                        Shipment Status
                      </label>

                      <select
                        value={shipmentStatus}
                        onChange={(event) =>
                          setShipmentStatus(
                            event.target.value,
                          )
                        }
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
                      >
                        {SHIPMENT_STATUSES.map(
                          (shipmentStatusOption) => (
                            <option
                              key={
                                shipmentStatusOption
                              }
                              value={
                                shipmentStatusOption
                              }
                            >
                              {formatStatus(
                                shipmentStatusOption,
                              )}
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                        Tracking Number
                      </label>

                      <input
                        value={trackingNumber}
                        onChange={(event) =>
                          setTrackingNumber(
                            event.target.value,
                          )
                        }
                        placeholder="e.g. ZM1234567890"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                      Shipment Note
                    </label>

                    <textarea
                      value={shipmentNote}
                      onChange={(event) =>
                        setShipmentNote(
                          event.target.value,
                        )
                      }
                      rows={3}
                      placeholder="Optional note about this shipment status change..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleShipmentUpdate}
                    disabled={saving}
                    className={`mt-4 px-6 py-2.5 text-sm font-semibold rounded-lg text-white transition-colors ${
                      saving
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-[#2D2D2D] hover:bg-black"
                    }`}
                  >
                    {saving
                      ? "Saving..."
                      : "Update Shipment"}
                  </button>
                </div>

                {/* SHIPMENT HISTORY */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4">
                    Shipment History
                  </h3>

                  {shipment.events.length === 0 ? (
                    <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                      <p className="text-xs text-gray-400">
                        No shipment events recorded yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {shipment.events.map(
                        (event, index) => (
                          <div
                            key={event.id}
                            className="relative pl-5"
                          >
                            {index <
                              shipment.events.length -
                                1 && (
                              <div className="absolute left-[5px] top-3 bottom-[-16px] w-px bg-gray-200" />
                            )}

                            <div className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-gray-400" />

                            <div>
                              <div className="flex items-center justify-between gap-4">
                                <p className="text-sm font-medium text-gray-800">
                                  {event.fromStatus
                                    ? `${formatStatus(
                                        event.fromStatus,
                                      )} → `
                                    : ""}
                                  {formatStatus(
                                    event.toStatus,
                                  )}
                                </p>

                                <p className="text-xs text-gray-400 whitespace-nowrap">
                                  {formatDate(
                                    event.createdAt,
                                  )}
                                </p>
                              </div>

                              {event.trackingNumber && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Tracking:{" "}
                                  {event.trackingNumber}
                                </p>
                              )}

                              {event.note && (
                                <div className="mt-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                                  <p className="text-xs text-gray-600 leading-relaxed">
                                    {event.note}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ORDER UPDATE */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-[#2D2D2D] mb-4">
              Update Order
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Order Status
                </label>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value)
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
                >
                  {ORDER_STATUSES.map(
                    (orderStatus) => (
                      <option
                        key={orderStatus}
                        value={orderStatus}
                      >
                        {formatStatus(orderStatus)}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Payment Status
                </label>

                <select
                  value={paymentStatus}
                  onChange={(event) =>
                    setPaymentStatus(
                      event.target.value,
                    )
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
                >
                  {PAYMENT_STATUSES.map(
                    (paymentStatusOption) => (
                      <option
                        key={paymentStatusOption}
                        value={paymentStatusOption}
                      >
                        {formatStatus(
                          paymentStatusOption,
                        )}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleSaveOrder}
                disabled={saving}
                className={`px-6 py-2.5 text-sm font-semibold rounded-lg text-white transition-colors ${
                  saving
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#2D2D2D] hover:bg-black"
                }`}
              >
                {saving
                  ? "Saving..."
                  : "Save Order Changes"}
              </button>

              {status !== "ARCHIVED" && (
                <button
                  onClick={handleArchive}
                  disabled={saving}
                  className="px-6 py-2.5 text-sm font-semibold rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-30"
                >
                  Archive Order
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* CUSTOMER */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-[#2D2D2D] mb-4">
              Customer
            </h2>

            <p className="text-sm font-medium text-gray-800">
              {order.customer?.name ??
                order.guestName ??
                "Guest"}
            </p>

            <p className="text-xs text-gray-400 mt-1">
              {order.customer?.email ??
                order.guestEmail}
            </p>

            {order.customer?.phone && (
              <p className="text-xs text-gray-400">
                {order.customer.phone}
              </p>
            )}
          </div>

          {/* SHIPPING ADDRESS */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-[#2D2D2D] mb-4">
              Shipping Address
            </h2>

            {address ? (
              <>
                <p className="text-sm text-gray-700">
                  {address.address}
                </p>

                <p className="text-sm text-gray-700">
                  {address.city},{" "}
                  {address.province}
                </p>

                {address.phone && (
                  <p className="text-xs text-gray-400 mt-1">
                    {address.phone}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-400">
                No address provided
              </p>
            )}
          </div>

          {/* ORDER NOTES */}
          {order.notes && (
            <div className="bg-amber-50 rounded-xl border border-amber-100 p-6">
              <h2 className="font-semibold text-amber-800 mb-2 text-sm">
                Order Notes
              </h2>

              <p className="text-xs text-amber-700 leading-relaxed">
                {order.notes}
              </p>
            </div>
          )}

          {/* CUSTOM DELIVERY WARNING */}
          {isCustomDelivery && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
              <h2 className="font-semibold text-amber-800 mb-2 text-sm">
                Custom Delivery Required
              </h2>

              <p className="text-xs text-amber-700 leading-relaxed">
                No standard courier option was available
                when this order was placed. Shipping cost
                requires manual confirmation with the
                customer.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}