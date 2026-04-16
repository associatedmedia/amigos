<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpoPushService
{
    /**
     * Send a push notification via Expo
     *
     * @param string $title
     * @param string $body
     * @param array $expoTokens Array of ExpoPushTokens
     * @param array|null $data Optional extra data payload
     * @return void
     */
    public function send($title, $body, array $expoTokens, ?array $data = null)
    {
        if (empty($expoTokens)) {
            return;
        }

        // Expo allows a maximum of 100 messages per request.
        $chunks = array_chunk($expoTokens, 100);

        foreach ($chunks as $chunk) {
            $messages = [];
            foreach ($chunk as $token) {
                // Ensure token is formatted correctly (ExponentPushToken[...] or ExpoPushToken[...])
                if (!str_starts_with($token, 'ExponentPushToken') && !str_starts_with($token, 'ExpoPushToken')) {
                    continue;
                }

                $message = [
                    'to' => $token,
                    'sound' => 'default',
                    'title' => $title,
                    'body' => $body,
                ];

                if ($data) {
                    $message['data'] = $data;
                }

                $messages[] = $message;
            }

            if (!empty($messages)) {
                try {
                    $response = Http::post('https://exp.host/--/api/v2/push/send', $messages);

                    if (!$response->successful()) {
                        Log::error('Expo Push Notification Failed: ' . $response->body());
                    }
                } catch (\Exception $e) {
                    Log::error('Expo Push Exception: ' . $e->getMessage());
                }
            }
        }
    }
}
