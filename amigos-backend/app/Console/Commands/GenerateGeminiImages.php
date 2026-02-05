<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GenerateGeminiImages extends Command
{
    protected $signature = 'images:gemini-bulk';
    protected $description = 'Generate images using Google Gemini (Imagen 3) and update DB';

    public function handle()
    {
        // 1. Locate CSV
        $path = storage_path('app/category_image_prompts.csv');
        if (!file_exists($path)) {
            $this->error("❌ CSV missing! Upload 'category_image_prompts.csv' to 'storage/app/'.");
            return;
        }

        $apiKey = env('GOOGLE_API_KEY');
        if (!$apiKey) {
            $this->error("❌ GOOGLE_API_KEY missing in .env");
            return;
        }

        $file = fopen($path, 'r');
        fgetcsv($file); // Skip header

        $this->info("🚀 Starting Gemini Image Generation...");

        while (($row = fgetcsv($file)) !== false) {
            // CSV: [0] -> Category Group, [1] -> Subject, [2] -> Full_Prompt
            $subject = strtolower($row[1]);
            $prompt = $row[2];

            $this->info("\n🎨 Generating: " . substr($subject, 0, 30) . "...");

            try {
                // --- A. CALL GEMINI API (Imagen 3) ---
                // Note: If 'imagen-3.0-generate-001' fails, try 'image-generation-001'
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
                    $this->error("   ❌ API Error: " . $response->body());
                    continue; 
                }

                $data = $response->json();

                if (!isset($data['predictions'][0]['bytesBase64Encoded'])) {
                    $this->error("   ⚠️ No image data in response.");
                    continue;
                }

                $image_data = base64_decode($data['predictions'][0]['bytesBase64Encoded']);

                // --- B. SAVE IMAGE ---
                $filename = 'categories/' . Str::slug(substr($subject, 0, 30)) . '-' . time() . '.png';
                Storage::disk('public')->put($filename, $image_data);
                $publicUrl = '/storage/' . $filename;
                
                $this->info("   ✅ Saved: $publicUrl");

                // --- C. UPDATE DATABASE ---
                $this->linkToDatabase($subject, $publicUrl);

            } catch (\Exception $e) {
                $this->error("   ❌ Exception: " . $e->getMessage());
            }
        }
        fclose($file);
    }

    private function linkToDatabase($subject, $url)
    {
        // Simple keyword matching to update bulk products
        $categories = [
            ['pizza', '%PIZZA%'],
            ['pasta', '%PASTA%'],
            ['burger', '%BURGER%'],
            ['sandwich', '%SANDWICH%'],
            ['biryani', '%BIRYANI%'],
            ['rice', '%RICE%'],
            ['chicken', '%CHICKEN%'], // Generic fallback
            ['noodles', '%CHINESE%'],
            ['coffee', '%BEVERAGE%'],
            ['shake', '%SHAKE%'],
            ['dessert', '%DESSERT%']
        ];

        foreach ($categories as $cat) {
            if (Str::contains($subject, $cat[0])) {
                $affected = DB::table('products')
                    ->where('category', 'LIKE', $cat[1])
                    ->whereNull('image_url') // Only update empty ones
                    ->update(['image_url' => $url]);
                
                if ($affected > 0) $this->info("   🔗 Linked to $affected products.");
                break; // Stop after first match
            }
        }
    }
}