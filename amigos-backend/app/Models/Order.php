<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    //

    protected $fillable = [
        'user_id',
        'mobile_no',
        'address',
        'total_amount',
        'status',
    ];

    protected static function boot()
    {
        parent::boot();

        // This runs automatically whenever you do Order::create()
        static::creating(function ($order) {
            $order->order_number = self::generateOrderNumber();
        });
    }

    public function items() {
    return $this->hasMany(OrderItem::class);
    }

    public static function generateOrderNumber()
    {
        do {
            // Generate a random 10-digit number (1,000,000,000 to 9,999,999,999)
            $number = random_int(1000000000, 9999999999);
        } while (self::where('order_number', $number)->exists());

        return $number;
    }
}
