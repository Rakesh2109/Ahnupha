import React from 'react';
import { CreditCard, Smartphone } from 'lucide-react';

const UPIPaymentForm = ({ amount }) => {
  const UPI_ID = "videmuma@ybl";
  const MERCHANT_NAME = "Ahnupha";
  const amountFormatted = amount.toLocaleString('en-IN');
  const amountStr = Number(amount).toFixed(2);
  const UPI_DEEP_LINK = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amountStr}&cu=INR`;
  const QR_CODE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(UPI_DEEP_LINK)}`;

  const handlePayWithUPI = () => {
    try {
      window.location.href = UPI_DEEP_LINK;
    } catch (e) {
      const fallback = document.createElement('a');
      fallback.href = UPI_DEEP_LINK;
      fallback.rel = 'noopener';
      fallback.click();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden" role="region" aria-label="UPI payment">
      {/* Amount + heading - responsive across all devices */}
      <div className="p-4 sm:p-5 md:p-6 pb-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 flex-wrap">
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 flex-shrink-0" aria-hidden />
            <span className="leading-tight">Pay via UPI</span>
          </h3>
          <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-rose-600 whitespace-nowrap" aria-label={`Amount ${amountFormatted} rupees`}>₹{amountFormatted}</span>
        </div>

        {/* Open UPI app - only on mobile (does not work on desktop; desktop uses QR below) */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={handlePayWithUPI}
            aria-label={`Open UPI app and pay ₹${amountFormatted}`}
            className="flex items-center justify-center gap-2 sm:gap-3 w-full min-h-[56px] sm:min-h-[60px] py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-white font-semibold text-sm sm:text-base md:text-lg shadow-lg active:scale-[0.98] transition-all touch-manipulation cursor-pointer border-0 select-none"
          >
            <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" aria-hidden />
            <span className="flex-1 text-center sm:text-left">Open UPI app &amp; pay ₹{amountFormatted}</span>
          </button>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 text-center px-1">
            Opens GPay, PhonePe, Paytm or your bank app
          </p>
        </div>
      </div>

      <p className="px-4 sm:px-5 md:px-6 pb-4 text-xs sm:text-sm text-gray-600">
        <span className="md:hidden">Open the UPI app above or </span>Scan the QR to pay. Your order will be confirmed once we receive the payment.
      </p>

      {/* QR - primary on desktop; on mobile, alternative to "Open UPI app" */}
      <div className="px-4 sm:px-5 md:px-6 pb-5 pt-2 border-t border-gray-100">
        <p className="text-xs sm:text-sm font-medium text-gray-600 mb-3 hidden md:block">Scan to pay (use your phone's UPI app)</p>
        <p className="text-xs sm:text-sm font-medium text-gray-600 mb-3 md:hidden">Or scan from another device</p>
        <div className="flex justify-center">
          <div className="bg-white p-2 sm:p-3 rounded-xl border-2 border-gray-200">
            <img src={QR_CODE_URL} alt="UPI QR Code for payment" className="w-40 h-40 sm:w-44 sm:h-44 md:w-52 md:h-52 object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UPIPaymentForm;