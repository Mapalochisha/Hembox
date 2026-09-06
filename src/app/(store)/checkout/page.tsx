"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { useCart } from "@/components/store/CartProvider";

interface ShippingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  notes: string;
}

interface ShippingOption {
  courier: {
    id: string;
    code: string;
    name: string;
  };

  zone: {
    id: string;
    code: string;
    name: string;
  };

  tier: {
    id: string;
    code: string;
    name: string;
    minPoints: number | null;
    maxPoints: number | null;
    isCustom: boolean;
  };

  rate: {
    id: string;
    currencyCode: string;
  };

  courierCost: number;
  customerShippingPrice: number;
  pricingStrategy: string;
  pricingValue: number | null;
}

interface ShippingQuote {
  status: string;
  selectionMethod: string;
  currencyCode: string;

  shippingPoints: {
    totalPoints: number;
    lines: unknown[];
  };

  destination: {
    countryCode: string;
    provinceNormalized: string;
    townNormalized: string;
  };

  requiresCustomDelivery: boolean;
  customDeliveryReason: string | null;
  customDeliveryMessage: string | null;

  selectedOption: ShippingOption | null;
  options: ShippingOption[];
}

interface ShippingQuoteResponse {
  success: boolean;
  shipping: ShippingQuote;
  error?: string;
}

const PROVINCES = [
  "Central",
  "Copperbelt",
  "Eastern",
  "Luapula",
  "Lusaka",
  "Muchinga",
  "Northern",
  "North-Western",
  "Southern",
  "Western",
];

