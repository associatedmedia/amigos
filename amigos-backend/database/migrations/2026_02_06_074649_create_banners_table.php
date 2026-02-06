<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
       Schema::create('banners', function (Blueprint $table) {
        $table->id();
        $table->string('image_url'); // Path or Full URL
        $table->string('title');
        $table->string('subtitle')->nullable();
        $table->string('target_screen')->default('CategoryDetail'); // Where to go on click
        $table->json('target_params')->nullable(); // JSON data (e.g. { categoryId: 1 })
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('banners');
    }
};
