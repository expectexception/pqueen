"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useAuth, CustomerAddress } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import {
  ShieldCheckIcon,
  TruckIcon,
  CheckIcon,
  ArrowRightIcon,
  LockIcon,
  PlusIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  ZapIcon,
  CreditCardIcon,
  MailIcon,
  KeyIcon,
  SparklesIcon,
  TagIcon,
} from "@/app/components/Icons";
import { trackMetaEvent } from "@/lib/meta-pixel";
import OtpInput from "@/app/components/OtpInput";
import { loadRazorpayScript } from "@/app/components/RazorpayCheckoutButton";

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user, loading: authLoading, login, register, loginWithOtp, sendOtp, resendOtp, refreshUser, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Coupon / Promo Code State
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number; description?: string } | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");

  // Auth Gate Tabs & Form States (For unauthenticated customers)
  const [authTab, setAuthTab] = useState<"otp-login" | "register" | "password-login">("otp-login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [maskedAuthDestination, setMaskedAuthDestination] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Delivery Form States (For authenticated customers)
  const [form, setForm] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [pincodeStatus, setPincodeStatus] = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Billing Address Logic
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [billingForm, setBillingForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
  });

  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isSubmittingRef = React.useRef(false);
  const [simulatorOrder, setSimulatorOrder] = useState<{ orderId: string; amount: number } | null>(null);
  const [simulatorMethod, setSimulatorMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [simulatorUpiApp, setSimulatorUpiApp] = useState<"gpay" | "phonepe" | "paytm">("gpay");

  const savedAddresses = user?.addresses || [];

  // Countdown timer for OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Indian PIN Code Auto-Detection for Delivery Address
  async function handlePincodeLookup(pin: string) {
    const cleanPin = pin.trim();
    if (/^[1-9][0-9]{5}$/.test(cleanPin)) {
      try {
        setPincodeLoading(true);
        const res = await fetch(`/api/pincode/${cleanPin}`);
        if (res.ok) {
          const data = await res.json();
          if (data.city && data.state) {
            setForm((prev) => ({
              ...prev,
              city: data.city,
              state: data.state,
            }));
            setPincodeStatus(`✓ Verified: ${data.city}, ${data.state} (State Code: ${data.stateCode})`);
          }
        }
      } catch (err) {
        console.warn("Pincode lookup error:", err);
      } finally {
        setPincodeLoading(false);
      }
    } else {
      setPincodeStatus("");
    }
  }

  // Auto-fill from user profile or default saved address when user is authenticated
  useEffect(() => {
    if (user) {
      const nameParts = (user.name || "").trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      if (user.addresses && user.addresses.length > 0) {
        const defaultAddr = user.addresses.find((a) => a.isDefault) || user.addresses[0];
        setSelectedAddressId(defaultAddr.id);
        const addrNameParts = (defaultAddr.name || user.name || "").trim().split(" ");

        setForm({
          email: user.email || "",
          phone: defaultAddr.phone || user.phone || "",
          firstName: addrNameParts[0] || firstName,
          lastName: addrNameParts.slice(1).join(" ") || lastName,
          address: defaultAddr.street || "",
          city: defaultAddr.city || "",
          state: defaultAddr.state || "",
          pincode: defaultAddr.pincode || "",
        });
        handlePincodeLookup(defaultAddr.pincode || "");
      } else {
        setForm((prev) => ({
          ...prev,
          email: user.email || prev.email || "",
          phone: user.phone || prev.phone || "",
          firstName: prev.firstName || firstName,
          lastName: prev.lastName || lastName,
        }));
      }
    }
  }, [user]);

  // Track InitiateCheckout on checkout visit
  useEffect(() => {
    if (cart.length > 0) {
      const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
      trackMetaEvent("InitiateCheckout", {
        value: subtotal,
        currency: "INR",
        num_items: cart.length,
        content_ids: cart.map((i) => i.id),
      });
    }
  }, []);

  // AUTH ACTIONS (Supports Mobile Phone Numbers and Email Addresses)
  async function handleSendAuthOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setAuthError("");
    const raw = authEmail.trim();
    if (!raw) {
      setAuthError("Please enter your 10-digit mobile number or email address.");
      return;
    }

    if (!raw.includes("@")) {
      const digits = raw.replace(/\D/g, "");
      if (digits.length < 10) {
        setAuthError("Please enter a valid 10-digit mobile number.");
        return;
      }
    }

    try {
      setAuthSubmitting(true);
      const purpose = authTab === "register" ? "REGISTER" : "LOGIN";
      const res = await sendOtp(raw, purpose, authName.trim() || undefined);
      if (!res.success) {
        setAuthError(res.error || "Failed to send verification code.");
        return;
      }
      setOtpSent(true);
      setMaskedAuthDestination(res.maskedDestination || raw);
      setCountdown(res.cooldownSeconds || 45);
      showToast(res.message || `Verification code dispatched for ${raw}`, { type: "success" });
    } catch {
      setAuthError("Unable to send verification OTP. Please try again.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleResendAuthOtp() {
    setAuthError("");
    const raw = authEmail.trim();
    try {
      setAuthSubmitting(true);
      const purpose = authTab === "register" ? "REGISTER" : "LOGIN";
      const res = await resendOtp(raw, purpose, authName.trim() || undefined);
      if (!res.success) {
        setAuthError(res.error || "Failed to resend code.");
        return;
      }
      setMaskedAuthDestination(res.maskedDestination || raw);
      setCountdown(res.cooldownSeconds || 45);
      showToast("Fresh 6-digit verification code dispatched!", { type: "success" });
    } catch {
      setAuthError("Unable to resend OTP. Please try again.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleVerifyAndAuthenticate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setAuthError("");
    const raw = authEmail.trim();
    const otp = authOtp.trim();

    if (!otp || otp.length < 6) {
      setAuthError("Please enter the complete 6-digit code.");
      return;
    }

    try {
      setAuthSubmitting(true);
      if (authTab === "register") {
        if (!authName.trim()) {
          setAuthError("Please provide your full name.");
          return;
        }
        if (authPassword.length < 6) {
          setAuthError("Password must be at least 6 characters.");
          return;
        }
        const isEmail = raw.includes("@");
        const email = isEmail ? raw.toLowerCase() : `user_${raw.replace(/\D/g, "").slice(-10)}@pqnpartyqueen.com`;
        const phone = isEmail ? (authPhone.trim() || undefined) : raw.replace(/\D/g, "").slice(-10);

        const res = await register({
          name: authName.trim(),
          email,
          password: authPassword,
          phone,
          otp,
        });
        if (!res.success) {
          setAuthError(res.error || "Registration failed.");
          return;
        }
        showToast("Account created & verified! You can now complete your order.", { type: "success" });
      } else {
        const res = await loginWithOtp(raw, otp);
        if (!res.success) {
          setAuthError(res.error || "Invalid OTP code.");
          return;
        }
        showToast("Signed in successfully! Please review delivery details.", { type: "success" });
      }
    } catch {
      setAuthError("Authentication failed. Please try again.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    const raw = authEmail.trim();
    if (!raw || !authPassword) {
      setAuthError("Mobile/Email and password are required.");
      return;
    }

    try {
      setAuthSubmitting(true);
      const res = await login(raw, authPassword);
      if (!res.success) {
        setAuthError(res.error || "Invalid credentials.");
        return;
      }
      showToast("Signed in successfully!", { type: "success" });
    } catch {
      setAuthError("Login failed. Please check your credentials.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  // SAVED ADDRESS PICKER
  function handleSelectSavedAddress(addr: CustomerAddress) {
    setSelectedAddressId(addr.id);
    const addrNameParts = (addr.name || user?.name || "").trim().split(" ");
    setForm({
      email: user?.email || form.email,
      phone: addr.phone || user?.phone || form.phone,
      firstName: addrNameParts[0] || form.firstName,
      lastName: addrNameParts.slice(1).join(" ") || form.lastName,
      address: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
    handlePincodeLookup(addr.pincode);
    showToast(`Autofilled delivery destination: ${addr.tag || "Saved Address"}`, { type: "success" });
  }

  function handleSwitchToNewAddress() {
    setSelectedAddressId("new");
    const nameParts = (user?.name || "").trim().split(" ");
    setForm((prev) => ({
      ...prev,
      email: user?.email || prev.email,
      phone: user?.phone || prev.phone,
      firstName: nameParts[0] || prev.firstName,
      lastName: nameParts.slice(1).join(" ") || prev.lastName,
      address: "",
      city: "",
      state: "",
      pincode: "",
    }));
    setPincodeStatus("");
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
    if (id === "pincode") {
      handlePincodeLookup(value);
    }
  };

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setBillingForm((prev) => ({ ...prev, [id]: value }));
  };

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Restore coupon from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pqn-applied-promo");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.code) {
          setAppliedPromo(parsed);
        }
      }
    } catch {}
  }, []);

  // Revalidate coupon whenever cart subtotal changes to maintain correct discount
  useEffect(() => {
    if (!appliedPromo || subtotal === 0) return;
    fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: appliedPromo.code, cartSubtotal: subtotal }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.coupon) {
          const updated = {
            code: data.coupon.code,
            discountAmount: data.coupon.discountAmount,
            description: data.coupon.description,
          };
          setAppliedPromo(updated);
          localStorage.setItem("pqn-applied-promo", JSON.stringify(updated));
        }
      })
      .catch(() => {});
  }, [subtotal]);

  // Handle Coupon Apply
  async function handleApplyPromo(e?: React.FormEvent, customCode?: string) {
    if (e) e.preventDefault();
    setPromoError("");
    const code = (customCode || promoInput).trim().toUpperCase();
    if (!code) {
      setPromoError("Please enter a voucher code.");
      return;
    }

    try {
      setValidatingPromo(true);
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, cartSubtotal: subtotal }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error || "Invalid voucher code.");
        showToast(data.error || "Invalid voucher code.", { type: "error" });
        return;
      }

      const newPromo = {
        code: data.coupon.code,
        discountAmount: data.coupon.discountAmount,
        description: data.coupon.description,
      };
      setAppliedPromo(newPromo);
      localStorage.setItem("pqn-applied-promo", JSON.stringify(newPromo));
      showToast(`Voucher ${data.coupon.code} applied! Saved ₹${data.coupon.discountAmount.toLocaleString("en-IN")}`, { type: "success" });
      setPromoInput("");
      setPromoError("");
    } catch {
      setPromoError("Could not validate voucher code.");
      showToast("Could not validate voucher code.", { type: "error" });
    } finally {
      setValidatingPromo(false);
    }
  }

  // Handle Coupon Removal
  function handleRemovePromo() {
    setAppliedPromo(null);
    localStorage.removeItem("pqn-applied-promo");
    showToast("Voucher removed", { type: "info" });
  }

  // Dynamic Discount & Grand Total Calculations
  const discountAmount = appliedPromo ? Math.min(subtotal, appliedPromo.discountAmount) : 0;
  const shipping = 0; // Free express delivery
  const grandTotal = Math.max(0, subtotal - discountAmount + shipping);

  // Online Payment Order Finalization Handler
  async function finalizeOnlineOrder(paymentRes: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) {
    if (isSubmittingRef.current) {
      console.warn("Order finalization already in-progress. Preventing duplicate submission.");
      return;
    }
    try {
      isSubmittingRef.current = true;
      setLoading(true);
      setSimulatorOrder(null);

      // 4. Verify payment signature on backend
      const verifyRes = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: paymentRes.razorpay_order_id,
          razorpay_payment_id: paymentRes.razorpay_payment_id,
          razorpay_signature: paymentRes.razorpay_signature,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || "Payment signature verification failed.");
      }

      // 5. Create order record in database with coupon deduction
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          email: (user?.email || form.email).trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          paymentMethod: "ONLINE",
          couponCode: appliedPromo?.code || null,
          discountAmount: discountAmount,
          razorpayPaymentId: paymentRes.razorpay_payment_id,
          razorpayOrderId: paymentRes.razorpay_order_id,
          items: cart.map((item) => ({
            productId: item.id,
            productName: item.name,
            size: item.size || null,
            color: item.color || null,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to persist order record.");
      }

      // Save address if selected
      if (user && saveAddressToAccount && selectedAddressId === "new") {
        try {
          await fetch("/api/customer/addresses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tag: "Home",
              name: `${form.firstName.trim()} ${form.lastName.trim()}`,
              phone: form.phone.trim(),
              street: form.address.trim(),
              city: form.city.trim(),
              state: form.state.trim(),
              pincode: form.pincode.trim(),
              country: "India",
              isDefault: savedAddresses.length === 0,
            }),
          });
          refreshUser?.();
        } catch {
          // ignore
        }
      }

      // Track Meta Pixel Purchase event
      trackMetaEvent("Purchase", {
        value: Number(data.order.totalAmount) || 0,
        currency: "INR",
        content_type: "product",
        order_id: data.order.orderNumber,
        num_items: cart.length,
      });

      localStorage.removeItem("pqn-applied-promo");
      clearCart();
      showToast("Payment verified & Order confirmed!", { type: "success" });

      router.push(
        `/order-success?order=${encodeURIComponent(
          data.order.orderNumber
        )}&total=${encodeURIComponent(data.order.totalAmount)}&payment=ONLINE`
      );
    } catch (confirmErr: any) {
      console.error("Order confirmation error:", confirmErr);
      isSubmittingRef.current = false;
      setError(confirmErr.message || "Failed to finalize paid order.");
      showToast(confirmErr.message || "Payment confirmation error.", { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  // ORDER SUBMIT (Supports Razorpay Online Payments and Cash on Delivery)
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSubmittingRef.current) {
      console.warn("Order submission already in progress.");
      return;
    }

    if (!user) {
      setError("Please sign in or register to place your order.");
      showToast("Authentication required to complete order.", { type: "error" });
      return;
    }

    if (
      !form.firstName.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.pincode.trim()
    ) {
      setError("Please fill in all mandatory shipping and delivery details.");
      showToast("Please fill in all required shipping fields.", { type: "error" });
      return;
    }

    if (form.phone.trim().length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    // -------------------------------------------------------------
    // OPTION A: PREPAID ONLINE CHECKOUT VIA RAZORPAY
    // -------------------------------------------------------------
    if (paymentMethod === "online") {
      try {
        setLoading(true);

        // 1. Create Razorpay order on server with exact discounted grandTotal
        const amountInPaise = Math.round(grandTotal * 100);
        const orderRes = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: "INR",
            receipt: `order_rcpt_${Date.now()}`,
            notes: {
              customerName: `${form.firstName.trim()} ${form.lastName.trim()}`,
              customerEmail: (user?.email || form.email).trim(),
              customerPhone: form.phone.trim(),
              couponCode: appliedPromo?.code || "",
              discountAmount: discountAmount.toString(),
            },
          }),
        });

        const orderData = await orderRes.json();
        if (!orderRes.ok || !orderData.order_id) {
          throw new Error(orderData.error || "Failed to initialize payment gateway.");
        }

        // If mock / test sandbox simulation mode is active (due to rotated/expired key or sandbox mode)
        if (orderData.is_mock || orderData.key_id === "rzp_test_mock") {
          setLoading(false);
          setSimulatorOrder({
            orderId: orderData.order_id,
            amount: grandTotal,
          });
          return;
        }

        // 2. Load Razorpay script
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          setLoading(false);
          setSimulatorOrder({
            orderId: orderData.order_id,
            amount: grandTotal,
          });
          return;
        }

        const keyId = orderData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_Tb79L3WjS62yNA";
        const cleanPhone = form.phone.trim().replace(/\D/g, "").slice(-10);
        const customerName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
        const customerEmail = (user?.email || form.email).trim();

        // 3. Open Razorpay standard modal with sanitized parameters
        const options: any = {
          key: keyId,
          amount: Number(orderData.amount),
          currency: orderData.currency || "INR",
          name: "PQN PARTY QUEEN",
          description: appliedPromo ? `Atelier Order (${appliedPromo.code} Applied)` : "Haute Couture & Luxury Atelier Order",
          order_id: orderData.order_id,
          handler: finalizeOnlineOrder,
          prefill: {
            name: customerName || undefined,
            email: customerEmail || undefined,
            contact: cleanPhone.length === 10 ? cleanPhone : undefined,
          },
          notes: {
            platform: "PQN Party Queen Web Checkout",
          },
          theme: {
            color: "#072818",
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              showToast("Payment window closed.", { type: "info" });
            },
          },
        };

        try {
          const razorpayInstance = new (window as any).Razorpay(options);
          razorpayInstance.on("payment.failed", function (resp: any) {
            setLoading(false);
            const desc = resp?.error?.description || "Payment was not completed or was cancelled.";
            setError(desc);
            showToast(desc, { type: "error" });
          });

          razorpayInstance.open();
        } catch (rzpOpenErr) {
          // If Razorpay instance fails to render in browser, fall back to Simulator
          setLoading(false);
          setSimulatorOrder({
            orderId: orderData.order_id,
            amount: grandTotal,
          });
        }
        return;
      } catch (err: any) {
        console.error("RAZORPAY CHECKOUT ERROR:", err);
        setError(err.message || "Failed to initialize payment gateway.");
        showToast(err.message || "Checkout error.", { type: "error" });
        setLoading(false);
        return;
      }
    }

    // -------------------------------------------------------------
    // OPTION B: CASH ON DELIVERY (COD)
    // -------------------------------------------------------------
    try {
      setLoading(true);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          email: (user?.email || form.email).trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          paymentMethod: "COD",
          couponCode: appliedPromo?.code || null,
          discountAmount: discountAmount,
          items: cart.map((item) => ({
            productId: item.id,
            productName: item.name,
            size: item.size || null,
            color: item.color || null,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to place order.");
      }

      // Save address to user account if selected "new"
      if (user && saveAddressToAccount && selectedAddressId === "new") {
        try {
          await fetch("/api/customer/addresses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tag: "Home",
              name: `${form.firstName.trim()} ${form.lastName.trim()}`,
              phone: form.phone.trim(),
              street: form.address.trim(),
              city: form.city.trim(),
              state: form.state.trim(),
              pincode: form.pincode.trim(),
              country: "India",
              isDefault: savedAddresses.length === 0,
            }),
          });
          refreshUser?.();
        } catch {
          // ignore address save failure
        }
      }

      // Track Meta Pixel Purchase event
      trackMetaEvent("Purchase", {
        value: Number(data.order.totalAmount) || 0,
        currency: "INR",
        content_type: "product",
        order_id: data.order.orderNumber,
        num_items: cart.length,
      });

      localStorage.removeItem("pqn-applied-promo");
      clearCart();
      showToast("Order placed successfully!", { type: "success" });

      router.push(
        `/order-success?order=${encodeURIComponent(
          data.order.orderNumber
        )}&total=${encodeURIComponent(data.order.totalAmount)}&payment=COD`
      );
    } catch (err) {
      console.error("CHECKOUT SUBMIT ERROR:", err);
      isSubmittingRef.current = false;
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while placing your order. Please try again."
      );
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  if (cart.length === 0) {
    return (
      <main className="checkout-container">
        <div className="empty-state-card">
          <h1>Your Cart Is Empty</h1>
          <p style={{ margin: "14px 0 28px" }}>
            Add your desired ensembles to your bag before proceeding to checkout.
          </p>
          <Link href="/shop" className="btn-primary">
            RETURN TO SHOP
          </Link>
        </div>
      </main>
    );
  }

  // =========================================================================
  // VIEW A: MANDATORY SIGN IN / SIGN UP GATE (WHEN CUSTOMER IS NOT LOGGED IN)
  // =========================================================================
  if (!user && !authLoading) {
    return (
      <main className="checkout-container">
        {/* 3-STEP PROGRESS INDICATOR */}
        <div className="checkout-steps-indicator">
          <div className="checkout-step-pill active">
            <span className="checkout-step-num">1</span>
            <span>Account Verification</span>
          </div>
          <span style={{ color: "var(--border-medium)" }}>———</span>
          <div className="checkout-step-pill">
            <span className="checkout-step-num">2</span>
            <span>Shipping & Delivery</span>
          </div>
          <span style={{ color: "var(--border-medium)" }}>———</span>
          <div className="checkout-step-pill">
            <span className="checkout-step-num">3</span>
            <span>Payment</span>
          </div>
        </div>

        <div className="checkout-grid">
          {/* LEFT: INLINE AUTHENTICATION CARD */}
          <div>
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                border: "1px solid rgba(7, 40, 24, 0.12)",
                boxShadow: "0 8px 30px rgba(7, 40, 24, 0.08)",
                overflow: "hidden",
              }}
            >
              {/* Luxury Atelier Header */}
              <div
                style={{
                  background: "linear-gradient(135deg, #072818 0%, #0d4428 100%)",
                  padding: "24px 28px",
                  color: "#f6f8f6",
                  borderBottom: "2px solid #f5d77f",
                }}
              >
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "20px", background: "rgba(245, 215, 127, 0.15)", color: "#f5d77f", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
                  <ShieldCheckIcon size={14} /> Verification Required
                </div>
                <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", margin: "4px 0", color: "#f5d77f", fontWeight: "normal" }}>
                  Sign In or Create Account to Checkout
                </h1>
                <p style={{ fontSize: "12px", color: "rgba(246, 248, 246, 0.8)", margin: 0, lineHeight: "1.4" }}>
                  To complete your order, ensure courier delivery tracking, and apply member vouchers, please sign in or register with email OTP below.
                </p>
              </div>

              <div style={{ padding: "28px" }}>
                {/* Method Tabs */}
                <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: "24px", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("otp-login");
                      setAuthError("");
                      setOtpSent(false);
                    }}
                    style={{
                      padding: "10px 16px",
                      background: "none",
                      border: "none",
                      borderBottom: authTab === "otp-login" ? "2px solid #072818" : "2px solid transparent",
                      color: authTab === "otp-login" ? "#072818" : "#6b7280",
                      fontSize: "12px",
                      fontWeight: authTab === "otp-login" ? "700" : "500",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <KeyIcon size={14} /> Instant OTP Sign In
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("register");
                      setAuthError("");
                      setOtpSent(false);
                    }}
                    style={{
                      padding: "10px 16px",
                      background: "none",
                      border: "none",
                      borderBottom: authTab === "register" ? "2px solid #072818" : "2px solid transparent",
                      color: authTab === "register" ? "#072818" : "#6b7280",
                      fontSize: "12px",
                      fontWeight: authTab === "register" ? "700" : "500",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <PlusIcon size={14} /> New Customer (OTP Sign Up)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("password-login");
                      setAuthError("");
                      setOtpSent(false);
                    }}
                    style={{
                      padding: "10px 16px",
                      background: "none",
                      border: "none",
                      borderBottom: authTab === "password-login" ? "2px solid #072818" : "2px solid transparent",
                      color: authTab === "password-login" ? "#072818" : "#6b7280",
                      fontSize: "12px",
                      fontWeight: authTab === "password-login" ? "700" : "500",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <LockIcon size={14} /> Password Login
                  </button>
                </div>

                {authError && (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: "6px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                      fontSize: "12px",
                      marginBottom: "20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <ShieldCheckIcon size={16} />
                    <span>{authError}</span>
                  </div>
                )}

                {/* TAB 1: ONE-TIME OTP LOGIN */}
                {authTab === "otp-login" && (
                  <div>
                    {!otpSent ? (
                      <form onSubmit={handleSendAuthOtp}>
                        <div className="form-group" style={{ marginBottom: "20px" }}>
                          <label htmlFor="authEmail">Enter Mobile Number (or Email) *</label>
                          <input
                            id="authEmail"
                            type="text"
                            required
                            placeholder="e.g. 98765 43210 or yourname@gmail.com"
                            className="form-input"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            style={{ padding: "12px 14px", fontSize: "14px" }}
                          />
                          <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                            Enter your 10-digit mobile number or registered email for instant 1-click verification.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={authSubmitting}
                          className="btn-primary"
                          style={{ width: "100%", padding: "14px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
                        >
                          {authSubmitting ? "SENDING CODE..." : "GET ONE-TIME OTP & PROCEED"}
                          <ArrowRightIcon size={15} />
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyAndAuthenticate}>
                        <OtpInput
                          value={authOtp}
                          onChange={setAuthOtp}
                          onComplete={() => handleVerifyAndAuthenticate()}
                          maskedDestination={maskedAuthDestination}
                          cooldownSeconds={countdown}
                          onResend={handleResendAuthOtp}
                          resending={authSubmitting}
                          onChangeDestination={() => {
                            setOtpSent(false);
                            setAuthOtp("");
                            setAuthError("");
                          }}
                          destinationLabel="Enter 6-Digit Passcode"
                          submitLabel="VERIFY & UNLOCK CHECKOUT"
                          onSubmit={handleVerifyAndAuthenticate}
                          submitting={authSubmitting}
                        />
                      </form>
                    )}
                  </div>
                )}

                {/* TAB 2: NEW CUSTOMER SIGN UP (WITH OTP) */}
                {authTab === "register" && (
                  <div>
                    {!otpSent ? (
                      <form onSubmit={handleSendAuthOtp} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div className="form-group">
                          <label htmlFor="authName">Full Name *</label>
                          <input
                            id="authName"
                            type="text"
                            required
                            placeholder="e.g. Radhika Sharma"
                            className="form-input"
                            value={authName}
                            onChange={(e) => setAuthName(e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="authEmail">Email Address (For Invoicing & OTP) *</label>
                          <input
                            id="authEmail"
                            type="email"
                            required
                            placeholder="you@domain.com"
                            className="form-input"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="authPhone">Mobile Number (For Courier Tracking)</label>
                          <input
                            id="authPhone"
                            type="tel"
                            placeholder="+91 98765 43210"
                            className="form-input"
                            value={authPhone}
                            onChange={(e) => setAuthPhone(e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="authPassword">Create Password *</label>
                          <input
                            id="authPassword"
                            type="password"
                            required
                            placeholder="At least 6 characters"
                            className="form-input"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={authSubmitting}
                          className="btn-primary"
                          style={{ width: "100%", padding: "14px", marginTop: "10px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
                        >
                          {authSubmitting ? "SENDING VERIFICATION..." : "CONTINUE & VERIFY EMAIL"}
                          <ArrowRightIcon size={15} />
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyAndAuthenticate}>
                        <OtpInput
                          value={authOtp}
                          onChange={setAuthOtp}
                          onComplete={() => handleVerifyAndAuthenticate()}
                          maskedDestination={maskedAuthDestination}
                          cooldownSeconds={countdown}
                          onResend={handleResendAuthOtp}
                          resending={authSubmitting}
                          onChangeDestination={() => {
                            setOtpSent(false);
                            setAuthOtp("");
                            setAuthError("");
                          }}
                          destinationLabel="Enter 6-Digit Email Code"
                          submitLabel="VERIFY & CONTINUE TO SHIPPING"
                          onSubmit={handleVerifyAndAuthenticate}
                          submitting={authSubmitting}
                        />
                      </form>
                    )}
                  </div>
                )}

                {/* TAB 3: PASSWORD LOGIN */}
                {authTab === "password-login" && (
                  <form onSubmit={handlePasswordSignIn} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className="form-group">
                      <label htmlFor="authEmail">Email Address *</label>
                      <input
                        id="authEmail"
                        type="email"
                        required
                        placeholder="you@domain.com"
                        className="form-input"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <label htmlFor="authPassword" style={{ margin: 0 }}>Password *</label>
                        <Link
                          href="/account/login?forgot=1"
                          style={{ fontSize: "11px", color: "#0d4428", textDecoration: "underline" }}
                        >
                          Forgot Password?
                        </Link>
                      </div>
                      <input
                        id="authPassword"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="form-input"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authSubmitting}
                      className="btn-primary"
                      style={{ width: "100%", padding: "14px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
                    >
                      {authSubmitting ? "SIGNING IN..." : "SIGN IN & PROCEED TO CHECKOUT"}
                      <ArrowRightIcon size={15} />
                    </button>
                  </form>
                )}

                {/* Social Sign In */}
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #e5e7eb", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#6b7280", background: "#ffffff", padding: "0 10px" }}>
                    Or Continue With
                  </span>

                  <a
                    href="/api/auth/google"
                    style={{
                      marginTop: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      padding: "12px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      background: "#ffffff",
                      color: "#374151",
                      fontSize: "13px",
                      fontWeight: "600",
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <svg style={{ width: "18px", height: "18px" }} viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Google Instant Account Access</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <aside
            style={{
              background: "#ffffff",
              padding: "24px",
              borderRadius: "12px",
              border: "1px solid rgba(7, 40, 24, 0.1)",
              boxShadow: "0 4px 20px rgba(7, 40, 24, 0.05)",
              position: "sticky",
              top: "100px",
            }}
          >
            <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#072818", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e5e7eb" }}>
              Order Summary ({cart.length} {cart.length === 1 ? "Item" : "Items"})
            </h2>

            <div style={{ maxHeight: "320px", overflowY: "auto", marginBottom: "16px", paddingRight: "4px" }}>
              {cart.map((item) => (
                <div
                  key={`${item.id}-${item.size || ""}-${item.color || ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 0",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "76px",
                      minWidth: "60px",
                      borderRadius: "6px",
                      overflow: "hidden",
                      background: "#f3f4f6",
                      flexShrink: 0,
                    }}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "#e5e7eb" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#111827",
                        margin: "0 0 4px 0",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.name}
                    </h3>
                    <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>
                      Qty: {item.quantity}
                      {item.size && ` | Size: ${item.size}`}
                      {item.color && ` | Color: ${item.color}`}
                    </p>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#072818", whiteSpace: "nowrap" }}>
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>

            {/* PROMO / COUPON CODE SECTION */}
            <div
              style={{
                marginBottom: "16px",
                padding: "14px",
                background: "#fbfcfb",
                borderRadius: "8px",
                border: "1px dashed rgba(7, 40, 24, 0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: "#072818", display: "flex", alignItems: "center", gap: "5px" }}>
                  <TagIcon size={13} /> Apply Promo Code
                </span>
                {!appliedPromo && (
                  <button
                    type="button"
                    onClick={() => handleApplyPromo(undefined, "PQN10")}
                    style={{
                      background: "rgba(197, 155, 39, 0.12)",
                      border: "1px solid #c59b27",
                      color: "#072818",
                      fontSize: "10px",
                      fontWeight: "800",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <SparklesIcon size={10} style={{ color: "#c59b27" }} /> PQN10 (10% OFF)
                  </button>
                )}
              </div>

              {!appliedPromo ? (
                <div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      placeholder="ENTER COUPON CODE"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value.toUpperCase());
                        setPromoError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyPromo();
                        }
                      }}
                      style={{
                        flex: 1,
                        height: "38px",
                        padding: "0 10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyPromo()}
                      disabled={validatingPromo || !promoInput.trim()}
                      style={{
                        padding: "0 16px",
                        height: "38px",
                        background: promoInput.trim() ? "#072818" : "#9ca3af",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "700",
                        letterSpacing: "0.5px",
                        cursor: promoInput.trim() ? "pointer" : "not-allowed",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {validatingPromo ? "APPLYING..." : "APPLY"}
                    </button>
                  </div>
                  {promoError && (
                    <p style={{ fontSize: "11px", color: "#dc2626", margin: "6px 0 0 0" }}>
                      {promoError}
                    </p>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "700", color: "#166534" }}>
                      <CheckIcon size={14} />
                      <span>{appliedPromo.code} Applied</span>
                      <span style={{ fontSize: "11px", fontWeight: "800", background: "#dcfce7", color: "#15803d", padding: "1px 6px", borderRadius: "10px" }}>
                        -₹{discountAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    {appliedPromo.description && (
                      <p style={{ fontSize: "11px", color: "#15803d", margin: "2px 0 0 20px" }}>
                        {appliedPromo.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#dc2626",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: "2px 4px",
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid #f3f4f6", paddingTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "#4b5563" }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "#b91c1c", fontWeight: "600" }}>
                  <span>Voucher Discount ({appliedPromo?.code})</span>
                  <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "#4b5563" }}>
                <span>Express Delivery</span>
                <span style={{ color: "#166534", fontWeight: "700" }}>FREE</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 0 0", marginTop: "12px", borderTop: "1px solid #e5e7eb", fontSize: "16px", fontWeight: "800", color: "#072818" }}>
              <span>Grand Total</span>
              <div style={{ textAlign: "right" }}>
                {discountAmount > 0 && (
                  <span style={{ fontSize: "12px", textDecoration: "line-through", color: "#9ca3af", marginRight: "8px", fontWeight: "500" }}>
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                )}
                <span style={{ color: "#072818" }}>₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div style={{ marginTop: "20px", padding: "12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0", fontSize: "11px", color: "#166534", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheckIcon size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
              <span>Sign in or register on the left to complete your order.</span>
            </div>
          </aside>
        </div>
      </main>
    );
  }

  // =========================================================================
  // VIEW B: AUTHENTICATED CUSTOMER CHECKOUT (SHIPPING & PAYMENT SELECTION)
  // =========================================================================
  return (
    <main className="checkout-container">
      {/* 3-STEP PROGRESS INDICATOR */}
      <div className="checkout-steps-indicator">
        <div className="checkout-step-pill active" style={{ background: "#0d4428", color: "#f5d77f" }}>
          <span className="checkout-step-num">✓</span>
          <span>Verified: {user?.name || user?.email}</span>
        </div>
        <span style={{ color: "var(--border-medium)" }}>———</span>
        <div className="checkout-step-pill active">
          <span className="checkout-step-num">2</span>
          <span>Shipping & Delivery</span>
        </div>
        <span style={{ color: "var(--border-medium)" }}>———</span>
        <div className="checkout-step-pill active">
          <span className="checkout-step-num">3</span>
          <span>Payment & Place Order</span>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="checkout-grid">
        {/* LEFT: FORM FIELDS */}
        <div>
          {/* Authenticated Customer Banner */}
          <div
            style={{
              marginBottom: "20px",
              padding: "14px 18px",
              borderRadius: "8px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <CheckIcon size={16} style={{ color: "#16a34a" }} />
              <span>
                Authenticated as <strong>{user?.name}</strong> ({user?.email})
              </span>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              style={{
                background: "none",
                border: "none",
                color: "#15803d",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Switch Account
            </button>
          </div>

          {/* Contact Details */}
          <div className="checkout-card">
            <h2>Contact Information</h2>
            <div className="form-group">
              <label htmlFor="email">Email Address (For Order Invoicing & Updates) *</label>
              <input
                id="email"
                type="email"
                required
                readOnly
                className="form-input"
                value={user?.email || form.email}
                style={{ background: "#f9fafb", cursor: "not-allowed" }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number (For Courier Tracking & Delivery Dispatch) *</label>
              <input
                id="phone"
                type="tel"
                required
                className="form-input"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Shipping Address Section */}
          <div className="checkout-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
              <h2 style={{ margin: 0 }}>Shipping & Delivery Address</h2>
              {savedAddresses.length > 0 && selectedAddressId !== "new" && (
                <button
                  type="button"
                  onClick={handleSwitchToNewAddress}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontSize: "12px",
                    color: "#0d4428",
                    fontWeight: "700",
                    textDecoration: "underline",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer",
                  }}
                >
                  <PlusIcon size={13} /> Deliver to a new address
                </button>
              )}
            </div>

            {/* SAVED ADDRESS CARDS GRID */}
            {savedAddresses.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#0d4428", letterSpacing: "1px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                  <MapPinIcon size={13} /> Select Saved Delivery Destination
                </span>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "14px" }}>
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectSavedAddress(addr)}
                        style={{
                          padding: "14px",
                          borderRadius: "6px",
                          border: isSelected ? "2px solid #0d4428" : "1px solid #d1d5db",
                          background: isSelected ? "#f0f7f3" : "#ffffff",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          position: "relative",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "800", padding: "2px 8px", borderRadius: "10px", background: isSelected ? "#0d4428" : "#f3f4f6", color: isSelected ? "#f5d77f" : "#374151" }}>
                            {addr.tag || "Address"} {addr.isDefault ? "★ Default" : ""}
                          </span>
                          {isSelected && (
                            <span style={{ color: "#15803d", fontSize: "11px", fontWeight: "800" }}>✓ Selected</span>
                          )}
                        </div>

                        <strong style={{ fontSize: "13px", color: "#111827", display: "block", marginBottom: "2px" }}>
                          {addr.name}
                        </strong>
                        <p style={{ fontSize: "12px", color: "#4b5563", margin: "2px 0", lineHeight: "1.4" }}>
                          {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <span style={{ fontSize: "11px", color: "#6b7280" }}>Tel: {addr.phone}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ADDRESS FORM FIELDS */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  id="firstName"
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Radhika"
                  value={form.firstName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sharma"
                  value={form.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Street Address, Suite / Flat / Floor *</label>
              <input
                id="address"
                type="text"
                required
                className="form-input"
                placeholder="e.g. 402, Royal Residency, MG Road"
                value={form.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pincode">PIN Code *</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="pincode"
                    type="text"
                    required
                    maxLength={6}
                    className="form-input"
                    placeholder="e.g. 110001"
                    value={form.pincode}
                    onChange={handleChange}
                  />
                  {pincodeLoading && (
                    <span style={{ position: "absolute", right: "12px", top: "12px", fontSize: "11px", color: "#6b7280" }}>
                      Validating...
                    </span>
                  )}
                </div>
                {pincodeStatus && (
                  <span style={{ fontSize: "11px", color: "#166534", fontWeight: "600", marginTop: "4px", display: "block" }}>
                    {pincodeStatus}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  id="city"
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. New Delhi"
                  value={form.city}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="state">State / Union Territory *</label>
              <input
                id="state"
                type="text"
                required
                className="form-input"
                placeholder="e.g. Delhi"
                value={form.state}
                onChange={handleChange}
              />
            </div>

            {selectedAddressId === "new" && (
              <div style={{ marginTop: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#374151", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={saveAddressToAccount}
                    onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                  />
                  <span>Save this shipping address to my account for faster future checkouts</span>
                </label>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div
            style={{
              background: "#ffffff",
              padding: "24px",
              borderRadius: "12px",
              border: "1px solid rgba(7, 40, 24, 0.1)",
              boxShadow: "0 4px 20px rgba(7, 40, 24, 0.04)",
              marginTop: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", paddingBottom: "12px", borderBottom: "1px solid #f0f2f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(7, 40, 24, 0.08)", color: "#072818", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CreditCardIcon size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#072818", margin: 0 }}>
                    Payment Method
                  </h2>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>Choose how you'd like to pay for this order</span>
                </div>
              </div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "4px 10px", borderRadius: "20px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <ShieldCheckIcon size={13} />
                100% Encrypted
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* OPTION 1: PREPAID ONLINE VIA RAZORPAY (RECOMMENDED) */}
              <label
                onClick={() => setPaymentMethod("online")}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  padding: "18px 20px",
                  borderRadius: "10px",
                  border: paymentMethod === "online" ? "2px solid #072818" : "1px solid #e5e7eb",
                  background: paymentMethod === "online" ? "linear-gradient(135deg, #fbfdfc 0%, #f4f8f5 100%)" : "#ffffff",
                  cursor: "pointer",
                  boxShadow: paymentMethod === "online" ? "0 4px 14px rgba(7, 40, 24, 0.08)" : "none",
                  position: "relative",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Luxury Radio Indicator */}
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: paymentMethod === "online" ? "2px solid #072818" : "2px solid #cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "2px",
                    flexShrink: 0,
                    background: "#ffffff",
                  }}
                >
                  {paymentMethod === "online" && (
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#072818" }} />
                  )}
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={paymentMethod === "online"}
                  onChange={() => setPaymentMethod("online")}
                  style={{ display: "none" }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ color: "#072818" }}>
                        <CreditCardIcon size={18} />
                      </div>
                      <span style={{ fontSize: "15px", fontWeight: "700", color: "#072818" }}>
                        Prepaid Online (Razorpay)
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "800",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: "#c59b27",
                        color: "#072818",
                      }}
                    >
                      ⚡ Fast & Seamless
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#4b5563", margin: "4px 0 0 0", lineHeight: "1.4" }}>
                    Pay securely via Google Pay, PhonePe, Paytm, UPI QR, Credit/Debit Cards, Net Banking & EMI.
                  </p>
                </div>
              </label>

              {/* OPTION 2: CASH ON DELIVERY */}
              <label
                onClick={() => setPaymentMethod("cod")}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  padding: "18px 20px",
                  borderRadius: "10px",
                  border: paymentMethod === "cod" ? "2px solid #072818" : "1px solid #e5e7eb",
                  background: paymentMethod === "cod" ? "linear-gradient(135deg, #fbfdfc 0%, #f4f8f5 100%)" : "#ffffff",
                  cursor: "pointer",
                  boxShadow: paymentMethod === "cod" ? "0 4px 14px rgba(7, 40, 24, 0.08)" : "none",
                  position: "relative",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: paymentMethod === "cod" ? "2px solid #072818" : "2px solid #cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "2px",
                    flexShrink: 0,
                    background: "#ffffff",
                  }}
                >
                  {paymentMethod === "cod" && (
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#072818" }} />
                  )}
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  style={{ display: "none" }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ color: "#072818" }}>
                        <TruckIcon size={18} />
                      </div>
                      <span style={{ fontSize: "15px", fontWeight: "700", color: "#072818" }}>
                        Cash on Delivery (COD)
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: "#e2e8f0",
                        color: "#475569",
                      }}
                    >
                      Doorstep Inspection
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#4b5563", margin: "4px 0 0 0", lineHeight: "1.4" }}>
                    Pay securely in cash or scan UPI QR with our courier partner upon delivery.
                  </p>
                </div>
              </label>
            </div>

            {/* TRUST BANNER */}
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                background: "rgba(197, 155, 39, 0.06)",
                border: "1px dashed rgba(197, 155, 39, 0.3)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "12px",
                color: "#5b4308",
              }}
            >
              <ShieldCheckIcon size={18} style={{ color: "#c59b27", flexShrink: 0 }} />
              <span>
                <strong>PQN Atelier Guarantee:</strong> Tamper-proof luxury packaging, transparent doorstep inspection, and easy hassle-free returns.
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: ORDER SUMMARY */}
        <aside
          style={{
            background: "#ffffff",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid rgba(7, 40, 24, 0.1)",
            boxShadow: "0 4px 20px rgba(7, 40, 24, 0.05)",
            position: "sticky",
            top: "100px",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#072818", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e5e7eb" }}>
            Order Summary ({cart.length} {cart.length === 1 ? "Item" : "Items"})
          </h2>

          <div style={{ maxHeight: "320px", overflowY: "auto", marginBottom: "16px", paddingRight: "4px" }}>
            {cart.map((item) => (
              <div
                key={`${item.id}-${item.size || ""}-${item.color || ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "12px 0",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "76px",
                    minWidth: "60px",
                    borderRadius: "6px",
                    overflow: "hidden",
                    background: "#f3f4f6",
                    flexShrink: 0,
                  }}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "#e5e7eb" }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#111827",
                      margin: "0 0 4px 0",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.name}
                  </h3>
                  <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>
                    Qty: {item.quantity}
                    {item.size && ` | Size: ${item.size}`}
                    {item.color && ` | Color: ${item.color}`}
                  </p>
                </div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#072818", whiteSpace: "nowrap" }}>
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>

            {/* PROMO / COUPON CODE SECTION */}
            <div
              style={{
                marginBottom: "16px",
                padding: "14px",
                background: "#fbfcfb",
                borderRadius: "8px",
                border: "1px dashed rgba(7, 40, 24, 0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: "#072818", display: "flex", alignItems: "center", gap: "5px" }}>
                  <TagIcon size={13} /> Apply Promo Code
                </span>
                {!appliedPromo && (
                  <button
                    type="button"
                    onClick={() => handleApplyPromo(undefined, "PQN10")}
                    style={{
                      background: "rgba(197, 155, 39, 0.12)",
                      border: "1px solid #c59b27",
                      color: "#072818",
                      fontSize: "10px",
                      fontWeight: "800",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <SparklesIcon size={10} style={{ color: "#c59b27" }} /> PQN10 (10% OFF)
                  </button>
                )}
              </div>

              {!appliedPromo ? (
                <div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      placeholder="ENTER COUPON CODE"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value.toUpperCase());
                        setPromoError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyPromo();
                        }
                      }}
                      style={{
                        flex: 1,
                        height: "38px",
                        padding: "0 10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyPromo()}
                      disabled={validatingPromo || !promoInput.trim()}
                      style={{
                        padding: "0 16px",
                        height: "38px",
                        background: promoInput.trim() ? "#072818" : "#9ca3af",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "700",
                        letterSpacing: "0.5px",
                        cursor: promoInput.trim() ? "pointer" : "not-allowed",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {validatingPromo ? "APPLYING..." : "APPLY"}
                    </button>
                  </div>
                  {promoError && (
                    <p style={{ fontSize: "11px", color: "#dc2626", margin: "6px 0 0 0" }}>
                      {promoError}
                    </p>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "700", color: "#166534" }}>
                      <CheckIcon size={14} />
                      <span>{appliedPromo.code} Applied</span>
                      <span style={{ fontSize: "11px", fontWeight: "800", background: "#dcfce7", color: "#15803d", padding: "1px 6px", borderRadius: "10px" }}>
                        -₹{discountAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    {appliedPromo.description && (
                      <p style={{ fontSize: "11px", color: "#15803d", margin: "2px 0 0 20px" }}>
                        {appliedPromo.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#dc2626",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: "2px 4px",
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid #f3f4f6", paddingTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "#4b5563" }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "#b91c1c", fontWeight: "600" }}>
                  <span>Voucher Discount ({appliedPromo?.code})</span>
                  <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "#4b5563" }}>
                <span>Express Delivery</span>
                <span style={{ color: "#166534", fontWeight: "700" }}>FREE</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 0 0", marginTop: "12px", borderTop: "1px solid #e5e7eb", fontSize: "16px", fontWeight: "800", color: "#072818" }}>
              <span>Grand Total</span>
              <div style={{ textAlign: "right" }}>
                {discountAmount > 0 && (
                  <span style={{ fontSize: "12px", textDecoration: "line-through", color: "#9ca3af", marginRight: "8px", fontWeight: "500" }}>
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                )}
                <span style={{ color: "#072818" }}>₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                padding: "12px",
                borderRadius: "4px",
                fontSize: "13px",
                marginTop: "16px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: "100%", marginTop: "24px", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            {loading ? (
              <span>PROCESSING PAYMENT & ORDER...</span>
            ) : paymentMethod === "online" ? (
              <>
                <CreditCardIcon size={18} />
                <span>PAY ONLINE VIA RAZORPAY (₹{grandTotal.toLocaleString("en-IN")})</span>
              </>
            ) : (
              <>
                <TruckIcon size={18} />
                <span>PLACE CASH ON DELIVERY ORDER (₹{grandTotal.toLocaleString("en-IN")})</span>
              </>
            )}
          </button>

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "12px",
              color: "var(--color-text-muted)",
            }}
          >
            <ShieldCheckIcon size={16} />
            <span>256-Bit SSL Encrypted & Secure Member Checkout</span>
          </div>
        </aside>
      </form>

      {/* RAZORPAY ATELIER SIMULATOR MODAL (SANDBOX FALLBACK GATEWAY) */}
      {simulatorOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            backgroundColor: "rgba(7, 40, 24, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            animation: "fadeIn 0.2s ease",
          }}
          onClick={() => setSimulatorOrder(null)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              maxWidth: "480px",
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              border: "1px solid rgba(245, 215, 127, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                backgroundColor: "#072818",
                color: "#ffffff",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(245, 215, 127, 0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(245, 215, 127, 0.15)",
                    color: "#f5d77f",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CreditCardIcon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#f5d77f", letterSpacing: "0.5px" }}>
                    PQN PARTY QUEEN
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.75)" }}>
                    Razorpay Secure Gateway • Sandbox Mode
                  </div>
                </div>
              </div>
              <div
                style={{
                  backgroundColor: "rgba(245, 215, 127, 0.2)",
                  color: "#f5d77f",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              >
                ₹{simulatorOrder.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px" }}>
              {/* Customer summary */}
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  fontSize: "12.5px",
                  color: "#475569",
                  display: "flex",
                  justifyContent: "space-between",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <strong>Customer:</strong> {form.firstName.trim()} {form.lastName.trim()}
                </div>
                <div>
                  <strong>Phone:</strong> {form.phone.trim()}
                </div>
              </div>

              {/* Payment Methods Selection */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "10px", letterSpacing: "0.5px" }}>
                  Select Payment Option
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setSimulatorMethod("upi")}
                    style={{
                      padding: "12px 8px",
                      borderRadius: "8px",
                      border: simulatorMethod === "upi" ? "2px solid #072818" : "1px solid #cbd5e1",
                      backgroundColor: simulatorMethod === "upi" ? "#f0fdf4" : "#ffffff",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: simulatorMethod === "upi" ? "#072818" : "#64748b",
                      textAlign: "center",
                    }}
                  >
                    UPI / QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatorMethod("card")}
                    style={{
                      padding: "12px 8px",
                      borderRadius: "8px",
                      border: simulatorMethod === "card" ? "2px solid #072818" : "1px solid #cbd5e1",
                      backgroundColor: simulatorMethod === "card" ? "#f0fdf4" : "#ffffff",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: simulatorMethod === "card" ? "#072818" : "#64748b",
                      textAlign: "center",
                    }}
                  >
                    Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatorMethod("netbanking")}
                    style={{
                      padding: "12px 8px",
                      borderRadius: "8px",
                      border: simulatorMethod === "netbanking" ? "2px solid #072818" : "1px solid #cbd5e1",
                      backgroundColor: simulatorMethod === "netbanking" ? "#f0fdf4" : "#ffffff",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: simulatorMethod === "netbanking" ? "#072818" : "#64748b",
                      textAlign: "center",
                    }}
                  >
                    NetBanking
                  </button>
                </div>
              </div>

              {/* Method Details */}
              {simulatorMethod === "upi" && (
                <div style={{ backgroundColor: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: "8px", padding: "14px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#6b21a8", marginBottom: "8px" }}>
                    Select Instant UPI App
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[
                      { id: "gpay", label: "Google Pay" },
                      { id: "phonepe", label: "PhonePe" },
                      { id: "paytm", label: "Paytm UPI" },
                    ].map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSimulatorUpiApp(app.id as any)}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: "6px",
                          border: simulatorUpiApp === app.id ? "1.5px solid #6b21a8" : "1px solid #cbd5e1",
                          backgroundColor: simulatorUpiApp === app.id ? "#ffffff" : "#f1f5f9",
                          fontSize: "11.5px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        {app.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {simulatorMethod === "card" && (
                <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "14px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#1e40af", marginBottom: "4px" }}>
                    Simulated Luxury Card
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#3b82f6" }}>
                    •••• •••• •••• 4242 (Visa / MasterCard Secure)
                  </div>
                </div>
              )}

              {simulatorMethod === "netbanking" && (
                <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "14px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#166534", marginBottom: "4px" }}>
                    Simulated Instant NetBanking
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#15803d" }}>
                    HDFC / ICICI / SBI / Axis Bank Instant Authorization
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    finalizeOnlineOrder({
                      razorpay_order_id: simulatorOrder.orderId,
                      razorpay_payment_id: `pay_mock_${Date.now()}`,
                      razorpay_signature: "mock_signature_valid",
                    });
                  }}
                  style={{
                    backgroundColor: "#072818",
                    color: "#f5d77f",
                    border: "1px solid #f5d77f",
                    padding: "16px",
                    borderRadius: "8px",
                    fontWeight: "800",
                    fontSize: "14px",
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    letterSpacing: "0.5px",
                    boxShadow: "0 4px 12px rgba(7, 40, 24, 0.25)",
                  }}
                >
                  {loading ? (
                    <span>VERIFYING PAYMENT SIGNATURE...</span>
                  ) : (
                    <>
                      <LockIcon size={16} />
                      <span>AUTHORIZE & PAY ₹{simulatorOrder.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      <CheckIcon size={16} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setSimulatorOrder(null)}
                  style={{
                    backgroundColor: "transparent",
                    color: "#64748b",
                    border: "none",
                    padding: "10px",
                    fontSize: "12.5px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Cancel and Return to Checkout
                </button>
              </div>

              {/* Security note */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "11px",
                  color: "#94a3b8",
                  marginTop: "16px",
                }}
              >
                <ShieldCheckIcon size={14} />
                <span>256-Bit Razorpay Test Sandbox Encryption</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}