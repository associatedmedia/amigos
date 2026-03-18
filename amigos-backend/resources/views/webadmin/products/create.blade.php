@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Add Product</h1>
    <a href="{{ route('admin.products.index') }}" class="btn btn-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Products</a>
</div>

<div class="card shadow-sm border-0">
    <div class="card-body">
        <form action="{{ route('admin.products.store') }}" method="POST" enctype="multipart/form-data">
            @csrf
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Name</label>
                    <input type="text" name="name" class="form-control" placeholder="E.g., Margherita Pizza" value="{{ old('name') }}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Price (₹)</label>
                    <input type="number" step="0.01" name="price" class="form-control" placeholder="0.00" value="{{ old('price') }}" required>
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
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Old Database Code (Optional)</label>
                    <input type="text" name="old_db_code" class="form-control" placeholder="E.g., P01" value="{{ old('old_db_code') }}">
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
                    <input type="file" name="image" class="form-control" accept="image/*">
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
            </div>

            <button type="submit" class="btn btn-primary"><i class="bi bi-save"></i> Save Product</button>
        </form>
    </div>
</div>
@endsection
