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
        $user = $request->user();
        $isFirstOrder = \App\Models\Order::where('user_id', $user->id)->count() === 0;

        // $request->user() returns the user associated with the Sanctum token
        return response()->json([
            'success' => true,
            'user' => $user,
            'is_first_order' => $isFirstOrder
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

    /**
     * Delete the authenticated user's account.
     */
    public function destroy(Request $request)
    {
        $user = $request->user();

        try {
            // Revoke all tokens
            $user->tokens()->delete();

            // Delete the user
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'Account deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Account deletion failed: ' . $e->getMessage()
            ], 500);
        }
    }
}