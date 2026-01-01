<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    /**
     * Get the authenticated user's profile data.
     */
    public function show(Request $request)
    {
        // $request->user() returns the user associated with the Sanctum token
        return response()->json([
            'success' => true,
            'user' => $request->user()
        ], 200);
    }

    /**
     * Update the authenticated user's profile data.
     */
    public function update(Request $request)
    {
        $user = $request->user();
        

        // 1. Validation
        $validator = Validator::make($request->all(), [
            'name'    => 'required|string|max:255',
            'mobile_no'   => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors()
            ], 422);
        }
        

        // 2. Update the User model
        try {
            $user->update([
                'name'    => $request->name,
                'mobile_no'   => $request->mobile_no,
                'address' => $request->address,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully!',
                'user'    => $user
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Update failed: ' . $e->getMessage()
            ], 500);
        }
    }
}