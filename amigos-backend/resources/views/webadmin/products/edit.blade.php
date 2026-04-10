@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Edit Product #{{ $product->id }}</h1>
    <a href="{{ route('admin.products.index') }}" class="btn btn-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Products</a>
</div>

<div class="card shadow-sm border-0 mb-4">
    <div class="card-body">
        <form action="{{ route('admin.products.update', $product->id) }}" method="POST" enctype="multipart/form-data">
            @csrf
            @method('PUT')
            
            <div class="row">
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Name</label>
                    <input type="text" name="name" class="form-control" value="{{ old('name', $product->name) }}" required>
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Base Price (₹)</label>
                    <input type="number" step="0.01" name="price" class="form-control" value="{{ old('price', $product->price) }}" required>
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Takeaway Price (₹) <span class="text-muted fw-normal">(Optional)</span></label>
                    <input type="number" step="0.01" name="takeaway_price" class="form-control" value="{{ old('takeaway_price', $product->takeaway_price) }}">
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Category</label>
                    <select name="category" class="form-select">
                        <option value="">-- Select Category --</option>
                        @if(isset($categories))
                            @php
                                $categoryExists = false;
                                foreach($categories as $cat) {
                                    if(old('category', $product->category) == $cat->name) {
                                        $categoryExists = true;
                                        break;
                                    }
                                }
                            @endphp

                            @foreach($categories as $categoryOption)
                                <option value="{{ $categoryOption->name }}" {{ old('category', $product->category) == $categoryOption->name ? 'selected' : '' }}>
                                    {{ $categoryOption->name }}
                                </option>
                            @endforeach

                            @if(!$categoryExists && $product->category)
                                <option value="{{ $product->category }}" selected>
                                    {{ $product->category }} (Legacy/Not in List)
                                </option>
                            @endif
                        @endif
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Print Assign (Fallback)</label>
                    <select name="print_assign" class="form-select">
                        <option value="">-- Match via Category --</option>
                        @if(isset($printers))
                            @foreach($printers as $printer)
                                <option value="{{ $printer->operation_type }}" {{ old('print_assign', $product->print_assign) == $printer->operation_type ? 'selected' : '' }}>
                                    {{ $printer->operation_type }} @if($printer->printer_model) ({{ $printer->printer_model }}) @endif
                                </option>
                            @endforeach
                        @endif
                    </select>
                </div>
            </div>

            <div class="row">
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Old Database Code (Optional)</label>
                    <input type="text" name="old_db_code" class="form-control" value="{{ old('old_db_code', $product->old_db_code) }}">
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">GST Code / Name</label>
                    <input type="text" name="gst" class="form-control" placeholder="E.g., GST 5%" value="{{ old('gst', $product->gst) }}">
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Tax Percentage (%)</label>
                    <input type="number" step="0.01" name="tax_percentage" class="form-control" value="{{ old('tax_percentage', $product->tax_percentage ?? 0) }}">
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label fw-bold">Description</label>
                <textarea name="description" class="form-control" rows="3">{{ old('description', $product->description) }}</textarea>
            </div>

            <div class="row mb-4">
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Product Image</label>
                    <input type="file" name="image" class="form-control" accept="image/jpeg,image/webp">
                    <div class="form-text">Recommended Size: 600 x 600 px (1:1 Square), JPG / WebP</div>
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

                <div class="col-md-4 mb-3 d-flex align-items-end pb-2">
                    <div class="form-check form-switch fs-5">
                        <input class="form-check-input" type="checkbox" role="switch" name="is_best_seller" id="isBestSellerSwitch" value="1" {{ old('is_best_seller', $product->is_best_seller) ? 'checked' : '' }}>
                        <label class="form-check-label ms-2 mt-1 fs-6" for="isBestSellerSwitch">Mark as Best Seller</label>
                    </div>
                </div>

                <div class="col-md-4 mb-3 d-flex align-items-end pb-2">
                    <div class="form-check form-switch fs-5">
                        <input class="form-check-input" type="checkbox" role="switch" name="is_upsell" id="isUpsellSwitch" value="1" {{ old('is_upsell', $product->is_upsell) ? 'checked' : '' }}>
                        <label class="form-check-label ms-2 mt-1 fs-6" for="isUpsellSwitch">Show in Upsell?</label>
                    </div>
                </div>
            </div>

            <div class="card shadow-sm mb-4 border-primary">
                <div class="card-header bg-primary text-white fw-bold d-flex justify-content-between align-items-center">
                    <span>Product Variants / Sizes (Optional)</span>
                    <button type="button" class="btn btn-sm btn-light" id="addVariantBtn">
                        <i class="bi bi-plus-circle"></i> Add Size
                    </button>
                </div>
                <div class="card-body p-0">
                    <table class="table mb-0" id="variantsTable">
                        <thead class="table-light">
                            <tr>
                                <th>Variant Name (e.g., M, L, XL)</th>
                                <th>Price (₹)</th>
                                <th style="width: 80px;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            @php $vIndex = 0; @endphp
                            @foreach($product->variants as $variant)
                            <tr class="variant-row">
                                <td>
                                    <input type="hidden" name="variants[{{$vIndex}}][id]" value="{{ $variant->id }}">
                                    <input type="text" name="variants[{{$vIndex}}][variant_name]" class="form-control text-uppercase" value="{{ $variant->variant_name }}" required>
                                </td>
                                <td>
                                    <input type="number" step="0.01" name="variants[{{$vIndex}}][price]" class="form-control" value="{{ $variant->price }}" required>
                                </td>
                                <td>
                                    <button type="button" class="btn btn-danger remove-variant"><i class="bi bi-trash"></i></button>
                                </td>
                            </tr>
                            @php $vIndex++; @endphp
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>

            <button type="submit" class="btn btn-primary btn-lg"><i class="bi bi-save"></i> Update Product</button>
        </form>
    </div>
</div>
@endsection

@push('scripts')
<script>
    $(document).ready(function() {
        // Start the index right after the existing variants
        let variantIndex = {{ $product->variants->count() }};

        // Add new row
        $('#addVariantBtn').click(function() {
            let html = `
                <tr class="variant-row">
                    <td>
                        <input type="hidden" name="variants[${variantIndex}][id]" value="">
                        <input type="text" name="variants[${variantIndex}][variant_name]" class="form-control text-uppercase" placeholder="e.g. M, L, XL, REGULAR" required>
                    </td>
                    <td>
                        <input type="number" step="0.01" name="variants[${variantIndex}][price]" class="form-control" placeholder="Price" required>
                    </td>
                    <td>
                        <button type="button" class="btn btn-danger remove-variant"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
            $('#variantsTable tbody').append(html);
            variantIndex++;
        });

        // Remove row
        $(document).on('click', '.remove-variant', function() {
            // When user clicks the red trash can, we just remove the row from the HTML.
            // Because its ID won't be sent in the array during form submit, 
            // the ProductController will automatically detect it's missing and delete it from the database!
            $(this).closest('tr').remove();
        });
    });
</script>
@endpush