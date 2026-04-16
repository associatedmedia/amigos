<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PushNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'body',
        'status',
        'target_audience',
        'sent_at'
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];
}
