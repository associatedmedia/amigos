<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\Category;
use App\Models\Product;

class GenerateGeminiImages extends Command
{
    // Updated signature to run for all items or force regen
    protected $signature = 'images:generate-all {--force : Force regenerate images even if they exist}';
    protected $description = 'Generate images for Categories and Products using Gemini (Imagen 3) and update DB';

    public function handle()
    {
        $apiKey = env('GOOGLE_API_KEY');
        if (!$apiKey) {
            $this->error("❌ GOOGLE_API_KEY missing in .env");
            return;
        }

        $force = $this->option('force');

        // --- 1. PROCESS CATEGORIES ---
        $this->info("🚀 Starting Category Image Generation...");
        $categories = Category::all();

        foreach ($categories as $category) {
            // Skip if image exists and not forcing
            if ($category->image_url && !$force && !Str::contains($category->image_url, 'placehold.co')) {
                $this->info("   Skipping {$category->name} (Image exists)");
                continue;
            }

            $prompt = "Professional 3D icon or high-quality food photography of {$category->name}, isolated on white background, appetizing, 4k resolution, minimalist style.";
            $folder = 'categories';
            
            $this->generateAndSave($category, $prompt, $folder, $apiKey);
        }

        // --- 2. PROCESS PRODUCTS ---
        $this->info("\n🚀 Starting Product Image Generation...");
        $products = Product::all();

        foreach ($products as $product) {
            // Skip if image exists and not forcing
            if ($product->image_url && !$force && !Str::contains($product->image_url, 'placehold.co')) {
                $this->info("   Skipping {$product->name} (Image exists)");
                continue;
            }

            // Construct a rich prompt
            $description = $product->description ?: "Delicious {$product->name}";
            $prompt = "Professional food photography of {$product->name}. {$description}. High resolution, appetizing, studio lighting, depth of field, 4k, delicious presentation.";
            $folder = 'products';

            $this->generateAndSave($product, $prompt, $folder, $apiKey);
        }

        $this->info("\n✅ All operations completed!");
    }

    private function generateAndSave($model, $prompt, $folder, $apiKey)
    {
        $this->info("   🎨 Fetching for: {$model->name}...");

        try {
            // Using LoremFlickr for real food photography (Reliable, No Key, No Blocking)
            // URL: https://loremflickr.com/800/800/{keyword}
            
            // Clean the name to get a good keyword (e.g. "Special Chicken Pizza" -> "Pizza")
            $keyword = $this->extractKeyword($model->name);
            $url = "https://loremflickr.com/800/800/" . urlencode($keyword);

            $this->info("      🌍 Fetching from LoremFlickr ({$keyword})...");
            
            // Add User-Agent just in case
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            ])->timeout(60)->get($url);

            if ($response->failed()) {
                $this->error("      ❌ API Error: " . $response->status());
                return;
            }

            $imageData = $response->body();

            // Save to Public Storage
            $filename = $folder . '/' . Str::slug($model->name) . '-' . time() . '.jpg';
            
            Storage::disk('public')->put($filename, $imageData);

            $dbPath = 'storage/' . $filename; 

            // Update Database
            $model->image_url = $dbPath;
            $model->save();

            $this->info("      ✅ Saved & Linked: $dbPath");

        } catch (\Exception $e) {
            $this->error("      ❌ Exception: " . $e->getMessage());
        }
    }

    private function extractKeyword($name)
    {
        // Simple heuristic to get the main food item
        $name = strtolower($name);
        if (Str::contains($name, 'pizza')) return 'pizza';
        if (Str::contains($name, 'burger')) return 'burger';
        if (Str::contains($name, 'pasta')) return 'pasta';
        if (Str::contains($name, 'salad')) return 'salad';
        if (Str::contains($name, 'chicken')) return 'fried chicken';
        if (Str::contains($name, 'cake')) return 'cake';
        if (Str::contains($name, 'coffee')) return 'coffee';
        if (Str::contains($name, 'shake')) return 'milkshake';
        if (Str::contains($name, 'biryani')) return 'biryani';
        
        // Fallback: Use the first word or the whole name
        return explode(' ', $name)[0];
    }
}