<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DriverLocation extends Model
{
    protected $guarded = [];

    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }
}
