<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\VerificationCode;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AuthOtpController extends Controller {

   public function sendOtp(Request $request) {
    // 1. Validate Input
    $request->validate(['phone' => 'required']);
    
    // ---------------------------------------------------------
    // 🔧 CONFIG: TEST NUMBERS (Skip SMS for these)
    // ---------------------------------------------------------
    $testNumbers = [
        '9876543210',  // Apple/Google Reviewer Number
        '9906667444',  // Your Personal Testing Number
        '1234567890'   // Another Test Number
    ];

    // Check if the input phone is in our test list
    $isTestAccount = in_array((string)$request->phone, $testNumbers);

    // ---------------------------------------------------------
    // 🎲 GENERATE OTP
    // ---------------------------------------------------------
    if ($isTestAccount) {
        $otp = 1234; // ✅ Fixed OTP for Testing/Reviewers
    } else {
        $otp = rand(1000, 9999); // 🔀 Random OTP for Real Users
    }
    
    // ---------------------------------------------------------
    // 💾 SAVE TO DATABASE (Required for Login)
    // ---------------------------------------------------------
    VerificationCode::updateOrCreate(
        ['mobile_no' => $request->phone],
        ['otp' => $otp, 'expire_at' => Carbon::now()->addMinutes(10)]
    );

    // ---------------------------------------------------------
    // 📨 SEND SMS (ONLY if NOT a test account)
    // ---------------------------------------------------------
    if (! $isTestAccount) {
        try {
            // 1. Construct URL
            $url = env('TRUSTSIGNAL_URL') . '?api_key=' . env('TRUSTSIGNAL_API_KEY');

            // 2. Prepare Message (Must match DLT Template)
            $messageContent = "Welcome to Amigos Foods App! Your OTP for login is $otp . It is valid for 10 minutes. Please do not share this code with anyone."; 

            // 3. Send Request
            $response = Http::post($url, [
                "sender_id"   => env('TRUSTSIGNAL_SENDER_ID'),
                "to"          => [ (int)$request->phone ], // ⚠️ Must be an Array of Integers
                "route"       => "promotional", //transactional
                "message"     => $messageContent,
                "template_id" => env('TRUSTSIGNAL_TEMPLATE_ID')
            ]);

            // 4. Logging
            if ($response->failed()) {
                Log::error('TrustSignal SMS Failed: ' . $response->body());
            } else {
                Log::info('TrustSignal SMS Sent: ' . $response->body());
            }

        } catch (\Exception $e) {
            Log::error('SMS Integration Exception: ' . $e->getMessage());
        }
    }

    // ---------------------------------------------------------
    // 🏁 RETURN RESPONSE
    // ---------------------------------------------------------
    return response()->json([
        'success' => true, 
        'message' => $isTestAccount ? 'OTP sent (Test Mode)' : 'OTP sent successfully'
    ]);
}

   public function verifyOtp(Request $request) 
    {
        // 1. Validate the request
        $request->validate([
            'phone' => 'required',
            'otp' => 'required|digits:4'
        ]);

        // 2. Find the OTP record
        $check = VerificationCode::where('mobile_no', $request->phone)
                                ->where('otp', $request->otp)
                                ->first();

        // 3. Validate existence and expiration
        if (!$check) {
            return response()->json(['success' => false, 'message' => 'Invalid OTP'], 401);
        }

        if (now()->gt($check->expire_at)) {
            return response()->json(['success' => false, 'message' => 'OTP has expired'], 401);
        }

        // 4. Find or Create the User based on mobile_no
        // Since email is now nullable in your migration, this won't throw the SQL error anymore
        $user = User::firstOrCreate(
            ['mobile_no' => $request->phone],
            ['name' => 'Customer'] 
        );

        // 5. Clean up: Delete the OTP after successful verification
        $check->delete();

        // 6. Issue Sanctum Token for the Expo App
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'mobile_no' => $user->mobile_no,
                'role' => $user->role
            ]
        ]);
    }
}