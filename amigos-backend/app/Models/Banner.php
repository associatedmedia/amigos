<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    //
    protected $fillable = ['image', 'title', 'sub', 'target_screen', 'target_params', 'is_active'];

    protected $casts = [
        'target_params' => 'array', // Automatically convert JSON to Array
    ];
}
