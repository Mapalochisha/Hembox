"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Package,
  Search,
  Truck,
  XCircle,
} from "lucide-react";

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
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    total: number | string;
    createdAt: string;
    guestName: string | null;
    guestEmail: string | null;
    customer: {
      id: string;
      name: string | null;
      email: string | null;
    } | null;
  };
  courier: {
    id: string;
    code: string;
    name: string;
  } | null;
  deliveryZone: {
    id: string;
    code: string;
    name: string;
  } | null;
  packageTier: {
    id: string;
    code: string;
    name: string;
    minPoints: number;
    maxPoints: number | null;
    isCustom: boolean;
  } | null;
  events: ShipmentEvent[];
}

const SHIPMENT_STATUSES = [
  "ALL",
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
] as const;

const STATUS_STYLES: Record<
  string,
  {
    badge: string;
    dot: string;
  }
> = {
  PENDING: {
    badge: "bg-gray-100 text-gray-700",
    dot: "bg-gray-500",
  },
  READY_FOR_COURIER: {
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  COLLECTED: {
    badge: "bg-indigo-100 text-indigo-700",
    dot: "bg-indigo-500",
  },
  IN_TRANSIT: {
    badge: "bg-purple-100 text-purple-700",
    dot: "bg-purple-500",
  },
  DELIVERED: {
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  FAILED_DELIVERY: {
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
  },
  RETURNED: {
    badge: "bg-yellow-100 text-yellow-800",
    dot: "bg-yellow-500",
  },
  CANCELLED: {
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
  LOST: {
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-600",
  },
  DAMAGED: {
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-600",
  },
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function getCustomerName(shipment: Shipment) {
  return (
    shipment.order.customer?.name ||
    shipment.order.guestName ||
    "Guest customer"
  );
}

function getCustomerEmail(shipment: Shipment) {
  return shipment.order.customer?.email || shipment.order.guestEmail || "—";
}

function getStatusStyle(status: string) {
  return (
    STATUS_STYLES[status] || {
      badge: "bg-gray-100 text-gray-700",
      dot: "bg-gray-500",
    }
  );
}

function formatMoney(
  value: number | string | null,
  currencyCode: string,
) {
  if (value === null || value === undefined) {
    return "—";
  }

  const amount =
    typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

export default function AdminShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [statusFilter, setStatusFilter] =
    useState<(typeof SHIPMENT_STATUSES)[number]>("ALL");
  const [courierFilter, setCourierFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingShipmentId, setUpdatingShipmentId] =
    useState<string | null>(null);

  const loadShipments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      if (courierFilter) {
        params.set("courierId", courierFilter);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const query = params.toString();

      const response = await fetch(
        `/api/admin/shipments${query ? `?${query}` : ""}`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to load shipments",
        );
      }

      setShipments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load shipments",
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, courierFilter, search]);

  useEffect(() => {
    void loadShipments();
  }, [loadShipments]);

  const couriers = useMemo(() => {
    const map = new Map<string, string>();

    for (const shipment of shipments) {
      if (shipment.courier) {
        map.set(
          shipment.courier.id,
          shipment.courier.name,
        );
      }
    }

    return Array.from(map.entries()).sort((a, b) =>
      a[1].localeCompare(b[1]),
    );
  }, [shipments]);

  const summary = useMemo(() => {
    return {
      total: shipments.length,
      pending: shipments.filter(
        (shipment) => shipment.status === "PENDING",
      ).length,
      ready: shipments.filter(
        (shipment) => shipment.status === "READY_FOR_COURIER",
      ).length,
      inTransit: shipments.filter(
        (shipment) => shipment.status === "IN_TRANSIT",
      ).length,
      delivered: shipments.filter(
        (shipment) => shipment.status === "DELIVERED",
      ).length,
      failed: shipments.filter(
        (shipment) => shipment.status === "FAILED_DELIVERY",
      ).length,
      custom: shipments.filter(
        (shipment) =>
          shipment.tierIsCustomSnapshot ||
          shipment.selectionMethod === "CUSTOM_CONTACT_REQUIRED",
      ).length,
    };
  }, [shipments]);

  async function updateShipmentStatus(
    shipmentId: string,
    status: string,
  ) {
    setUpdatingShipmentId(shipmentId);
    setError(null);

    try {
      const response = await fetch("/api/admin/shipments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-shipment-id": shipmentId,
        },
        body: JSON.stringify({
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to update shipment",
        );
      }

      setShipments((current) =>
        current.map((shipment) =>
          shipment.id === shipmentId
            ? {
                ...shipment,
                status: data.status,
                trackingNumber:
                  data.trackingNumber ??
                  shipment.trackingNumber,
                statusChangedAt:
                  data.statusChangedAt ??
                  shipment.statusChangedAt,
                collectedAt:
                  data.collectedAt ?? shipment.collectedAt,
                deliveredAt:
                  data.deliveredAt ?? shipment.deliveredAt,
                cancelledAt:
                  data.cancelledAt ?? shipment.cancelledAt,
              }
            : shipment,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update shipment",
      );
    } finally {
      setUpdatingShipmentId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#2D2D2D]">
              Shipments
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage fulfillment, courier handoff, tracking,
              delivery status, and shipment history.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadShipments()}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Package className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Total
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-[#2D2D2D]">
            {summary.total}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock3 className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Pending
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-[#2D2D2D]">
            {summary.pending}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Truck className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Ready
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-[#2D2D2D]">
            {summary.ready}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Truck className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              In Transit
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-[#2D2D2D]">
            {summary.inTransit}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Delivered
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-[#2D2D2D]">
            {summary.delivered}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <XCircle className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Failed
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-[#2D2D2D]">
            {summary.failed}
          </p>
        </div>

        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Custom
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-orange-700">
            {summary.custom}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search order, customer, email or tracking number..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as (typeof SHIPMENT_STATUSES)[number],
              )
            }
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-gray-400"
          >
            {SHIPMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === "ALL"
                  ? "All shipment statuses"
                  : formatStatus(status)}
              </option>
            ))}
          </select>

          <select
            value={courierFilter}
            onChange={(event) =>
              setCourierFilter(event.target.value)
            }
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-gray-400"
          >
            <option value="">All couriers</option>

            {couriers.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-sm text-gray-500">
              Loading shipments...
            </div>
          </div>
        ) : shipments.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <Package className="h-10 w-10 text-gray-300" />

            <h2 className="mt-4 text-sm font-semibold text-gray-800">
              No shipments found
            </h2>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              No shipments match the current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1250px] w-full text-left">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Shipment
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Destination
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Courier
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Tier
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Shipping
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {shipments.map((shipment) => {
                  const statusStyle = getStatusStyle(
                    shipment.status,
                  );

                  const isCustom =
                    shipment.tierIsCustomSnapshot ||
                    shipment.selectionMethod ===
                      "CUSTOM_CONTACT_REQUIRED";

                  return (
                    <tr
                      key={shipment.id}
                      className="transition hover:bg-gray-50/70"
                    >
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1">
                          <Link
                            href={`/admin/shipments/${shipment.id}`}
                            className="font-semibold text-[#2D2D2D] hover:underline"
                          >
                            {shipment.order.orderNumber}
                          </Link>

                          <p className="text-xs text-gray-500">
                            Created{" "}
                            {formatDate(shipment.createdAt)}
                          </p>

                          {shipment.trackingNumber ? (
                            <p className="text-xs font-medium text-gray-700">
                              Tracking:{" "}
                              {shipment.trackingNumber}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400">
                              No tracking number
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-800">
                            {getCustomerName(shipment)}
                          </p>

                          <p className="max-w-[210px] truncate text-xs text-gray-500">
                            {getCustomerEmail(shipment)}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-800">
                            {shipment.destinationTown}
                          </p>

                          <p className="text-xs text-gray-500">
                            {shipment.destinationProvince}
                          </p>

                          <p className="text-xs text-gray-400">
                            {shipment.destinationCountryCode}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        {shipment.courier ? (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-800">
                              {shipment.courier.name}
                            </p>

                            <p className="text-xs text-gray-500">
                              {shipment.courier.code}
                            </p>

                            {shipment.deliveryZone && (
                              <p className="text-xs text-gray-400">
                                {shipment.deliveryZone.name}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Custom delivery
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top">
                        {isCustom ? (
                          <div>
                            <span className="inline-flex rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
                              Custom
                            </span>

                            <p className="mt-1 text-xs text-gray-500">
                              {shipment.shippingPoints}{" "}
                              points
                            </p>
                          </div>
                        ) : shipment.packageTier ||
                          shipment.tierNameSnapshot ? (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-800">
                              {shipment.packageTier?.name ||
                                shipment.tierNameSnapshot}
                            </p>

                            <p className="text-xs text-gray-500">
                              {shipment.shippingPoints} points
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-500">
                              No tier
                            </p>

                            <p className="text-xs text-gray-400">
                              {shipment.shippingPoints} points
                            </p>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-800">
                            {formatMoney(
                              shipment.customerShippingPrice,
                              shipment.currencyCode,
                            )}
                          </p>

                          {shipment.courierCost !== null && (
                            <p className="text-xs text-gray-500">
                              Courier:{" "}
                              {formatMoney(
                                shipment.courierCost,
                                shipment.currencyCode,
                              )}
                            </p>
                          )}

                          <p className="text-xs text-gray-400">
                            {shipment.shippingPoints} points
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <select
                          value={shipment.status}
                          disabled={
                            updatingShipmentId ===
                            shipment.id
                          }
                          onChange={(event) =>
                            void updateShipmentStatus(
                              shipment.id,
                              event.target.value,
                            )
                          }
                          className={`rounded-full border-0 px-3 py-1.5 text-xs font-medium outline-none disabled:cursor-not-allowed disabled:opacity-60 ${statusStyle.badge}`}
                        >
                          {SHIPMENT_STATUSES.filter(
                            (status) => status !== "ALL",
                          ).map((status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {formatStatus(status)}
                            </option>
                          ))}
                        </select>

                        <p className="mt-2 text-xs text-gray-400">
                          Changed{" "}
                          {formatDateTime(
                            shipment.statusChangedAt,
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-col items-start gap-1.5">
                          <Link
                            href={`/admin/shipments/${shipment.id}`}
                            className="text-xs font-semibold text-[#2D2D2D] hover:underline whitespace-nowrap"
                          >
                            View Shipment
                          </Link>

                          <Link
                            href={`/admin/orders/${shipment.order.id}`}
                            className="text-xs font-medium text-gray-500 hover:text-[#2D2D2D] hover:underline whitespace-nowrap"
                          >
                            View Order
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}