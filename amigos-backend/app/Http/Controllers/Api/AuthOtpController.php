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
        $request->validate(['phone' => 'required']);
        
        $otp = rand(1000, 9999); // Generate 4-digit OTP
        
        // Save to Database
        VerificationCode::updateOrCreate(
            ['mobile_no' => $request->phone],
            ['otp' => $otp, 'expire_at' => Carbon::now()->addMinutes(10)]
        );

        // TODO: Integration with WhatsApp/SMS API here
        // Example: Http::post('https://whatsapp-api...', ['message' => "Your Amigos OTP is $otp"]);

       // ---------------------------------------------------------
        // ✅ CORRECTED INTEGRATION: TrustSignal SMS API
        // ---------------------------------------------------------
        try {
            // 1. Construct the URL with the API Key
            $url = env('TRUSTSIGNAL_URL') . '?api_key=' . env('TRUSTSIGNAL_API_KEY');

            // 2. Prepare the Message (Must match your DLT Template exactly!)
            // Example DLT Template: "Your Amigos OTP is {#var#}"
            $messageContent = "Your Amigos OTP is $otp"; 

            // 3. Send Request
            $response = Http::post($url, [
                "sender_id"   => env('TRUSTSIGNAL_SENDER_ID'),
                "to"          => [ (int)$request->phone ], // ⚠️ Must be an Array
                "route"       => "transactional",
                "message"     => $messageContent,
                "template_id" => env('TRUSTSIGNAL_TEMPLATE_ID')
            ]);

            // Debugging
            if ($response->failed()) {
                Log::error('TrustSignal SMS Failed: ' . $response->body());
            } else {
                Log::info('TrustSignal SMS Sent: ' . $response->body());
            }

        } catch (\Exception $e) {
            Log::error('SMS Integration Exception: ' . $e->getMessage());
        }
        return response()->json(['success' => true, 'message' => 'OTP sent successfully']);
        // return response()->json(['success' => true, 'message' => $otp]);
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