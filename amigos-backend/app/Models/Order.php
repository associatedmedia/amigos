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
        'total_amount',
        'status',
        'latitude',
        'longitude'
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
}