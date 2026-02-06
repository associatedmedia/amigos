<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $table = 'categories';

    // Allow these fields to be mass-assigned
    protected $fillable = [
        'name', 
        'image_url', // If you add category icons later
        'is_active'
    ];

    /**
     * MAGIC ACCESSOR: Fix Image URLs automatically
     * usage: $category->image_url
     */
    public function getImageUrlAttribute($value)
    {
        // 1. If no image, return null or a default placeholder
        if (!$value) {
            return null; // Or return asset('images/default_category.png');
        }

        // 2. If it's already a full link (http...), return it
        if (str_starts_with($value, 'http')) {
            return $value;
        }

        // 3. Otherwise, add the domain name
        return asset($value);
    }
}