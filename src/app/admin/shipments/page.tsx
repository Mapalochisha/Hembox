"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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
      email: string;
    } | null;
  };
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

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

function formatDateTime(value: string): string {
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

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<
    Shipment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");
  const [courierFilter, setCourierFilter] =
    useState("ALL");
  const [search, setSearch] = useState("");

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [updateError, setUpdateError] =
    useState("");

  async function loadShipments() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      if (courierFilter !== "ALL") {
        params.set("courierId", courierFilter);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const query = params.toString();

      const response = await fetch(
        `/api/admin/shipments${
          query ? `?${query}` : ""
        }`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load shipments",
        );
      }

      setShipments(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load shipments",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadShipments();
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    statusFilter,
    courierFilter,
    search,
  ]);

  const couriers = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        code: string;
      }
    >();

    for (const shipment of shipments) {
      if (shipment.courier) {
        map.set(
          shipment.courier.id,
          shipment.courier,
        );
      }
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        a.name.localeCompare(b.name),
    );
  }, [shipments]);

  const summary = useMemo(() => {
    return {
      total: shipments.length,

      pending: shipments.filter(
        (shipment) =>
          shipment.status === "PENDING",
      ).length,

      ready: shipments.filter(
        (shipment) =>
          shipment.status ===
          "READY_FOR_COURIER",
      ).length,

      inTransit: shipments.filter(
        (shipment) =>
          shipment.status === "IN_TRANSIT",
      ).length,

      delivered: shipments.filter(
        (shipment) =>
          shipment.status === "DELIVERED",
      ).length,

      failed: shipments.filter(
        (shipment) =>
          shipment.status ===
          "FAILED_DELIVERY",
      ).length,

      custom: shipments.filter(
        (shipment) =>
          shipment.selectionMethod ===
          "CUSTOM_CONTACT_REQUIRED",
      ).length,
    };
  }, [shipments]);

  async function updateShipment(
    shipmentId: string,
    status: string,
  ) {
    setUpdatingId(shipmentId);
    setUpdateError("");

    try {
      const response = await fetch(
        "/api/admin/shipments",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-shipment-id": shipmentId,
          },
          body: JSON.stringify({
            status,
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

      await loadShipments();
    } catch (err) {
      setUpdateError(
        err instanceof Error
          ? err.message
          : "Unable to update shipment",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">
            Shipments
          </h1>

          <p className="text-sm text-gray-500 mt-0.5">
            Manage courier fulfillment and
            delivery progress
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {updateError && (
        <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          {updateError}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Total
          </p>

          <p className="text-xl font-bold mt-1">
            {summary.total}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-yellow-200 p-4">
          <p className="text-xs text-yellow-600 uppercase tracking-wider">
            Pending
          </p>

          <p className="text-xl font-bold mt-1 text-yellow-700">
            {summary.pending}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-blue-200 p-4">
          <p className="text-xs text-blue-600 uppercase tracking-wider">
            Ready
          </p>

          <p className="text-xl font-bold mt-1 text-blue-700">
            {summary.ready}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-indigo-200 p-4">
          <p className="text-xs text-indigo-600 uppercase tracking-wider">
            In Transit
          </p>

          <p className="text-xl font-bold mt-1 text-indigo-700">
            {summary.inTransit}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-green-200 p-4">
          <p className="text-xs text-green-600 uppercase tracking-wider">
            Delivered
          </p>

          <p className="text-xl font-bold mt-1 text-green-700">
            {summary.delivered}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-orange-200 p-4">
          <p className="text-xs text-orange-600 uppercase tracking-wider">
            Failed
          </p>

          <p className="text-xl font-bold mt-1 text-orange-700">
            {summary.failed}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-red-200 p-4">
          <p className="text-xs text-red-600 uppercase tracking-wider">
            Custom
          </p>

          <p className="text-xl font-bold mt-1 text-red-700">
            {summary.custom}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="shipment-search"
              className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
            >
              Search
            </label>

            <input
              id="shipment-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Order, customer, email or tracking..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#2D2D2D]"
            />
          </div>

          <div>
            <label
              htmlFor="shipment-status"
              className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
            >
              Shipment Status
            </label>

            <select
              id="shipment-status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:border-[#2D2D2D]"
            >
              {SHIPMENT_STATUSES.map(
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
          </div>

          <div>
            <label
              htmlFor="shipment-courier"
              className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
            >
              Courier
            </label>

            <select
              id="shipment-courier"
              value={courierFilter}
              onChange={(event) =>
                setCourierFilter(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:border-[#2D2D2D]"
            >
              <option value="ALL">
                All Couriers
              </option>

              {couriers.map((courier) => (
                <option
                  key={courier.id}
                  value={courier.id}
                >
                  {courier.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">
          Loading shipments...
        </div>
      ) : shipments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-3">
            🚚
          </p>

          <h2 className="font-semibold text-gray-700 mb-1">
            No shipments found
          </h2>

          <p className="text-sm text-gray-400">
            Try changing your search or
            shipment filters.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    "Order",
                    "Customer",
                    "Destination",
                    "Courier",
                    "Package",
                    "Tracking",
                    "Status",
                    "Updated",
                    "",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {shipments.map(
                  (shipment) => {
                    const customDelivery =
                      shipment.selectionMethod ===
                      "CUSTOM_CONTACT_REQUIRED";

                    const tierName =
                      shipment.tierNameSnapshot ??
                      shipment.packageTier?.name ??
                      "Custom";

                    const zoneName =
                      shipment.zoneNameSnapshot ??
                      shipment.deliveryZone?.name ??
                      "Custom";

                    return (
                      <tr
                        key={shipment.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/orders/${shipment.order.id}`}
                            className="text-sm font-bold text-[#2D2D2D] font-mono hover:underline"
                          >
                            {
                              shipment.order
                                .orderNumber
                            }
                          </Link>

                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(
                              shipment.order
                                .createdAt,
                            )}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-700">
                            {getCustomerName(
                              shipment,
                            )}
                          </p>

                          <p className="text-xs text-gray-400">
                            {getCustomerEmail(
                              shipment,
                            )}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-700">
                            {
                              shipment.destinationTown
                            }
                          </p>

                          <p className="text-xs text-gray-400">
                            {
                              shipment.destinationProvince
                            }
                          </p>

                          <p className="text-xs text-gray-400">
                            Zone: {zoneName}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          {customDelivery ? (
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-orange-50 text-orange-700 border-orange-200">
                              Contact Required
                            </span>
                          ) : (
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                {shipment.courierNameSnapshot ??
                                  shipment.courier
                                    ?.name ??
                                  "Not assigned"}
                              </p>

                              <p className="text-xs text-gray-400">
                                {shipment.courierCodeSnapshot ??
                                  shipment.courier
                                    ?.code ??
                                  ""}
                              </p>
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-700">
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
                            <p className="text-xs text-orange-600 mt-0.5">
                              Custom tier
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {shipment.trackingNumber ? (
                            <span className="text-xs font-mono text-gray-600">
                              {
                                shipment.trackingNumber
                              }
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">
                              No tracking number
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-2">
                            <span
                              className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full border ${
                                STATUS_COLORS[
                                  shipment.status
                                ] ?? ""
                              }`}
                            >
                              {formatStatus(
                                shipment.status,
                              )}
                            </span>

                            <select
                              value=""
                              disabled={
                                updatingId ===
                                shipment.id
                              }
                              onChange={(
                                event,
                              ) => {
                                const nextStatus =
                                  event.target
                                    .value;

                                if (
                                  nextStatus
                                ) {
                                  updateShipment(
                                    shipment.id,
                                    nextStatus,
                                  );
                                }
                              }}
                              className="block w-full max-w-[170px] rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#2D2D2D]"
                            >
                              <option value="">
                                Change status...
                              </option>

                              {SHIPMENT_STATUSES.filter(
                                (status) =>
                                  status !==
                                  "ALL",
                              ).map(
                                (status) => (
                                  <option
                                    key={
                                      status
                                    }
                                    value={
                                      status
                                    }
                                  >
                                    {formatStatus(
                                      status,
                                    )}
                                  </option>
                                ),
                              )}
                            </select>

                            {updatingId ===
                              shipment.id && (
                              <p className="text-xs text-gray-400">
                                Updating...
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-xs text-gray-500 whitespace-nowrap">
                            {formatDateTime(
                              shipment.statusChangedAt,
                            )}
                          </p>

                          {shipment.events
                            .length > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                              {
                                shipment
                                  .events
                                  .length
                              }{" "}
                              event
                              {shipment.events
                                .length !== 1
                                ? "s"
                                : ""}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/orders/${shipment.order.id}`}
                            className="text-xs font-medium text-[#2D2D2D] hover:underline whitespace-nowrap"
                          >
                            View Order
                          </Link>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}