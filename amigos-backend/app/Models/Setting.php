<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['is_online'];

    protected $casts = [
        'is_online' => 'boolean',
    ];
}
