<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str; // <--- Import this for random string generation

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number', // Make sure you have this column in your DB (or remove if using ID)
        'user_id',
        'driver_id',
        'mobile_no',
        'address',
        'latitude',
        'longitude',
        'total_amount',
        'status',
        'payment_method',
        'payment_status',
        'items' // If you are storing items as JSON
    ];

    protected $casts = [
        'items' => 'array', // Automatically handle JSON data for items
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    // ✅ THE MISSING METHOD
    public static function generateOrderNumber()
    {
        // Example: ORD-928372
        return 'ORD-' . mt_rand(100000, 999999);
    }
}