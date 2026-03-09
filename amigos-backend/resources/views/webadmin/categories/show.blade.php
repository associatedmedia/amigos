@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Category Details</h1>
    <a href="{{ route('admin.categories.index') }}" class="btn btn-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Categories</a>
</div>

<div class="row">
    <div class="col-md-6 mb-4">
        <div class="card shadow-sm border-0">
            @if($category->image_url)
                <img src="{{ str_starts_with($category->image_url, 'http') ? $category->image_url : asset($category->image_url) }}" class="card-img-top" alt="{{ $category->name }}" style="max-height: 400px; object-fit: cover;">
            @else
                <div class="bg-light text-muted d-flex flex-column align-items-center justify-content-center p-5 card-img-top" style="height: 300px;">
                    <i class="bi bi-image display-1"></i>
                    <p>No Image Available</p>
                </div>
            @endif
            <div class="card-body">
                <h5 class="card-title fw-bold">{{ $category->name }}</h5>
            </div>
            <div class="card-footer bg-white border-top-0 pb-3">
                 <a href="{{ route('admin.categories.edit', $category->id) }}" class="btn btn-primary w-100"><i class="bi bi-pencil"></i> Edit Category</a>
            </div>
        </div>
    </div>
</div>
@endsection
