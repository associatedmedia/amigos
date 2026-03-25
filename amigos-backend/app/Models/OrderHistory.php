<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderHistory extends Model
{
    use HasFactory;

    protected $guarded = [];

    /**
     * Get the order that owns the history.
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the user who triggered the action.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
