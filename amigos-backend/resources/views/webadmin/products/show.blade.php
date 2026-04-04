@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Product Details</h1>
    <a href="{{ route('admin.products.index') }}" class="btn btn-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Products</a>
</div>

<div class="row">
    <div class="col-md-4 mb-4">
        <div class="card shadow-sm border-0">
            @if($product->image_url)
                <img src="{{ $product->image_url }}" class="card-img-top" alt="{{ $product->name }}" style="max-height: 400px; object-fit: cover;">
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
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="text-muted">Special:</span>
                        <span class="badge bg-warning text-dark"><i class="bi bi-star-fill"></i> Best Seller</span>
                    </div>
                @endif
            </div>
        </div>
    </div>

    <div class="col-md-8 mb-4">
        <div class="card shadow-sm border-0 h-100">
            <div class="card-header bg-white fw-bold">Varieties / Options</div>
            <div class="card-body">
                @if($product->varieties)
                    @php $varieties = is_string($product->varieties) ? json_decode($product->varieties, true) : $product->varieties; @endphp
                    @if(is_array($varieties) && count($varieties) > 0)
                        <table class="table table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th>Variety Name</th>
                                    <th class="text-end">Additional Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($varieties as $variety)
                                    <tr>
                                        <td>{{ $variety['name'] ?? 'Option' }}</td>
                                        <td class="text-end">₹{{ number_format($variety['price'] ?? 0, 2) }}</td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    @else
                        <p class="text-muted text-center py-4">No varieties recorded for this product.</p>
                    @endif
                @else
                    <p class="text-muted text-center py-4">No varieties recorded for this product.</p>
                @endif
            </div>
        </div>
    </div>
</div>
@endsection
