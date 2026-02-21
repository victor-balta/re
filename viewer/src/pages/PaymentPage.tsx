import React, { useState } from 'react';
import { ArrowRight, CreditCard, Lock, ArrowLeft, CheckCircle, HelpCircle } from 'lucide-react';

export default function PaymentPage() {
    const [isPaid, setIsPaid] = useState(false);

    // Demo summary values
    const grandTotal = 142.50;
    const bookingFee = 0;

    if (isPaid) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
                    <p className="text-slate-500 mb-8">Your ticket has been booked and sent to your email.</p>
                    <button
                        onClick={() => window.location.hash = ''}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600">
                            Rail ERA
                        </h1>
                        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                        <span className="text-sm font-medium text-slate-500">Secure Payment</span>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <button
                    onClick={() => window.location.hash = '#/details'}
                    className="flex items-center gap-2 text-sm text-pink-600 font-medium mb-6 hover:text-pink-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to passenger details
                </button>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: Content */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-pink-600" />
                                    Payment Method
                                </h2>
                                <Lock className="w-5 h-5 text-emerald-600" />
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Card Number</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="0000 0000 0000 0000"
                                            className="w-full pl-10 rounded-lg border-slate-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 p-3 border"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Expiry Date</label>
                                        <input
                                            type="text"
                                            placeholder="MM/YY"
                                            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 p-3 border"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">CVC</label>
                                        <input
                                            type="text"
                                            placeholder="123"
                                            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 p-3 border"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Name on Card</label>
                                    <input
                                        type="text"
                                        placeholder="Jane Doe"
                                        className="w-full rounded-lg border-slate-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 p-3 border"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Cart Sidebar */}
                    <div className="lg:w-80 xl:w-96">
                        <div className="sticky top-24 space-y-4">
                            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <div className="p-5 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-base font-bold text-slate-900">Selected tickets</h2>
                                            <p className="text-sm text-slate-500 mt-1">1 Adult</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-slate-900">€{grandTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 mx-5"></div>

                                <div className="p-5 space-y-3">
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Basket items</span>
                                        <span>€{grandTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-600 items-center">
                                        <div className="flex items-center gap-1.5">
                                            <span>Booking fee</span>
                                            <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                        </div>
                                        <span>€{bookingFee.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="p-5 pt-0">
                                    <div className="flex justify-between items-end mb-6">
                                        <span className="text-lg font-bold text-slate-900">Total to pay</span>
                                        <span className="text-2xl font-bold text-slate-900">€{(grandTotal + bookingFee).toFixed(2)}</span>
                                    </div>

                                    <button
                                        onClick={() => setIsPaid(true)}
                                        className="w-full bg-pink-600 text-white rounded-lg py-3.5 font-bold transition-all shadow-sm flex items-center justify-center gap-2 mb-2 hover:bg-pink-700 hover:shadow-md transform active:scale-[0.99]"
                                    >
                                        <Lock className="w-5 h-5 min-w-5" />
                                        <span>Pay Now</span>
                                    </button>
                                    <p className="text-xs text-center text-slate-500 mt-4 flex items-center justify-center gap-1">
                                        <Lock className="w-3 h-3" />
                                        Your payment is secure and encrypted
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
