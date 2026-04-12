@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Edit Coupon: {{ $coupon->code }}</h1>
    <a href="{{ route('admin.coupons.index') }}" class="btn btn-sm btn-outline-secondary">Back to List</a>
</div>

<div class="bg-white p-4 rounded shadow-sm border col-md-8">
    <form action="{{ route('admin.coupons.update', $coupon->id) }}" method="POST">
        @csrf
        @method('PUT')

        <div class="mb-3">
            <label for="code" class="form-label">Coupon Code</label>
            <input type="text" class="form-control" id="code" name="code" value="{{ old('code', $coupon->code) }}" required style="text-transform:uppercase">
            @error('code') <div class="text-danger mt-1"><small>{{ $message }}</small></div> @enderror
        </div>

        <div class="row">
            <div class="col-md-6 mb-3">
                <label for="type" class="form-label">Discount Type</label>
                <select class="form-select" id="type" name="type" required>
                    <option value="flat" {{ old('type', $coupon->type) == 'flat' ? 'selected' : '' }}>Flat Amount</option>
                    <option value="percent" {{ old('type', $coupon->type) == 'percent' ? 'selected' : '' }}>Percentage</option>
                </select>
                @error('type') <div class="text-danger mt-1"><small>{{ $message }}</small></div> @enderror
            </div>

            <div class="col-md-6 mb-3">
                <label for="value" class="form-label">Discount Value</label>
                <input type="number" step="0.01" class="form-control" id="value" name="value" value="{{ old('value', $coupon->value) }}" required>
                @error('value') <div class="text-danger mt-1"><small>{{ $message }}</small></div> @enderror
            </div>
        </div>

        <div class="mb-3">
            <label for="min_cart_amount" class="form-label">Minimum Cart Amount</label>
            <input type="number" step="0.01" class="form-control" id="min_cart_amount" name="min_cart_amount" value="{{ old('min_cart_amount', $coupon->min_cart_amount) }}" required>
            @error('min_cart_amount') <div class="text-danger mt-1"><small>{{ $message }}</small></div> @enderror
        </div>

        <div class="row">
            <div class="col-md-6 mb-3">
                <label for="usage_limit" class="form-label">Total Usage Limit (Optional)</label>
                <input type="number" class="form-control" id="usage_limit" name="usage_limit" value="{{ old('usage_limit', $coupon->usage_limit) }}">
                <small class="text-muted">Total number of times this coupon can be used across all users.</small>
            </div>

            <div class="col-md-6 mb-3">
                <label for="usage_limit_per_user" class="form-label">Usage Limit Per User (Optional)</label>
                <input type="number" class="form-control" id="usage_limit_per_user" name="usage_limit_per_user" value="{{ old('usage_limit_per_user', $coupon->usage_limit_per_user) }}">
                <small class="text-muted">Number of times a single user can use this coupon.</small>
            </div>
        </div>

        <div class="mb-4 form-check">
            <input type="checkbox" class="form-check-input" id="is_active" name="is_active" value="1" {{ old('is_active', $coupon->is_active) ? 'checked' : '' }}>
            <label class="form-check-label" for="is_active">Active</label>
        </div>

        <button type="submit" class="btn btn-primary">Update Coupon</button>
    </form>
</div>
@endsection
