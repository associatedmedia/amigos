<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use Razorpay\Api\Api;
class RazorpayWebController extends Controller
{
    public function showPaymentPage(Request $request)
    {
        $orderId = $request->query('orderid');
        $order = Order::find($orderId);

        if (!$order) {
            return "Invalid Order ID";
        }

        // 1. Initialize Razorpay API
        $api = new Api(env('RAZORPAY_KEY'), env('RAZORPAY_SECRET'));

        // 2. Create a Razorpay Order ID (Required for Standard Checkout)
        $razorpayOrder = $api->order->create([
            'receipt'         => (string)$order->id,
            'amount'          => $order->total_amount * 100, // Amount in Paise
            'currency'        => 'INR',
            'payment_capture' => 1 // Auto capture
        ]);

        // 3. Pass data to the View
        return view('payment', [
            'order' => $order,
            'razorpayOrderId' => $razorpayOrder['id'],
            'key' => env('RAZORPAY_KEY')
        ]);
    }

    public function handleCallback(Request $request)
    {
        $input = $request->all();
        $api = new Api(env('RAZORPAY_KEY'), env('RAZORPAY_SECRET'));

        // 1. Verify Payment Signature
        try {
            $attributes = [
                'razorpay_order_id' => $input['razorpay_order_id'],
                'razorpay_payment_id' => $input['razorpay_payment_id'],
                'razorpay_signature' => $input['razorpay_signature']
            ];
            $api->utility->verifyPaymentSignature($attributes);

            // 2. Update Database
            // Find order via the razorpay_order_id or store it in session previously
            // For simplicity, we assume you might pass your internal ID in 'notes' or handle it here
             
            // 3. Redirect BACK to React Native App
            // "amigospizza" must be your app's Scheme in app.json/AndroidManifest
             return redirect("amigospizza://payment/success?payment_id=" . $input['razorpay_payment_id']);

        } catch (\Exception $e) {
            return redirect("amigospizza://payment/failure?error=" . $e->getMessage());
        }
    }
}