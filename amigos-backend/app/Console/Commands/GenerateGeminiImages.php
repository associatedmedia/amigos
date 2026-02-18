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
        $this->info("   🎨 Processing: {$model->name}...");

        try {
            // STEP 1: Generate a Creative Prompt using Gemini
            $creativePrompt = $this->getGeminiPrompt($model->name, $apiKey);
            $this->info("      ✨ Prompt: \"{$creativePrompt}\"");

            $filename = $folder . '/' . Str::slug($model->name) . '-' . time() . '.jpg';
            $fullPath = storage_path('app/public/' . $filename);
            
            // Ensure directory exists
            $directory = dirname($fullPath);
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            // STEP 2: Try to fetch image (Strategy Pattern)
            $success = false;
            
            // Strategy A: Pollinations (Standard Endpoint)
            if (!$success) {
                $this->info("      🌍 Attempt 1: Pollinations (Standard)...");
                $encodedPrompt = urlencode($creativePrompt);
                $url = "https://image.pollinations.ai/prompt/{$encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&seed=" . rand(1, 9999);
                $success = $this->downloadWithCurl($url, $fullPath);
            }

            // Strategy B: Pollinations (Alternative Endpoint / Simple)
            if (!$success) {
                $this->info("      🌍 Attempt 2: Pollinations (Simple)...");
                // Simplified prompt
                $simplePrompt = urlencode($model->name . " food photography 4k");
                $url = "https://image.pollinations.ai/prompt/{$simplePrompt}?nologo=true";
                $success = $this->downloadWithCurl($url, $fullPath);
            }

            // Strategy C: LoremFlickr (Fallback)
            if (!$success) {
                $this->warn("      ⚠️  All AI failed. Falling back to LoremFlickr...");
                $keyword = $this->extractKeyword($model->name);
                $url = "https://loremflickr.com/800/800/" . urlencode($keyword);
                $success = $this->downloadWithCurl($url, $fullPath);
            }

            if ($success && file_exists($fullPath) && filesize($fullPath) > 1000) {
                 $this->info("      ✅ Image Saved! (" . round(filesize($fullPath)/1024) . " KB)");
                 
                 $dbPath = 'storage/' . $filename; 
                 $model->image_url = $dbPath;
                 $model->save();
                 $this->info("      🔗 Linked to DB: $dbPath");
            } else {
                 $this->error("      ❌ Failed to save a valid image.");
            }

        } catch (\Exception $e) {
            $this->error("      ❌ Exception: " . $e->getMessage());
        }
    }

    private function downloadWithCurl($url, $path)
    {
        // Rotating User Agents
        $agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        ];
        $agent = $agents[array_rand($agents)];

        $cmd = "curl -L -s -D - ";
        $cmd .= "-A '$agent' ";
        $cmd .= "-H 'Referer: https://google.com/' "; // Generic Referer
        $cmd .= "'$url' -o '$path' --max-time 60";

        exec($cmd, $output, $returnCode);

        // Check file size (Pollinations often returns small text error files)
        if ($returnCode === 0 && file_exists($path) && filesize($path) > 2000) {
            return true;
        }
        
        // If failed, delete the partial/error file
        if (file_exists($path)) {
            // Optional: read error content
            // $content = file_get_contents($path);
            unlink($path);
        }
        return false;
    }

    private function getGeminiPrompt($productName, $apiKey)
    {
        // Use Gemini Flash for fast, cheap prompt generation
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}";

        $body = [
            'contents' => [
                'parts' => [
                    ['text' => "Write a short, highly descriptive, appetizing AI image generation prompt for a food item named '{$productName}'. Focus on lighting, texture, and 4k quality. Max 30 words. No introduction."]
                ]
            ]
        ];

        try {
            $response = Http::post($url, $body);
            if ($response->successful()) {
                $data = $response->json();
                return $data['candidates'][0]['content']['parts'][0]['text'] ?? "Delicious {$productName}, professional food photography, 4k";
            }
        } catch (\Exception $e) {
            // Fallback
        }

        return "Delicious {$productName}, cinematic lighting, photorealistic food photography, 8k resolution";
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