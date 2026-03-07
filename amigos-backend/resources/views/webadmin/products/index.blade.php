@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Products</h1>
</div>

<div class="table-responsive bg-white p-3 rounded shadow-sm border">
    <table class="table table-hover align-middle">
        <thead class="table-light">
            <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Type</th>
                <th>Status</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
            @forelse($products as $product)
                <tr>
                    <td>{{ $product->id }}</td>
                    <td>
                        @if($product->image_url)
                            <img src="{{ $product->image_url }}" alt="{{ $product->name }}" class="img-thumbnail" style="width: 50px; height: 50px; object-fit: cover;">
                        @else
                            <div class="bg-light text-muted d-flex align-items-center justify-content-center border rounded" style="width: 50px; height: 50px;">
                                <i class="bi bi-image"></i>
                            </div>
                        @endif
                    </td>
                    <td><strong>{{ $product->name }}</strong></td>
                    <td>{{ $product->category ? $product->category->name : 'Uncategorized' }}</td>
                    <td>₹{{ number_format($product->price, 2) }}</td>
                    <td>
                        <span class="badge bg-{{ $product->type === 'veg' ? 'success' : 'danger' }}">
                            {{ strtoupper($product->type) }}
                        </span>
                    </td>
                    <td>
                         <span class="badge bg-{{ $product->is_available ? 'primary' : 'secondary' }}">
                            {{ $product->is_available ? 'Available' : 'Unavailable' }}
                        </span>
                    </td>
                    <td>
                        <a href="{{ route('admin.products.show', $product->id) }}" class="btn btn-sm btn-outline-primary">View</a>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" class="text-center text-muted py-4">No products available.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</div>

<div class="mt-4">
    {{ $products->links('pagination::bootstrap-5') }}
</div>
@endsection
