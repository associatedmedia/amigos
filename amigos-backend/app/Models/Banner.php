<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    use HasFactory;

    protected $fillable = ['image_url', 'title', 'subtitle', 'target_screen', 'target_params', 'is_active'];

    // Automatically convert JSON string from DB to PHP Array
    protected $casts = [
        'target_params' => 'array',
        'is_active' => 'boolean',
    ];

    // Magic Accessor: Ensure image is always a full URL
    public function getImageUrlAttribute($value)
    {
        if (str_starts_with($value, 'http')) {
            return $value;
        }
        return asset($value);
    }
}