<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'user_id',
        'mobile_no',
        'address',
        'customer_name',
        'store_id',
        'payment_method',
        'payment_id',
        'payment_status',
        'total_amount',
        'status',
        'latitude',
        'longitude',
        'platform'
        // REMOVED 'items' from fillable because it is now a separate table
    ];

    // ✅ 1. Relationship: One Order has Many Items
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    // ✅ 2. Relationship: Order belongs to User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ✅ ADD THIS RELATIONSHIP
    public function driver()
    {
        // This says: "The 'driver_id' column belongs to a User"
        return $this->belongsTo(User::class, 'driver_id');
    }

    // Helper for Order Number
    public static function generateOrderNumber()
    {
        // Format: dmy (DayMonthYear) + 4 Random Digits
        // Example: 290125 + 6244 = 2901256244
        
        return date('dmy') . mt_rand(1000, 9999);
    }

    // ✅ ADD THIS RELATIONSHIP (Order Histories)
    public function histories()
    {
        return $this->hasMany(OrderHistory::class)->orderBy('created_at', 'desc');
    }

    // ✅ AUTOMATED LIFECYCLE TRACKER
    protected static function booted()
    {
        // 1. Record when Order is Created
        static::created(function ($order) {
            OrderHistory::create([
                'order_id' => $order->id,
                'action' => 'Order Placed',
                'new_status' => $order->status,
                'user_id' => auth()->id() ?? $order->user_id, // Who created it
                'remarks' => 'System successfully logged the initial order.'
            ]);
        });

        // 2. Record when Order changes State
        static::updated(function ($order) {
            
            // Check if Core Status Changed
            if ($order->isDirty('status')) {
                OrderHistory::create([
                    'order_id' => $order->id,
                    'action' => 'Status Updated',
                    'old_status' => $order->getOriginal('status'),
                    'new_status' => $order->status,
                    'user_id' => auth()->id(),
                    'remarks' => 'Order successfully transitioned to ' . strtoupper($order->status) . '.'
                ]);
            }
            
            // Check if Driver was Assigned manually or automatically
            if ($order->isDirty('driver_id') && $order->driver_id) {
                // Must ensure driver is loaded; use fresh to be safe if newly assigned
                $driverName = User::find($order->driver_id)->name ?? 'Delivery Partner';
                OrderHistory::create([
                    'order_id' => $order->id,
                    'action' => 'Driver Assignment',
                    'old_status' => $order->status,
                    'new_status' => $order->status,
                    'user_id' => auth()->id(),
                    'remarks' => "{$driverName} was explicitly assigned to fulfill this delivery."
                ]);
            }
        });
    }
}