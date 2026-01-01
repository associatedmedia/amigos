<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VerificationCode extends Model
{
    use HasFactory;

    // Add this line below
    protected $fillable = [
        'mobile_no',
        'otp',
        'expire_at',
    ];
}