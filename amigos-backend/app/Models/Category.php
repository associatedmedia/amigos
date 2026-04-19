<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $table = 'categories';

    protected $fillable = [
        'name',
        'is_active',
        'image_url',
        'print_assign',
        'sort_order',
        'is_upsell_enabled',
        'upsell_product_ids'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_upsell_enabled' => 'boolean',
        'upsell_product_ids' => 'array',
        'sort_order' => 'integer'
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