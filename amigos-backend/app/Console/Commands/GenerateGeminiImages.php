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
            
            // Strategy A: Pollinations (Standard with Curl)
            if (!$success) {
                $this->info("      🌍 Attempt 1: Pollinations (Standard)...");
                $encodedPrompt = urlencode($creativePrompt);
                $url = "https://image.pollinations.ai/prompt/{$encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&seed=" . rand(1, 9999);
                $success = $this->downloadWithCurl($url, $fullPath);
            }

            // Strategy B: Pollinations (Redirect with Wget - often handles Cloudflare differently)
            if (!$success) {
                $this->info("      🌍 Attempt 2: Pollinations (Wget Fallback)...");
                $encodedPrompt = urlencode($creativePrompt);
                $url = "https://pollinations.ai/p/{$encodedPrompt}?width=1024&height=1024&seed=" . rand(1, 9999);
                $success = $this->downloadWithWget($url, $fullPath);
            }

            if ($success && file_exists($fullPath) && filesize($fullPath) > 1000) {
                 $this->info("      ✅ Image Saved! (" . round(filesize($fullPath)/1024) . " KB)");
                 
                 $dbPath = 'storage/' . $filename; 
                 $model->image_url = $dbPath;
                 $model->save();
                 $this->info("      🔗 Linked to DB: $dbPath");
            } else {
                 $this->error("      ❌ Failed to generate AI image. Skipping...");
            }

        } catch (\Exception $e) {
            $this->error("      ❌ Exception: " . $e->getMessage());
        }
    }

    private function downloadWithCurl($url, $path)
    {
        // Random Sleep to avoid rate limits
        usleep(rand(500000, 1000000));

        $cmd = "curl -L -s ";
        $cmd .= "-A 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' ";
        $cmd .= "-H 'Referer: https://pollinations.ai/' ";
        $cmd .= "'$url' -o '$path' --max-time 120";

        exec($cmd, $output, $returnCode);

        if ($returnCode === 0 && file_exists($path) && filesize($path) > 2000) {
            return true;
        }
        if (file_exists($path)) unlink($path);
        return false;
    }

    private function downloadWithWget($url, $path)
    {
        // Wget user agent
        $ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        
        $cmd = "wget -q --header='User-Agent: $ua' --header='Referer: https://pollinations.ai/' '$url' -O '$path' --timeout=120";
        
        exec($cmd, $output, $returnCode);

        if ($returnCode === 0 && file_exists($path) && filesize($path) > 2000) {
            return true;
        }
        if (file_exists($path)) unlink($path);
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