<?php

namespace App\Services;

use Google\Auth\Credentials\ServiceAccountCredentials;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmService
{
    // ⚠️ IMPORTANT: Replace this with your exact Firebase Project ID
    // You can find this in Firebase Console -> Project Settings -> General -> Project ID
    protected $projectId = 'amigos-77bc2'; 

    /**
     * Send a Push Notification to a specific device token.
     */
    public function sendNotification($fcmToken, $title, $body, $data = [])
    {
        $accessToken = $this->getAccessToken();
        
        if (!$accessToken) {
            Log::error('FCM Error: Failed to generate access token.');
            return false;
        }

        $url = "https://fcm.googleapis.com/v1/projects/{$this->projectId}/messages:send";

        // 1. Base Payload (No Data yet)
        $payload = [
            'message' => [
                'token' => $fcmToken,
                'notification' => [
                    'title' => $title,
                    'body' => $body,
                ]
            ]
        ];

        // 2. Only add 'data' if it is not empty
        if (!empty($data)) {
            // Firebase requires all data values to be strings
            $payload['message']['data'] = array_map('strval', $data);
        }

        $response = Http::withToken($accessToken)
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post($url, $payload);

        if ($response->successful()) {
            return true;
        } else {
            Log::error('FCM Send Error: ' . $response->body());
            return false;
        }
    }

    /**
     * Generate the OAuth2 Access Token using the Service Account JSON file.
     */
    private function getAccessToken()
    {
        // ⚠️ Make sure your JSON file is located at: storage/app/firebase_credentials.json
        $credentialsPath = storage_path('app/firebase_credentials.json');
        
        if (!file_exists($credentialsPath)) {
            Log::error("Firebase credentials file missing at: $credentialsPath");
            return null;
        }

        try {
            // Scope required for Firebase Messaging
            $scopes = ['https://www.googleapis.com/auth/firebase.messaging'];
            
            // Create credentials instance
            $credentials = new ServiceAccountCredentials($scopes, $credentialsPath);
            
            // Fetch token
            $token = $credentials->fetchAuthToken();

            return $token['access_token'];

        } catch (\Exception $e) {
            Log::error('FCM Token Generation Error: ' . $e->getMessage());
            return null;
        }
    }
}