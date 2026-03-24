@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Add Offer Banner</h1>
    <a href="{{ route('admin.offer-banners.index') }}" class="btn btn-sm btn-secondary">
        <i class="bi bi-arrow-left"></i> Back
    </a>
</div>

<div class="card shadow-sm border-0 w-50">
    <div class="card-body">
        <form action="{{ route('admin.offer-banners.store') }}" method="POST" enctype="multipart/form-data">
            @csrf

            <!-- Name Field -->
            <div class="mb-3">
                <label for="title" class="form-label">Banner Title <span class="text-danger">*</span></label>
                <input type="text" 
                       class="form-control @error('title') is-invalid @enderror" 
                       id="title" 
                       name="title" 
                       value="{{ old('title') }}" 
                       placeholder="e.g. 50% Off Friday">
                @error('title')
                    <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>

            <!-- Alternative Remote Image URL -->
            <div class="mb-3">
                <label for="image_url" class="form-label text-primary">Image URL (Optional Online Source)</label>
                <input type="url" 
                       class="form-control border-primary @error('image_url') is-invalid @enderror" 
                       id="image_url" 
                       name="image_url" 
                       value="{{ old('image_url') }}" 
                       placeholder="https://example.com/banner.jpg">
                <small class="text-muted d-block mt-1">If provided, this remote string natively overrides the image local upload below.</small>
                @error('image_url')
                    <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>

            <!-- Image Upload Field -->
            <div class="mb-3">
                <label for="image" class="form-label">Upload Local Image (Fallback)</label>
                <input type="file" 
                       class="form-control @error('image') is-invalid @enderror" 
                       id="image" 
                       name="image" 
                       accept="image/jpeg,image/webp">
                <div class="form-text">Recommended Size: 800 x 400 px (2:1), JPG / WebP</div>
                @error('image')
                    <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>

            <!-- Active Status Toggle -->
            <div class="mb-4 form-check form-switch p-0">
                <label class="form-check-label ms-3" for="is_active">Active Status</label>
                <input class="form-check-input ms-0 mt-1" type="checkbox" role="switch" id="is_active" name="is_active" checked>
            </div>

            <button type="submit" class="btn btn-primary w-100">
                <i class="bi bi-save"></i> Save Banner
            </button>
        </form>
    </div>
</div>
@endsection