export default function CheckoutPage() {
  const { status } = useSession();
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();

  const [step, setStep] = useState<"shipping" | "review">("shipping");

  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [error, setError] = useState("");
  const [quoteError, setQuoteError] = useState("");

  const [shippingQuote, setShippingQuote] =
    useState<ShippingQuote | null>(null);

  const [selectedShippingRateId, setSelectedShippingRateId] =
    useState<string | null>(null);

  const [form, setForm] = useState<ShippingDetails>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    notes: "",
  });

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    fetch("/api/account/profile")
      .then(async (res) => {
        if (!res.ok) {
          return null;
        }

        return res.json();
      })
      .then((data) => {
        if (!data || data.error) {
          return;
        }

        setForm((prev) => ({
          ...prev,

          firstName:
            data.address?.firstName ||
            data.name?.split(" ")[0] ||
            "",

          lastName:
            data.address?.lastName ||
            data.name
              ?.split(" ")
              .slice(1)
              .join(" ") ||
            "",

          email: data.email || "",
          phone: data.phone || "",

          address:
            data.address?.line1 || "",

          city:
            data.address?.city || "",

          province:
            data.address?.state || "",
        }));
      })
      .catch((err) => {
        console.error(
          "Error fetching profile:",
          err,
        );
      });
  }, [status]);

  const selectedShippingOption = useMemo(() => {
    if (!shippingQuote) {
      return null;
    }

    if (shippingQuote.requiresCustomDelivery) {
      return null;
    }

    if (
      shippingQuote.selectedOption
    ) {
      return shippingQuote.selectedOption;
    }

    if (
      selectedShippingRateId
    ) {
      return (
        shippingQuote.options.find(
          (option) =>
            option.rate.id ===
            selectedShippingRateId,
        ) ?? null
      );
    }

    return null;
  }, [
    shippingQuote,
    selectedShippingRateId,
  ]);

  const shippingCost =
    shippingQuote?.requiresCustomDelivery
      ? null
      : selectedShippingOption
        ? selectedShippingOption.customerShippingPrice
        : null;

  const total =
    shippingCost === null
      ? subtotal
      : subtotal + shippingCost;

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement |
        HTMLSelectElement |
        HTMLTextAreaElement
    >,
  ) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.value,
    }));

    if (
      e.target.name === "city" ||
      e.target.name === "province"
    ) {
      setShippingQuote(null);
      setSelectedShippingRateId(null);
      setQuoteError("");
    }
  }

  function validateShippingForm(): boolean {
    const required: Array<
      keyof ShippingDetails
    > = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "city",
      "province",
    ];

    const missing =
      required.filter(
        (field) =>
          !form[field].trim(),
      );

    if (missing.length > 0) {
      setError(
        "Please fill in all required fields.",
      );

      return false;
    }

    return true;
  }

  async function requestShippingQuote() {
    setQuoteLoading(true);
    setQuoteError("");
    setShippingQuote(null);
    setSelectedShippingRateId(null);

    try {
      const res = await fetch(
        "/api/shipping/quote",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            items: items.map(
              (item) => ({
                variantId:
                  item.variantId,

                quantity:
                  item.quantity,
              }),
            ),

            shipping: {
              city: form.city,
              province: form.province,
            },
          }),
        },
      );

      const data =
        (await res.json()) as ShippingQuoteResponse;

      if (!res.ok) {
        throw new Error(
          data.error ??
            "Unable to calculate shipping.",
        );
      }

      if (!data.shipping) {
        throw new Error(
          "The shipping service returned an invalid response.",
        );
      }

      const quote =
        data.shipping;

      setShippingQuote(quote);

      if (
        quote.requiresCustomDelivery
      ) {
        setSelectedShippingRateId(
          null,
        );

        return true;
      }

      if (
        quote.options.length === 0
      ) {
        throw new Error(
          "No shipping options are available for this destination.",
        );
      }

      if (
        quote.selectionMethod ===
        "AUTO_SELECTED"
      ) {
        const option =
          quote.selectedOption ??
          quote.options[0];

        setSelectedShippingRateId(
          option.rate.id,
        );

        return true;
      }

      if (
        quote.selectionMethod ===
        "CUSTOMER_SELECTED"
      ) {
        setSelectedShippingRateId(
          null,
        );

        return true;
      }

      throw new Error(
        "The shipping service returned an invalid selection method.",
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to calculate shipping.";

      setQuoteError(message);
      return false;
    } finally {
      setQuoteLoading(false);
    }
  }

  async function handleShippingSubmit(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    setError("");

    if (!validateShippingForm()) {
      return;
    }

    const quoteLoaded =
      await requestShippingQuote();

    if (!quoteLoaded) {
      return;
    }

    setStep("review");
  }

  function handleShippingOptionChange(
    rateId: string,
  ) {
    setSelectedShippingRateId(
      rateId,
    );
    setQuoteError("");
  }

  function validateShippingSelection(): boolean {
    if (!shippingQuote) {
      setError(
        "Shipping has not been calculated yet.",
      );

      return false;
    }

    if (
      shippingQuote.requiresCustomDelivery
    ) {
      return true;
    }

    if (
      shippingQuote.options.length ===
      0
    ) {
      setError(
        "No shipping options are available for this destination.",
      );

      return false;
    }

    if (
      shippingQuote.selectionMethod ===
      "CUSTOMER_SELECTED" &&
      !selectedShippingRateId
    ) {
      setError(
        "Please select a shipping option.",
      );

      return false;
    }

    return true;
  }

  async function handlePlaceOrder() {
    setError("");

    if (!validateShippingSelection()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "/api/orders",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            items: items.map(
              (item) => ({
                variantId:
                  item.variantId,

                quantity:
                  item.quantity,
              }),
            ),

            shipping: {
              name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),

              email:
                form.email.trim(),

              phone:
                form.phone.trim(),

              address:
                form.address.trim(),

              city:
                form.city.trim(),

              province:
                form.province.trim(),

              notes:
                form.notes.trim() ||
                null,
            },

            selectedShippingRateId,
          }),
        },
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ??
            "Failed to place order.",
        );
      }

      clearCart();

      router.push(
        `/checkout/success?order=${data.orderNumber}`,
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to place order.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleEditShipping() {
    setStep("shipping");
    setError("");
    setQuoteError("");
  }

  if (items.length === 0) {
    return (
      <div className="px-6 md:px-10 py-24 text-center">
        <p className="text-6xl mb-6">
          🛒
        </p>

        <h1 className="text-3xl font-black uppercase tracking-tight mb-3">
          Your cart is empty
        </h1>

        <Link
          href="/products"
          className="bg-[#111] dark:bg-white text-white dark:text-black text-xs px-10 py-4 tracking-widest uppercase inline-block rounded"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-10 py-12 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black uppercase tracking-tight mb-2">
        Checkout
      </h1>

      {/* Steps */}
      <div className="flex items-center gap-3 mb-10">
        {[
          "shipping",
          "review",
        ].map((currentStep, index) => (
          <div
            key={currentStep}
            className="flex items-center gap-3"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                step === currentStep ||
                (
                  currentStep ===
                    "shipping" &&
                  step === "review"
                )
                  ? "bg-[#111] dark:bg-white text-white dark:text-black"
                  : "bg-gray-100 dark:bg-white/5 opacity-40"
              }`}
            >
              {index + 1}
            </div>

            <span
              className={`text-xs tracking-widest uppercase ${
                step === currentStep
                  ? "font-black"
                  : "opacity-40"
              }`}
            >
              {currentStep ===
              "shipping"
                ? "Shipping"
                : "Review & Pay"}
            </span>

            {index < 1 && (
              <span className="opacity-20 mx-1">
                —
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {/* Main checkout area */}
        <div className="md:col-span-2">
          {step === "shipping" && (
            <form
              onSubmit={
                handleShippingSubmit
              }
              className="space-y-5"
            >
              <h2 className="font-black text-sm tracking-widest uppercase mb-6">
                Shipping Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: "firstName",
                    label: "First Name",
                  },
                  {
                    name: "lastName",
                    label: "Last Name",
                  },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="text-[10px] tracking-widest uppercase opacity-50 block mb-1.5">
                      {field.label} *
                    </label>

                    <input
                      name={field.name}
                      value={
                        form[
                          field.name as keyof ShippingDetails
                        ]
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className="w-full border border-gray-200 dark:border-white/10 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#111] dark:focus:border-white bg-transparent transition-colors"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: "email",
                    label: "Email Address",
                    type: "email",
                  },
                  {
                    name: "phone",
                    label: "Phone Number",
                    type: "tel",
                  },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="text-[10px] tracking-widest uppercase opacity-50 block mb-1.5">
                      {field.label} *
                    </label>

                    <input
                      name={field.name}
                      type={field.type}
                      value={
                        form[
                          field.name as keyof ShippingDetails
                        ]
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className="w-full border border-gray-200 dark:border-white/10 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#111] dark:focus:border-white bg-transparent transition-colors"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[10px] tracking-widest uppercase opacity-50 block mb-1.5">
                  Street Address *
                </label>

                <input
                  name="address"
                  value={form.address}
                  onChange={
                    handleChange
                  }
                  required
                  className="w-full border border-gray-200 dark:border-white/10 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#111] dark:focus:border-white bg-transparent transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] tracking-widest uppercase opacity-50 block mb-1.5">
                    City / Town *
                  </label>

                  <input
                    name="city"
                    value={form.city}
                    onChange={
                      handleChange
                    }
                    required
                    className="w-full border border-gray-200 dark:border-white/10 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#111] dark:focus:border-white bg-transparent transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] tracking-widest uppercase opacity-50 block mb-1.5">
                    Province *
                  </label>

                  <select
                    name="province"
                    value={
                      form.province
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="w-full border border-gray-200 dark:border-white/10 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#111] dark:focus:border-white bg-white dark:bg-[#0f0f0f] transition-colors"
                  >
                    <option value="">
                      Select province
                    </option>

                    {PROVINCES.map(
                      (province) => (
                        <option
                          key={
                            province
                          }
                          value={
                            province
                          }
                        >
                          {province}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] tracking-widest uppercase opacity-50 block mb-1.5">
                  Order Notes (optional)
                </label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={
                    handleChange
                  }
                  rows={3}
                  className="w-full border border-gray-200 dark:border-white/10 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#111] dark:focus:border-white bg-transparent transition-colors resize-none"
                />
              </div>

              {quoteLoading && (
                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest">
                    Calculating delivery
                  </p>

                  <p className="text-xs opacity-60 mt-1">
                    Checking available couriers and delivery rates for your destination...
                  </p>
                </div>
              )}

              {quoteError && (
                <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 p-4">
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {quoteError}
                  </p>
                </div>
              )}

              {error && (
                <p className="text-red-500 text-xs">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={quoteLoading}
                className={`w-full text-xs tracking-widest uppercase font-bold py-4 rounded transition-opacity ${
                  quoteLoading
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-[#111] dark:bg-white text-white dark:text-black hover:opacity-90"
                }`}
              >
                {quoteLoading
                  ? "Calculating Shipping..."
                  : "Continue to Review"}
              </button>
            </form>
          )}

          {step === "review" && (
            <div>
              <h2 className="font-black text-sm tracking-widest uppercase mb-6">
                Review Your Order
              </h2>

              {/* Shipping address */}
              <div className="bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-xl p-5 mb-6">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[10px] tracking-widest uppercase opacity-40">
                    Shipping To
                  </p>

                  <button
                    type="button"
                    onClick={
                      handleEditShipping
                    }
                    className="text-[10px] tracking-widest uppercase opacity-40 hover:opacity-70 underline"
                  >
                    Edit
                  </button>
                </div>

                <p className="text-sm font-semibold">
                  {form.firstName}{" "}
                  {form.lastName}
                </p>

                <p className="text-xs opacity-60 mt-1">
                  {form.address},{" "}
                  {form.city},{" "}
                  {form.province}
                </p>

                <p className="text-xs opacity-60">
                  {form.email} ·{" "}
                  {form.phone}
                </p>

                {form.notes && (
                  <p className="text-xs opacity-40 mt-2 italic">
                    &ldquo;
                    {form.notes}
                    &rdquo;
                  </p>
                )}
              </div>

              {/* Shipping options */}
              {shippingQuote?.requiresCustomDelivery ? (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-5 mb-6">
                  <p className="text-xs font-black tracking-widest uppercase text-amber-900 dark:text-amber-200">
                    Delivery Requires Confirmation
                  </p>

                  <p className="text-xs leading-relaxed mt-2 text-amber-900/80 dark:text-amber-200/80">
                    {shippingQuote.customDeliveryMessage ??
                      "We need to confirm delivery arrangements for this destination. Our team will contact you after your order is placed."}
                  </p>

                  {shippingQuote.customDeliveryReason && (
                    <p className="text-[10px] opacity-60 mt-2">
                      {shippingQuote.customDeliveryReason}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-xs tracking-widest uppercase">
                      Delivery Option
                    </h3>

                    {shippingQuote && (
                      <span className="text-[10px] opacity-40">
                        {shippingQuote.shippingPoints.totalPoints} shipping point
                        {shippingQuote.shippingPoints.totalPoints ===
                        1
                          ? ""
                          : "s"}
                      </span>
                    )}
                  </div>

                  {shippingQuote?.selectionMethod ===
                    "CUSTOMER_SELECTED" &&
                    shippingQuote.options.length > 1 && (
                      <p className="text-xs opacity-50 mb-4">
                        Select your preferred courier.
                      </p>
                    )}

                  <div className="space-y-3">
                    {shippingQuote?.options.map(
                      (option) => {
                        const isSelected =
                          selectedShippingRateId ===
                          option.rate.id;

                        return (
                          <button
                            key={
                              option.rate.id
                            }
                            type="button"
                            onClick={() =>
                              handleShippingOptionChange(
                                option.rate.id,
                              )
                            }
                            className={`w-full text-left rounded-xl border p-4 transition-colors ${
                              isSelected
                                ? "border-[#111] dark:border-white bg-gray-50 dark:bg-white/5"
                                : "border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center ${
                                  isSelected
                                    ? "border-[#111] dark:border-white"
                                    : "border-gray-300 dark:border-white/30"
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-2 h-2 rounded-full bg-[#111] dark:bg-white" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between gap-4">
                                  <div>
                                    <p className="text-xs font-black uppercase tracking-wide">
                                      {
                                        option
                                          .courier
                                          .name
                                      }
                                    </p>

                                    <p className="text-[10px] opacity-50 mt-1">
                                      {
                                        option
                                          .tier
                                          .name
                                      }
                                    </p>
                                  </div>

                                  <p className="text-sm font-black whitespace-nowrap">
                                    {option.customerShippingPrice ===
                                    0
                                      ? "Free"
                                      : `${option.rate.currencyCode} ${option.customerShippingPrice.toFixed(2)}`}
                                  </p>
                                </div>

                                <p className="text-[10px] opacity-40 mt-2">
                                  {
                                    option
                                      .zone
                                      .name
                                  }
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="space-y-3 mb-6">
                {items.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 items-center py-3 border-b border-gray-50 dark:border-white/5"
                    >
                      <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.image ? (
                          <img
                            src={
                              item.image
                            }
                            alt={
                              item.name
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg opacity-20">
                            👔
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="text-xs font-black tracking-wide uppercase">
                          {item.name}
                        </p>

                        <p className="text-[10px] opacity-40">
                          Qty:{" "}
                          {
                            item.quantity
                          }
                        </p>
                      </div>

                      <p className="text-xs font-bold">
                        K{" "}
                        {(
                          item.price *
                          item.quantity
                        ).toFixed(2)}
                      </p>
                    </div>
                  ),
                )}
              </div>

              {/* Payment */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4 mb-6 text-amber-900 dark:text-amber-200">
                <p className="text-xs font-bold mb-1">
                  💳 Payment
                </p>

                <p className="text-xs opacity-80 leading-relaxed">
                  After placing your order, our team will contact you via WhatsApp or phone to arrange payment.
                </p>
              </div>

              {error && (
                <p className="text-red-500 text-xs mb-4">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={
                  handlePlaceOrder
                }
                disabled={loading}
                className={`w-full text-xs tracking-widest uppercase font-bold py-4 rounded transition-opacity ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed text-white dark:text-black"
                    : "bg-[#111] dark:bg-white text-white dark:text-black hover:opacity-90"
                }`}
              >
                {loading
                  ? "Placing Order..."
                  : "Place Order"}
              </button>

              <button
                type="button"
                onClick={
                  handleEditShipping
                }
                className="w-full text-xs tracking-widest uppercase font-bold py-3 text-center border border-gray-200 dark:border-white/10 rounded hover:bg-gray-50 dark:hover:bg-white/5 transition-colors mt-3"
              >
                Back to Shipping
              </button>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="md:col-span-1">
          <div className="bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-xl p-6 md:sticky md:top-20">
            <h2 className="font-black text-sm tracking-widest uppercase mb-5">
              Summary
            </h2>

            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-xs">
                <span className="opacity-50">
                  Subtotal
                </span>

                <span className="font-semibold">
                  K{" "}
                  {subtotal.toFixed(
                    2,
                  )}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="opacity-50">
                  Shipping
                </span>

                <span className="font-semibold">
                  {!shippingQuote ? (
                    <span className="opacity-40">
                      Calculated at checkout
                    </span>
                  ) : shippingQuote.requiresCustomDelivery ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      To be confirmed
                    </span>
                  ) : shippingCost ===
                    null ? (
                    <span className="opacity-40">
                      Select option
                    </span>
                  ) : shippingCost ===
                    0 ? (
                    <span className="text-green-600 dark:text-green-400 font-bold">
                      Free
                    </span>
                  ) : (
                    `K ${shippingCost.toFixed(2)}`
                  )}
                </span>
              </div>

              <div className="border-t border-gray-200 dark:border-white/10 pt-3 flex justify-between">
                <span className="text-xs font-black tracking-widest uppercase">
                  Total
                </span>

                <span className="font-black text-base">
                  {shippingQuote?.requiresCustomDelivery
                    ? "To be confirmed"
                    : `K ${total.toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] opacity-35">
                📦 Delivery calculated from your destination
              </p>

              <p className="text-[10px] opacity-35">
                ↩ 30-day returns
              </p>

              <p className="text-[10px] opacity-35">
                ✓ Secure checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}