"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface Shipment {
  id: string;
  status: string;
  trackingNumber: string | null;
  courier: {
    id: string;
    name: string;
    code: string;
  } | null;
  selectionMethod: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  guestName: string | null;
  guestEmail: string | null;
  customer: {
    name: string | null;
    email: string;
  } | null;
  items: {
    id: string;
  }[];
  shipment: Shipment | null;
}

const ORDER_STATUSES = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "ARCHIVED",
];

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
  "CUSTOM_CONTACT_REQUIRED",
];

const STATUS_COLORS: Record<string, string> = {
  PENDING:
    "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED:
    "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING:
    "bg-purple-50 text-purple-700 border-purple-200",
  SHIPPED:
    "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED:
    "bg-green-50 text-green-700 border-green-200",
  CANCELLED:
    "bg-red-50 text-red-700 border-red-200",
  REFUNDED:
    "bg-gray-50 text-gray-700 border-gray-200",
};

const PAYMENT_COLORS: Record<string, string> = {
  PENDING:
    "bg-yellow-50 text-yellow-700 border-yellow-200",
  PAID:
    "bg-green-50 text-green-700 border-green-200",
  FAILED:
    "bg-red-50 text-red-700 border-red-200",
  REFUNDED:
    "bg-gray-50 text-gray-700 border-gray-200",
};

const SHIPMENT_COLORS: Record<string, string> = {
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderFilter, setOrderFilter] =
    useState("ALL");
  const [shipmentFilter, setShipmentFilter] =
    useState("ALL");

  useEffect(() => {
    fetch("/api/admin/orders")
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load orders",
          );
        }

        return data;
      })
      .then((data) => {
        setOrders(data);
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load orders",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const matchesOrderStatus =
        orderFilter === "ALL"
          ? order.status !== "ARCHIVED"
          : orderFilter === "ARCHIVED"
            ? order.status === "ARCHIVED"
            : order.status === orderFilter;

      if (!matchesOrderStatus) {
        return false;
      }

      if (shipmentFilter === "ALL") {
        return true;
      }

      if (
        shipmentFilter ===
        "CUSTOM_CONTACT_REQUIRED"
      ) {
        return (
          order.shipment?.selectionMethod ===
          "CUSTOM_CONTACT_REQUIRED"
        );
      }

      return (
        order.shipment?.status === shipmentFilter
      );
    });
  }, [
    orders,
    orderFilter,
    shipmentFilter,
  ]);

  const shipmentSummary = useMemo(() => {
    return {
      pending: orders.filter(
        (order) =>
          order.shipment?.status === "PENDING",
      ).length,

      ready: orders.filter(
        (order) =>
          order.shipment?.status ===
          "READY_FOR_COURIER",
      ).length,

      inTransit: orders.filter(
        (order) =>
          order.shipment?.status === "IN_TRANSIT",
      ).length,

      delivered: orders.filter(
        (order) =>
          order.shipment?.status === "DELIVERED",
      ).length,

      custom: orders.filter(
        (order) =>
          order.shipment?.selectionMethod ===
          "CUSTOM_CONTACT_REQUIRED",
      ).length,
    };
  }, [orders]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">
            Orders
          </h1>

          <p className="text-sm text-gray-500 mt-0.5">
            {orders.length} total orders
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Pending
            </p>
            <p className="text-xl font-bold mt-1">
              {shipmentSummary.pending}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Ready
            </p>
            <p className="text-xl font-bold mt-1">
              {shipmentSummary.ready}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              In Transit
            </p>
            <p className="text-xl font-bold mt-1">
              {shipmentSummary.inTransit}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Delivered
            </p>
            <p className="text-xl font-bold mt-1">
              {shipmentSummary.delivered}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-orange-200 p-4">
            <p className="text-xs text-orange-500 uppercase tracking-wider">
              Custom Delivery
            </p>
            <p className="text-xl font-bold mt-1 text-orange-700">
              {shipmentSummary.custom}
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Order Status
        </p>

        <div className="flex gap-2 flex-wrap">
          {ORDER_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() =>
                setOrderFilter(status)
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                orderFilter === status
                  ? "bg-[#2D2D2D] text-white border-[#2D2D2D]"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              {formatStatus(status)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Shipment Status
        </p>

        <div className="flex gap-2 flex-wrap">
          {SHIPMENT_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() =>
                setShipmentFilter(status)
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                shipmentFilter === status
                  ? "bg-[#2D2D2D] text-white border-[#2D2D2D]"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              {formatStatus(status)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">
          Loading orders...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-3">
            📦
          </p>

          <h2 className="font-semibold text-gray-700 mb-1">
            No matching orders
          </h2>

          <p className="text-sm text-gray-400">
            Try changing the order or shipment
            filters.
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
                    "Items",
                    "Total",
                    "Order Status",
                    "Shipment",
                    "Payment",
                    "Date",
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
                {filtered.map((order) => {
                  const customDelivery =
                    order.shipment
                      ?.selectionMethod ===
                    "CUSTOM_CONTACT_REQUIRED";

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-[#2D2D2D] font-mono">
                          {order.orderNumber}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-700">
                          {order.customer?.name ??
                            order.guestName ??
                            "Guest"}
                        </p>

                        <p className="text-xs text-gray-400">
                          {order.customer?.email ??
                            order.guestEmail ??
                            ""}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-600">
                          {order.items.length}{" "}
                          item
                          {order.items.length !==
                          1
                            ? "s"
                            : ""}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-bold">
                          K{" "}
                          {Number(
                            order.total,
                          ).toFixed(2)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                            STATUS_COLORS[
                              order.status
                            ] ?? ""
                          }`}
                        >
                          {formatStatus(
                            order.status,
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {customDelivery ? (
                          <div>
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-orange-50 text-orange-700 border-orange-200">
                              Contact Required
                            </span>

                            <p className="text-xs text-gray-400 mt-1">
                              Custom delivery
                            </p>
                          </div>
                        ) : order.shipment ? (
                          <div>
                            <span
                              className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                                SHIPMENT_COLORS[
                                  order.shipment
                                    .status
                                ] ?? ""
                              }`}
                            >
                              {formatStatus(
                                order.shipment
                                  .status,
                              )}
                            </span>

                            <p className="text-xs text-gray-400 mt-1">
                              {order.shipment
                                .courier
                                ?.name ??
                                "Courier not assigned"}
                            </p>

                            {order.shipment
                              .trackingNumber && (
                              <p className="text-xs text-gray-500 font-mono mt-0.5">
                                {
                                  order.shipment
                                    .trackingNumber
                                }
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            No shipment
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                            PAYMENT_COLORS[
                              order.paymentStatus
                            ] ?? ""
                          }`}
                        >
                          {formatStatus(
                            order.paymentStatus,
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs text-gray-400">
                          {new Date(
                            order.createdAt,
                          ).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-xs font-medium text-[#2D2D2D] hover:underline whitespace-nowrap"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}