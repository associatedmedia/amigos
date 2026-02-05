<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SmartLinkImages extends Command
{
    protected $signature = 'images:smart-link';
    protected $description = 'Link uploaded images to products based on category names';

    public function handle()
    {
        $this->info("🚀 Starting Smart Image Linker...");

        // 1. Get all images from 'storage/app/public/categories'
        $files = Storage::disk('public')->files('categories');
        
        if (empty($files)) {
            $this->error("❌ No images found in 'public/categories'. Please upload some first!");
            $this->info("   👉 Folder: storage/app/public/categories/");
            return;
        }

        $this->info("Found " . count($files) . " images. Linking them now...\n");

        foreach ($files as $file) {
            // "categories/pizza.png" -> "pizza"
            $filename = basename($file);
            $keyword = pathinfo($filename, PATHINFO_FILENAME); 
            // $publicUrl = '/storage/' . $file;
            // Uses APP_URL from .env to create full link
            $publicUrl = config('app.url') . '/storage/' . $filename;

            // 2. Define Keywords to match (e.g., 'pizza' matches 'VEG PIZZA', 'PIZZA MANIA')
            // You can rename your files to match these keys broadly
            
            $affected = 0;

            // SPECIAL LOGIC: Match filename keyword to Product Category
            // If file is "indian.png", it updates matches for 'INDIAN', 'MUGLAI', 'TANDOOR'
            if ($keyword == 'indian') {
                $affected = $this->updateDB(['INDIAN', 'MUGLAI', 'TANDOOR', 'KANTI', 'CURRY'], $publicUrl);
            } 
            elseif ($keyword == 'chinese') {
                $affected = $this->updateDB(['CHINESE', 'NOODLE', 'MANCHURIAN', 'MOMO'], $publicUrl);
            }
            elseif ($keyword == 'fastfood') {
                $affected = $this->updateDB(['BURGER', 'SANDWICH', 'WRAP', 'ROLL', 'FRIES', 'KFC'], $publicUrl);
            }
            elseif ($keyword == 'rice') {
                $affected = $this->updateDB(['RICE', 'BIRYANI'], $publicUrl);
            }
            elseif ($keyword == 'drink') {
                $affected = $this->updateDB(['BEVERAGE', 'MOJITO', 'SHAKE', 'COFFEE', 'JUICE'], $publicUrl);
            }
            else {
                // Default: Match exact filename (e.g., "pizza" matches "PIZZA")
                $affected = $this->updateDB([$keyword], $publicUrl);
            }

            if ($affected > 0) {
                $this->info("✅ Linked '$filename' to $affected products.");
            }
        }
        
        $this->info("\n✨ Done! Your menu is now visual.");
    }

    private function updateDB($keywords, $url)
    {
        $query = DB::table('products')->whereNull('image_url');
        
        $query->where(function($q) use ($keywords) {
            foreach ($keywords as $word) {
                $q->orWhere('category', 'LIKE', "%$word%")
                  ->orWhere('name', 'LIKE', "%$word%");
            }
        });

        return $query->update(['image_url' => $url]);
    }
}