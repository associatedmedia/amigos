<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PushNotification;
use App\Models\User;
use App\Services\ExpoPushService;

class PushNotificationController extends Controller
{
    public function index()
    {
        $notifications = PushNotification::orderBy('created_at', 'desc')->get();
        return view('webadmin.push_notifications.index', compact('notifications'));
    }

    public function create()
    {
        return view('webadmin.push_notifications.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'target_audience' => 'nullable|string'
        ]);

        PushNotification::create($request->all());

        return redirect()->route('admin.push_notifications.index')->with('success', 'Push notification draft created successfully.');
    }

    public function edit(PushNotification $pushNotification)
    {
        return view('webadmin.push_notifications.edit', compact('pushNotification'));
    }

    public function update(Request $request, PushNotification $pushNotification)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'target_audience' => 'nullable|string'
        ]);

        $pushNotification->update($request->all());

        return redirect()->route('admin.push_notifications.index')->with('success', 'Push notification updated successfully.');
    }

    public function destroy(PushNotification $pushNotification)
    {
        $pushNotification->delete();
        return redirect()->route('admin.push_notifications.index')->with('success', 'Push notification deleted successfully.');
    }

    public function dispatch(PushNotification $pushNotification, ExpoPushService $expoPushService)
    {
        if ($pushNotification->status === 'sent') {
            return redirect()->back()->with('error', 'This notification has already been sent.');
        }

        // Fetch tokens of target audience (simplified: all users with tokens)
        $tokens = User::whereNotNull('fcm_token')->pluck('fcm_token')->toArray();

        // Dispatch
        $expoPushService->send($pushNotification->title, $pushNotification->body, $tokens);

        // Mark as sent
        $pushNotification->update([
            'status' => 'sent',
            'sent_at' => now()
        ]);

        return redirect()->route('admin.push_notifications.index')->with('success', 'Push notification successfully dispatched to ' . count($tokens) . ' devices.');
    }
}
