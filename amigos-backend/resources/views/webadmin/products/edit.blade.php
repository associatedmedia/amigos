@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Edit Product #{{ $product->id }}</h1>
    <a href="{{ route('admin.products.index') }}" class="btn btn-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Products</a>
</div>

<div class="card shadow-sm border-0">
    <div class="card-body">
        <form action="{{ route('admin.products.update', $product->id) }}" method="POST" enctype="multipart/form-data">
            @csrf
            @method('PUT')
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Name</label>
                    <input type="text" name="name" class="form-control" value="{{ old('name', $product->name) }}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Price (₹)</label>
                    <input type="number" step="0.01" name="price" class="form-control" value="{{ old('price', $product->price) }}" required>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Category</label>
                    <input type="text" name="category" class="form-control" value="{{ old('category', $product->category) }}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Old Database Code (Optional)</label>
                    <input type="text" name="old_db_code" class="form-control" value="{{ old('old_db_code', $product->old_db_code) }}">
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label fw-bold">Description</label>
                <textarea name="description" class="form-control" rows="3">{{ old('description', $product->description) }}</textarea>
            </div>

            <div class="row mb-4">
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Image URL (Optional)</label>
                    <input type="url" name="image_url" class="form-control" placeholder="E.g., https://example.com/image.jpg" value="{{ old('image_url', str_starts_with($product->image_url ?? '', 'http') ? $product->image_url : '') }}">
                    <small class="text-muted">Takes priority. Leave blank to upload a file.</small>
                </div>

                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Upload Local Image</label>
                    <input type="file" name="image" class="form-control" accept="image/*">
                    @if($product->image_url)
                        <div class="mt-2">
                            <span class="text-muted small">Current Image:</span><br>
                            <img src="{{ str_starts_with($product->image_url, 'http') ? $product->image_url : asset($product->image_url) }}" style="height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;">
                        </div>
                    @endif
                </div>
                
                <div class="col-md-4 mb-3 d-flex align-items-end pb-2">
                    <div class="form-check form-switch fs-5">
                        <input class="form-check-input" type="checkbox" role="switch" name="is_veg" id="isVegSwitch" value="1" {{ old('is_veg', $product->is_veg) ? 'checked' : '' }}>
                        <label class="form-check-label ms-2 mt-1 fs-6" for="isVegSwitch">Is Veg?</label>
                    </div>
                </div>

                <div class="col-md-4 mb-3 d-flex align-items-end pb-2">
                    <div class="form-check form-switch fs-5">
                        <input class="form-check-input" type="checkbox" role="switch" name="is_available" id="isAvailableSwitch" value="1" {{ old('is_available', $product->is_available) ? 'checked' : '' }}>
                        <label class="form-check-label ms-2 mt-1 fs-6" for="isAvailableSwitch">Currently Available</label>
                    </div>
                </div>
            </div>

            <button type="submit" class="btn btn-primary"><i class="bi bi-save"></i> Update Product</button>
        </form>
    </div>
</div>
@endsection
