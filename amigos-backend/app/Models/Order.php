<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'driver_id', // Make sure this is added if you ran the migration
        'mobile_no',
        'address',
        'latitude',
        'longitude',
        'total_amount',
        'status'
    ];

    // ✅ THIS WAS MISSING
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Optional: If you want to grab driver details too
    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }
}