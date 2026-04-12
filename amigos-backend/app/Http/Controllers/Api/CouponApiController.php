<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Order;
use Illuminate\Http\Request;

class CouponApiController extends Controller
{
    public function validateCoupon(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'cart_total' => 'required|numeric|min:1',
            'user_id' => 'required|integer' 
        ]);

        $code = strtoupper($request->code);
        $coupon = Coupon::where('code', $code)->first();

        if (!$coupon) {
            return response()->json(['success' => false, 'message' => 'Invalid coupon code.']);
        }

        if (!$coupon->is_active) {
            return response()->json(['success' => false, 'message' => 'This coupon is inactive.']);
        }

        if ($request->cart_total < $coupon->min_cart_amount) {
            return response()->json(['success' => false, 'message' => "Cart total must be at least ₹{$coupon->min_cart_amount} to use this coupon."]);
        }

        // Check global usage limit
        if (!is_null($coupon->usage_limit)) {
            $totalUses = Order::where('coupon_code', $code)->count();
            if ($totalUses >= $coupon->usage_limit) {
                return response()->json(['success' => false, 'message' => 'This coupon has reached its maximum usage limit.']);
            }
        }

        // Check per-user usage limit
        if (!is_null($coupon->usage_limit_per_user)) {
            $userUses = Order::where('coupon_code', $code)->where('user_id', $request->user_id)->count();
            if ($userUses >= $coupon->usage_limit_per_user) {
                return response()->json(['success' => false, 'message' => 'You have reached the usage limit for this coupon.']);
            }
        }

        // Calculate discount (discount is the value itself, or percent of total)
        $discountAmount = 0;
        if ($coupon->type === 'percent') {
            $discountAmount = ($request->cart_total * $coupon->value) / 100;
        } else {
            $discountAmount = $coupon->value;
        }

        // Prevent discount from exceeding total
        if ($discountAmount > $request->cart_total) {
            $discountAmount = $request->cart_total;
        }

        return response()->json([
            'success' => true,
            'message' => 'Coupon applied successfully!',
            'coupon' => [
                'code' => $coupon->code,
                'type' => $coupon->type,
                'value' => $coupon->value,
                'discount_amount' => $discountAmount
            ]
        ]);
    }
}
