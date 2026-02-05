<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SmartLinkImages extends Command
{
    protected $signature = 'images:smart-link {--force : Overwrite existing images}';
    protected $description = 'Link uploaded images to products based on category names';

    public function handle()
    {
        $this->info("🚀 Starting Smart Image Linker (Force Mode)...");

        // 1. Get all images from 'storage/app/public/categories'
        $files = Storage::disk('public')->files('categories');
        
        if (empty($files)) {
            $this->error("❌ No images found! Please upload images to: storage/app/public/categories/");
            return;
        }

        $this->info("📂 Found " . count($files) . " images. Processing...\n");

        foreach ($files as $file) {
            $filename = basename($file);
            // Convert 'Pizza.png' -> 'pizza' (lowercase for better matching)
            $keyword = strtolower(pathinfo($filename, PATHINFO_FILENAME)); 
            
            // Use APP_URL from .env to build the full link
            $baseUrl = config('app.url');
            // Remove trailing slash if present to avoid double slash
            $baseUrl = rtrim($baseUrl, '/');
            $publicUrl = $baseUrl . '/storage/categories/' . $filename;

            $this->line("🔍 Processing '$filename' (Keyword: $keyword)...");

            $affected = 0;

            // SPECIAL MAPPING LOGIC
            if ($keyword == 'indian' || $keyword == 'curry') {
                $affected = $this->updateDB(['INDIAN', 'MUGLAI', 'TANDOOR', 'KANTI', 'CURRY', 'MAINCOURSE'], $publicUrl);
            } 
            elseif ($keyword == 'chinese' || $keyword == 'noodles') {
                $affected = $this->updateDB(['CHINESE', 'NOODLE', 'MANCHURIAN', 'MOMO', 'SOUPS', 'FRIED RICE'], $publicUrl);
            }
            elseif ($keyword == 'fastfood' || $keyword == 'burger') {
                $affected = $this->updateDB(['BURGER', 'SANDWICH', 'WRAP', 'ROLL', 'FRIES', 'KFC', 'TWISTER'], $publicUrl);
            }
            elseif ($keyword == 'pizza') {
                $affected = $this->updateDB(['PIZZA', 'ITALIAN', 'PASTA', 'ANTIPASTI', 'CALZONE'], $publicUrl);
            }
            elseif ($keyword == 'rice' || $keyword == 'biryani') {
                $affected = $this->updateDB(['RICE', 'BIRYANI'], $publicUrl);
            }
            elseif ($keyword == 'drink' || $keyword == 'beverage') {
                $affected = $this->updateDB(['BEVERAGE', 'MOJITO', 'SHAKE', 'COFFEE', 'JUICE', 'MOCKTAIL'], $publicUrl);
            }
            elseif ($keyword == 'dessert' || $keyword == 'cake') {
                $affected = $this->updateDB(['DESSERT', 'CAKE', 'CONFECTIONERY', 'BROWNIE', 'WAFFLE'], $publicUrl);
            }
            else {
                // Default: Match filename exactly (e.g. 'pasta.png' matches 'PASTA')
                $affected = $this->updateDB([$keyword], $publicUrl);
            }

            if ($affected > 0) {
                $this->info("   ✅ Linked to $affected products.");
            } else {
                $this->warn("   ⚠️ No products matched keyword: $keyword");
            }
        }
        
        $this->info("\n✨ Done! Run 'php artisan config:clear' if URLs look wrong.");
    }

    private function updateDB($keywords, $url)
    {
        $query = DB::table('products');

        // NOTE: removed ->whereNull('image_url') to FORCE update
        
        $query->where(function($q) use ($keywords) {
            foreach ($keywords as $word) {
                $q->orWhere('category', 'LIKE', "%$word%")
                  ->orWhere('name', 'LIKE', "%$word%"); // Also check Name column
            }
        });

        return $query->update(['image_url' => $url]);
    }
}