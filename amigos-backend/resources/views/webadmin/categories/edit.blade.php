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
                    <label class="form-label fw-bold">Print Assign (Fallback)</label>
                    <select name="print_assign" class="form-select">
                        <option value="">-- None / Default --</option>
                        @if(isset($printers))
                            @foreach($printers as $printer)
                                <option value="{{ $printer->operation_type }}" {{ old('print_assign', $category->print_assign) == $printer->operation_type ? 'selected' : '' }}>
                                    {{ $printer->operation_type }} @if($printer->printer_model) ({{ $printer->printer_model }}) @endif
                                </option>
                            @endforeach
                        @endif
                    </select>
                </div>
                
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Sort Order</label>
                    <input type="number" name="sort_order" class="form-control" value="{{ old('sort_order', $category->sort_order) }}">
                    <small class="text-muted">Ascending order (0 is highest Priority). Categories are sorted by this value.</small>
                </div>

                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Category Image URL (Optional)</label>
                    <input type="url" name="image_url" class="form-control" placeholder="https://example.com/image.jpg" value="{{ old('image_url', str_starts_with($category->image_url ?? '', 'http') ? $category->image_url : '') }}">
                    <small class="text-muted">Provide a direct link OR upload a file below.</small>
                </div>

                <div class="col-md-6 mb-4">
                    <label class="form-label fw-bold">Upload Local Image</label>
                    <input type="file" name="image" class="form-control">
                    <div class="form-text">Recommended Size: 300 x 300 px (1:1 Square)</div>
                    @if($category->image_url)
                        <div class="mt-2">
                            <span class="text-muted small">Current Image:</span><br>
                            <img src="{{ str_starts_with($category->image_url, 'http') ? $category->image_url : asset($category->image_url) }}" style="height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;">
                        </div>
                    @endif
                </div>

                <div class="col-md-6 mb-4 d-flex align-items-center">
                    <div class="form-check form-switch fs-5 mt-4">
                        <input class="form-check-input" type="checkbox" role="switch" id="is_active" name="is_active" {{ $category->is_active ? 'checked' : '' }}>
                        <label class="form-check-label fs-6 ms-2" for="is_active">Category is Active</label>
                    </div>
                </div>

                <div class="col-12 mt-3 pt-3 border-top">
                    <h5>Dynamic Upsell Settings</h5>
                    <div class="form-check form-switch fs-5 mb-3">
                        <input class="form-check-input" type="checkbox" role="switch" id="is_upsell_enabled" name="is_upsell_enabled" {{ old('is_upsell_enabled', $category->is_upsell_enabled) ? 'checked' : '' }}>
                        <label class="form-check-label fs-6 ms-2" for="is_upsell_enabled">Enable Upsell for this Category</label>
                    </div>
                    
                    <div class="mb-3" id="upsell_products_container" style="display: none;">
                        <label class="form-label fw-bold">Select Upsell Products</label>
                        @php
                            $saved_upsells = old('upsell_product_ids', $category->upsell_product_ids ?? []);
                            if(!is_array($saved_upsells)) {
                                $saved_upsells = [];
                            }
                        @endphp
                        <select name="upsell_product_ids[]" class="form-select select2" multiple="multiple" style="height: 150px;">
                            @foreach($all_products as $prod)
                                <option value="{{ $prod->id }}" {{ in_array($prod->id, $saved_upsells) ? 'selected' : '' }}>{{ $prod->name }}</option>
                            @endforeach
                        </select>
                        <small class="text-muted">Hold CTRL or CMD to select multiple. These items will be shown to users after adding items from this category.</small>
                    </div>

                    <script>
                        document.addEventListener('DOMContentLoaded', function() {
                            const toggle = document.getElementById('is_upsell_enabled');
                            const container = document.getElementById('upsell_products_container');
                            
                            function updateVisibility() {
                                container.style.display = toggle.checked ? 'block' : 'none';
                            }
                            
                            toggle.addEventListener('change', updateVisibility);
                            updateVisibility();
                        });
                    </script>
                </div>
            </div>

            <button type="submit" class="btn btn-primary"><i class="bi bi-save"></i> Update Category</button>
        </form>
    </div>
</div>
@endsection
