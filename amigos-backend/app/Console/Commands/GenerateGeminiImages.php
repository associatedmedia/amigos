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
        $this->info("   🎨 Generating: {$model->name}...");

        try {
            // Call Gemini/Imagen API
            $url = "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key={$apiKey}";

            $response = Http::post($url, [
                'instances' => [
                    ['prompt' => $prompt]
                ],
                'parameters' => [
                    'sampleCount' => 1,
                    'aspectRatio' => '1:1',
                    'outputFormat' => 'image/png'
                ]
            ]);

            if ($response->failed()) {
                $this->error("      ❌ API Error: " . $response->body());
                return;
            }

            $data = $response->json();

            if (!isset($data['predictions'][0]['bytesBase64Encoded'])) {
                $this->error("      ⚠️ No image data returned.");
                return;
            }

            $imageData = base64_decode($data['predictions'][0]['bytesBase64Encoded']);

            // Save to Public Storage
            // Filename: slug-timestamp.png
            $filename = $folder . '/' . Str::slug($model->name) . '-' . time() . '.png';
            
            // Save to 'public' disk (storage/app/public/...)
            Storage::disk('public')->put($filename, $imageData);

            // Access URL (e.g., /storage/products/pizza.png)
            // Note: In DB we save the relative path 'storage/products/pizza.png'
            // or just the filename if your accessor handles 'storage/'.
            // Based on standard Laravel: asset('storage/filename')
            
            $dbPath = 'storage/' . $filename; 

            // Update Database
            $model->image_url = $dbPath;
            $model->save();

            $this->info("      ✅ Saved & Linked: $dbPath");

        } catch (\Exception $e) {
            $this->error("      ❌ Exception: " . $e->getMessage());
        }
    }
}