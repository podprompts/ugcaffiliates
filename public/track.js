/**
 * UGCA Affiliate Pixel — track.js
 * --------------------------------
 * Vendors paste ONE script tag on their order confirmation page:
 *
 *   <script>
 *     window.UGCA_CONVERSION = {
 *       amount: "{{ORDER_TOTAL}}",   // e.g. "49.00"
 *       order_id: "{{ORDER_ID}}"     // e.g. "ORD-12345"
 *     };
 *   </script>
 *   <script src="https://ugcaffiliates.com/track.js" async></script>
 *
 * The script will:
 *   1. On ANY page load — capture ?ugca_ref=XXXX from the URL and store it as a cookie
 *   2. On confirmation page — read window.UGCA_CONVERSION and fire a conversion POST
 */

(function () {
  var COOKIE_NAME = "ugca_ref";
  var COOKIE_DAYS = 30;
  var API_URL = "https://ugcaffiliates.com/api/conversions";

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setCookie(name, value, days) {
    var expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie =
      name + "=" + encodeURIComponent(value) +
      "; expires=" + expires +
      "; path=/" +
      "; SameSite=Lax";
  }

  function getParam(key) {
    try {
      return new URLSearchParams(window.location.search).get(key);
    } catch (e) {
      return null;
    }
  }

  // ─── Step 1: Capture ref from URL and store in cookie ──────────────────────
  // This runs on every page of the vendor's site (product, cart, checkout, etc.)
  // so the cookie is set as soon as the affiliate link is clicked.

  var refFromUrl = getParam("ugca_ref");
  if (refFromUrl) {
    setCookie(COOKIE_NAME, refFromUrl, COOKIE_DAYS);
  }

  // ─── Step 2: Fire conversion if window.UGCA_CONVERSION is defined ──────────
  // Only runs on the order confirmation page where the vendor sets the object.

  var conversion = window.UGCA_CONVERSION;
  if (!conversion || !conversion.order_id || !conversion.amount) return;

  var ref = getCookie(COOKIE_NAME);
  if (!ref) return; // No affiliate cookie — organic sale, nothing to track

  // Deduplicate: don't fire twice for the same order_id
  var firedKey = "ugca_fired_" + conversion.order_id;
  if (sessionStorage.getItem(firedKey)) return;

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ref: ref,           // affiliate tracking code
      order_id: conversion.order_id,
      amount: parseFloat(conversion.amount),
      source: "pixel",
      page_url: window.location.href,
    }),
    keepalive: true,      // fires even if page unloads immediately
  })
    .then(function (res) {
      if (res.ok) {
        sessionStorage.setItem(firedKey, "1");
        // Clear cookie after confirmed conversion (optional — remove if you
        // want to allow multiple commissions per affiliate per session)
        document.cookie = COOKIE_NAME + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
    })
    .catch(function () {
      // Silent fail — never break vendor's confirmation page
    });
})();