@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Edit Category #{{ $category->id }}</h1>
    <a href="{{ route('admin.categories.index') }}" class="btn btn-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Categories</a>
</div>

<div class="card shadow-sm border-0">
    <div class="card-body">
        <form action="{{ route('admin.categories.update', $category->id) }}" method="POST" enctype="multipart/form-data">
            @csrf
            @method('PUT')
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Name</label>
                    <input type="text" name="name" class="form-control" value="{{ old('name', $category->name) }}" required>
                </div>
                
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Category Image</label>
                    <input type="file" name="image" class="form-control" accept="image/*">
                    @if($category->image_url)
                        <div class="mt-2">
                            <span class="text-muted small">Current Image:</span><br>
                            <img src="{{ str_starts_with($category->image_url, 'http') ? $category->image_url : asset($category->image_url) }}" style="height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;">
                        </div>
                    @endif
                </div>
            </div>

            <div class="mb-4 d-flex align-items-end pb-2">
                <div class="form-check form-switch fs-5">
                    <input class="form-check-input" type="checkbox" role="switch" name="is_active" id="isActiveSwitch" value="1" {{ old('is_active', $category->is_active) ? 'checked' : '' }}>
                    <label class="form-check-label ms-2 mt-1 fs-6" for="isActiveSwitch">Active</label>
                </div>
            </div>

            <button type="submit" class="btn btn-primary"><i class="bi bi-save"></i> Update Category</button>
        </form>
    </div>
</div>
@endsection
