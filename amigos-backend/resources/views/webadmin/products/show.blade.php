@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Product Details</h1>
    <div class="btn-group">
        <a href="{{ route('admin.products.edit', $product->id) }}" class="btn btn-sm btn-primary"><i class="bi bi-pencil"></i> Edit Product</a>
        <a href="{{ route('admin.products.index') }}" class="btn btn-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Products</a>
    </div>
</div>

<div class="row">
    <div class="col-md-4 mb-4">
        <div class="card shadow-sm border-0">
            @if($product->image_url)
                <img src="{{ str_starts_with($product->image_url, 'http') ? $product->image_url : asset($product->image_url) }}" class="card-img-top" alt="{{ $product->name }}" style="max-height: 400px; object-fit: cover;">
            @else
                <div class="bg-light text-muted d-flex flex-column align-items-center justify-content-center p-5 card-img-top" style="height: 300px;">
                    <i class="bi bi-image display-1"></i>
                    <p>No Image Available</p>
                </div>
            @endif
            <div class="card-body">
                <h5 class="card-title fw-bold">{{ $product->name }}</h5>
                <p class="card-text text-muted">{{ $product->description ?? 'No description provided.' }}</p>
                
                <hr>

                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="text-muted">Base Price:</span>
                    <span class="fw-bold fs-5">₹{{ number_format($product->price, 2) }}</span>
                </div>

                @if($product->takeaway_price > 0)
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="text-muted">Takeaway Price:</span>
                    <span class="fw-bold fs-6 text-info">₹{{ number_format($product->takeaway_price, 2) }}</span>
                </div>
                @endif
                
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="text-muted">Type:</span>
                    <span class="badge bg-{{ $product->is_veg ? 'success' : 'danger' }}">{{ $product->is_veg ? 'VEG' : 'NON-VEG' }}</span>
                </div>

                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="text-muted">Category:</span>
                    <span class="badge bg-secondary">{{ $product->category ? $product->category : 'Uncategorized' }}</span>
                </div>

                 <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="text-muted">Status:</span>
                    <span class="badge bg-{{ $product->is_available ? 'primary' : 'secondary' }}">{{ $product->is_available ? 'Available' : 'Unavailable' }}</span>
                </div>

                @if($product->is_best_seller)
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <span class="text-muted">Special:</span>
                        <span class="badge bg-warning text-dark"><i class="bi bi-star-fill"></i> Best Seller</span>
                    </div>
                @endif
                @if($product->is_upsell)
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <span class="text-muted">Upsell:</span>
                        <span class="badge bg-info text-dark"><i class="bi bi-bag-plus-fill"></i> Active</span>
                    </div>
                @endif
            </div>
        </div>
    </div>

    <div class="col-md-8 mb-4">
        <div class="card shadow-sm border-0 h-100">
            <div class="card-header bg-white fw-bold d-flex justify-content-between align-items-center py-3">
                <span>Product Variants (Sizes / Options)</span>
                <span class="badge bg-primary rounded-pill">{{ $product->variants->count() }}</span>
            </div>
            <div class="card-body p-0">
                @if($product->variants && $product->variants->count() > 0)
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th class="ps-4">Variant Name</th>
                                <th class="text-end pe-4">Price (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($product->variants as $variant)
                                <tr>
                                    <td class="ps-4 fw-bold text-uppercase">{{ $variant->variant_name }}</td>
                                    <td class="text-end pe-4">₹{{ number_format($variant->price, 2) }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @else
                    <div class="d-flex flex-column align-items-center justify-content-center text-muted" style="height: 250px;">
                        <i class="bi bi-tags display-4 mb-3 text-light"></i>
                        <p>No variants (sizes) attached to this product.</p>
                        <a href="{{ route('admin.products.edit', $product->id) }}" class="btn btn-sm btn-outline-primary mt-2">Add Variants</a>
                    </div>
                @endif
            </div>
        </div>
    </div>
</div>
@endsection