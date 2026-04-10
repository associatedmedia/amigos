<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;

class ImportCatalogCsv extends Command
{
    protected $signature = 'import:catalog {filepath}';
    protected $description = 'Import categories, products, and variants from the provided CSV';

    public function handle()
    {
        $filepath = $this->argument('filepath');

        if (!file_exists($filepath)) {
            $this->error("File not found at: {$filepath}");
            return;
        }

        $file = fopen($filepath, 'r');
        $header = fgetcsv($file); // Skip the header row

        DB::beginTransaction();
        try {
            $count = 0;

            while (($row = fgetcsv($file)) !== false) {
                // Map CSV columns based on the provided structure
                $categoryName = trim($row[1]);
                $productName  = trim($row[2]);
                $description  = trim($row[3]);
                $variantName  = strtoupper(trim($row[4]));
                $price        = (float) trim($row[5]);

                if (empty($productName)) {
                    continue; // Skip empty rows
                }

                // 1. Handle Category
                $category = Category::firstOrCreate(
                    ['name' => $categoryName],
                    ['is_active' => 1]
                );

                // 2. Handle Product
                // We use firstOrCreate so we don't duplicate the product when processing its variants
                $product = Product::firstOrCreate(
                    [
                        'name' => $productName,
                        'category_id' => $category->id
                    ],
                    [
                        'category' => $category->name,
                        'description' => empty($description) ? null : $description,
                        'price' => $price, // Default base price (will be updated if a variant is found)
                        'is_available' => 1,
                        'is_veg' => 1, // Defaulting to 1, adjust as needed
                    ]
                );

                // 3. Handle Variants & Takeaway Logic
                if ($variantName === 'TAKEAWAY') {
                    // Update the parent product's takeaway price
                    $product->update(['takeaway_price' => $price]);
                } elseif (!empty($variantName)) {
                    // Create a specific size/type variant
                    ProductVariant::updateOrCreate(
                        [
                            'product_id' => $product->id,
                            'variant_name' => $variantName
                        ],
                        [
                            'price' => $price
                        ]
                    );

                    // Optional: If you want the main product 'price' column to reflect the lowest variant price
                    if ($product->price == 0 || $price < $product->price) {
                        $product->update(['price' => $price]);
                    }
                }

                $count++;
            }

            fclose($file);
            DB::commit();

            $this->info("Successfully processed {$count} rows into the catalog!");

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("Import failed: " . $e->getMessage());
        }
    }
}