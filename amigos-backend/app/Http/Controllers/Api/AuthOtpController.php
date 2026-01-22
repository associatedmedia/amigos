<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\VerificationCode;
use App\Services\FcmService; // Import the service we created earlier
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AuthOtpController extends Controller {

    public function sendOtp(Request $request) {
        // 1. We now require 'fcm_token' because the user isn't logged in yet
        $request->validate([
            'phone' => 'required',
            'fcm_token' => 'required' 
        ]);
        
        // 2. Generate 4-digit OTP
        $otp = rand(1000, 9999); 

        // 3. Save OTP to Database
        VerificationCode::updateOrCreate(
            ['mobile_no' => $request->phone],
            ['otp' => $otp, 'expire_at' => Carbon::now()->addMinutes(10)]
        );

        // 4. Send OTP via Firebase Notification
        try {
            $fcmService = new FcmService();
            $sent = $fcmService->sendNotification(
                $request->fcm_token, // Send directly to the device requesting login
                "Amigos Pizza Login", 
                "Your OTP is: $otp. Valid for 10 minutes."
            );

            if ($sent) {
                return response()->json([
                    'success' => true, 
                    'message' => 'OTP Notification sent to your device.'
                ]);
            } else {
                return response()->json([
                    'success' => false, 
                    'message' => 'Failed to send notification. Please try again.'
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error("OTP Send Error: " . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Server error sending OTP'
            ], 500);
        }
    }

   public function verifyOtp(Request $request) 
    {
        $request->validate([
            'phone' => 'required',
            'otp' => 'required|digits:4',
            'fcm_token' => 'nullable' // Optional: Update user's token on login
        ]);

        // --- 🍎 APPLE REVIEW BYPASS (Optional but recommended) ---
        if ($request->phone === '9906745022' && $request->otp === '1234') {
             return $this->loginUser($request->phone, $request->fcm_token);
        }
        // ---------------------------------------------------------

        // 1. Find the OTP record
        $check = VerificationCode::where('mobile_no', $request->phone)
                                ->where('otp', $request->otp)
                                ->first();

        // 2. Validate
        if (!$check) {
            return response()->json(['success' => false, 'message' => 'Invalid OTP'], 401);
        }

        if (now()->gt($check->expire_at)) {
            return response()->json(['success' => false, 'message' => 'OTP has expired'], 401);
        }

        // 3. Delete OTP (Prevent reuse)
        $check->delete();

        // 4. Login/Create User
        return $this->loginUser($request->phone, $request->fcm_token);
    }

    // Helper function to handle user creation & token generation
    private function loginUser($phone, $fcmToken) {
        
        $user = User::firstOrCreate(
            ['mobile_no' => $phone],
            ['name' => 'Customer'] 
        );

        // Update FCM Token for future order updates
        if ($fcmToken) {
            $user->fcm_token = $fcmToken;
            $user->save();
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'mobile_no' => $user->mobile_no
            ]
        ]);
    }
}