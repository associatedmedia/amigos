@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Add Product</h1>
    <a href="{{ route('admin.products.index') }}" class="btn btn-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Products</a>
</div>

<div class="card shadow-sm border-0 mb-4">
    <div class="card-body">
        <form action="{{ route('admin.products.store') }}" method="POST" enctype="multipart/form-data">
            @csrf
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Name</label>
                    <input type="text" name="name" class="form-control" placeholder="E.g., Margherita Pizza" value="{{ old('name') }}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Base Price (₹)</label>
                    <input type="number" step="0.01" name="price" class="form-control" placeholder="0.00" value="{{ old('price') }}" required>
                    <small class="text-muted">Default price if no sizes are selected.</small>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Category</label>
                    <select name="category" class="form-select">
                        <option value="">-- Select Category --</option>
                        @if(isset($categories))
                            @foreach($categories as $categoryOption)
                                <option value="{{ $categoryOption->name }}" {{ old('category') == $categoryOption->name ? 'selected' : '' }}>
                                    {{ $categoryOption->name }}
                                </option>
                            @endforeach
                        @endif
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Print Assign (Fallback)</label>
                    <select name="print_assign" class="form-select">
                        <option value="">-- Match via Category --</option>
                        @if(isset($printers))
                            @foreach($printers as $printer)
                                <option value="{{ $printer->operation_type }}" {{ old('print_assign') == $printer->operation_type ? 'selected' : '' }}>
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
                    <input type="text" name="old_db_code" class="form-control" placeholder="E.g., P01" value="{{ old('old_db_code') }}">
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">GST Code / Name</label>
                    <input type="text" name="gst" class="form-control" placeholder="E.g., GST 5%" value="{{ old('gst') }}">
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Tax Percentage (%)</label>
                    <input type="number" step="0.01" name="tax_percentage" class="form-control" placeholder="0.00" value="{{ old('tax_percentage', 0) }}">
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label fw-bold">Description</label>
                <textarea name="description" class="form-control" rows="3" placeholder="Brief description of the product">{{ old('description') }}</textarea>
            </div>

            <div class="row mb-4">
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Image URL (Optional)</label>
                    <input type="url" name="image_url" class="form-control" placeholder="E.g., https://example.com/image.jpg" value="{{ old('image_url') }}">
                    <small class="text-muted">Takes priority. Leave blank to upload a file.</small>
                </div>

                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Upload Local Image</label>
                    <input type="file" name="image" class="form-control" accept="image/jpeg,image/webp,image/png">
                    <div class="form-text">Recommended Size: 600 x 600 px (1:1 Square)</div>
                </div>
                
                <div class="col-md-4 mb-3 d-flex align-items-end pb-2">
                    <div class="form-check form-switch fs-5">
                        <input class="form-check-input" type="checkbox" role="switch" name="is_veg" id="isVegSwitch" value="1" {{ old('is_veg') ? 'checked' : '' }}>
                        <label class="form-check-label ms-2 mt-1 fs-6" for="isVegSwitch">Is Veg?</label>
                    </div>
                </div>

                <div class="col-md-4 mb-3 d-flex align-items-end pb-2">
                    <div class="form-check form-switch fs-5">
                        <input class="form-check-input" type="checkbox" role="switch" name="is_available" id="isAvailableSwitch" value="1" {{ old('is_available', 1) ? 'checked' : '' }}>
                        <label class="form-check-label ms-2 mt-1 fs-6" for="isAvailableSwitch">Currently Available</label>
                    </div>
                </div>

                <div class="col-md-4 mb-3 d-flex align-items-end pb-2">
                    <div class="form-check form-switch fs-5">
                        <input class="form-check-input" type="checkbox" role="switch" name="is_best_seller" id="isBestSellerSwitch" value="1" {{ old('is_best_seller') ? 'checked' : '' }}>
                        <label class="form-check-label ms-2 mt-1 fs-6" for="isBestSellerSwitch">Mark as Best Seller</label>
                    </div>
                </div>

                <div class="col-md-4 mb-3 d-flex align-items-end pb-2">
                    <div class="form-check form-switch fs-5">
                        <input class="form-check-input" type="checkbox" role="switch" name="is_upsell" id="isUpsellSwitch" value="1" {{ old('is_upsell') ? 'checked' : '' }}>
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
                            </tbody>
                    </table>
                </div>
            </div>

            <button type="submit" class="btn btn-primary btn-lg"><i class="bi bi-save"></i> Save Product</button>
        </form>
    </div>
</div>
@endsection

@push('scripts')
<script>
    $(document).ready(function() {
        let variantIndex = 0; // Start at 0 for new products

        // Add new row
        $('#addVariantBtn').click(function() {
            let html = `
                <tr class="variant-row">
                    <td>
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
            $(this).closest('tr').remove();
        });
    });
</script>
@endpush