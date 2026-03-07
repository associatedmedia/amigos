@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Categories</h1>
</div>

<div class="row">
    @forelse($categories as $category)
        <div class="col-md-3 mb-4">
            <div class="card shadow-sm border-0 h-100">
                @if(isset($category->image_url) && $category->image_url)
                    <img src="{{ $category->image_url }}" class="card-img-top" alt="{{ $category->name }}" style="height: 150px; object-fit: cover;">
                @else
                    <div class="bg-light text-muted d-flex align-items-center justify-content-center card-img-top" style="height: 150px;">
                        <i class="bi bi-tags display-4"></i>
                    </div>
                @endif
                <div class="card-body text-center">
                    <h5 class="card-title fw-bold mb-0">{{ $category->name }}</h5>
                    <p class="text-muted small mt-2">ID: {{ $category->id }}</p>
                </div>
            </div>
        </div>
    @empty
        <div class="col-12 py-5 text-center text-muted">
            <i class="bi bi-inbox display-1"></i>
            <p class="mt-3">No categories available.</p>
        </div>
    @endforelse
</div>

<div class="mt-4">
    {{ $categories->links('pagination::bootstrap-5') }}
</div>
@endsection
