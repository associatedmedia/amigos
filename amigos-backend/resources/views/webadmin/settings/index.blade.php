@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">App Settings</h1>
</div>

<div class="card shadow-sm">
    <div class="card-body">
        @if(session('success'))
            <div class="alert alert-success mt-2">{{ session('success') }}</div>
        @endif

        <form action="{{ route('admin.settings.update') }}" method="POST">
            @csrf
            
            <h5 class="mb-3">General Settings</h5>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="is_store_online" class="form-label">Store Status</label>
                    <select name="is_store_online" id="is_store_online" class="form-select @error('is_store_online') is-invalid @enderror">
                        <option value="1" {{ old('is_store_online', $isStoreOnline ?? '1') == '1' ? 'selected' : '' }}>Online</option>
                        <option value="0" {{ old('is_store_online', $isStoreOnline ?? '') == '0' ? 'selected' : '' }}>Offline</option>
                    </select>
                    @error('is_store_online') <div class="invalid-feedback">{{ $message }}</div> @enderror
                </div>
                <div class="col-md-6">
                    <label for="cod_enabled" class="form-label">Cash on Delivery (COD)</label>
                    <select name="cod_enabled" id="cod_enabled" class="form-select @error('cod_enabled') is-invalid @enderror">
                        <option value="1" {{ old('cod_enabled', $codEnabled ?? '1') == '1' ? 'selected' : '' }}>Enabled</option>
                        <option value="0" {{ old('cod_enabled', $codEnabled ?? '') == '0' ? 'selected' : '' }}>Disabled</option>
                    </select>
                    @error('cod_enabled') <div class="invalid-feedback">{{ $message }}</div> @enderror
                </div>
            </div>

            <div class="row mb-4">
                <div class="col-md-6">
                    <label for="app_cache_timeline_minutes" class="form-label">App Cache Timeline (Minutes)</label>
                    <input type="number" class="form-control @error('app_cache_timeline_minutes') is-invalid @enderror" 
                           id="app_cache_timeline_minutes" name="app_cache_timeline_minutes" 
                           value="{{ old('app_cache_timeline_minutes', $appCacheTimeline ?? '15') }}" min="0">
                    <small class="text-muted">How often the Mobile App automatically refreshes background data (Menus, Banners). Set to 0 to disable caching (not recommended).</small>
                    @error('app_cache_timeline_minutes') <div class="invalid-feedback">{{ $message }}</div> @enderror
                </div>
            </div>

            <hr>
            <h5 class="mb-3">First Order Discount Settings</h5>
            <div class="row mb-3">
                <div class="col-md-3">
                    <label for="first_order_discount_enabled" class="form-label">Enable Discount</label>
                    <select name="first_order_discount_enabled" id="first_order_discount_enabled" class="form-select @error('first_order_discount_enabled') is-invalid @enderror">
                        <option value="1" {{ old('first_order_discount_enabled', $firstOrderEnabled ?? '0') == '1' ? 'selected' : '' }}>Enabled</option>
                        <option value="0" {{ old('first_order_discount_enabled', $firstOrderEnabled ?? '0') == '0' ? 'selected' : '' }}>Disabled</option>
                    </select>
                    @error('first_order_discount_enabled') <div class="invalid-feedback">{{ $message }}</div> @enderror
                </div>
                <div class="col-md-3">
                    <label for="first_order_discount_type" class="form-label">Discount Type</label>
                    <select name="first_order_discount_type" id="first_order_discount_type" class="form-select @error('first_order_discount_type') is-invalid @enderror">
                        <option value="flat" {{ old('first_order_discount_type', $firstOrderType ?? 'flat') == 'flat' ? 'selected' : '' }}>Flat Amount</option>
                        <option value="percent" {{ old('first_order_discount_type', $firstOrderType ?? 'percent') == 'percent' ? 'selected' : '' }}>Percentage</option>
                    </select>
                    @error('first_order_discount_type') <div class="invalid-feedback">{{ $message }}</div> @enderror
                </div>
                <div class="col-md-3">
                    <label for="first_order_discount_value" class="form-label">Discount Value</label>
                    <input type="number" step="0.01" class="form-control @error('first_order_discount_value') is-invalid @enderror" 
                           id="first_order_discount_value" name="first_order_discount_value" 
                           value="{{ old('first_order_discount_value', $firstOrderValue ?? '0') }}" min="0">
                    @error('first_order_discount_value') <div class="invalid-feedback">{{ $message }}</div> @enderror
                </div>
                <div class="col-md-3">
                    <label for="first_order_discount_min_amount" class="form-label">Min Cart Amount</label>
                    <input type="number" step="0.01" class="form-control @error('first_order_discount_min_amount') is-invalid @enderror" 
                           id="first_order_discount_min_amount" name="first_order_discount_min_amount" 
                           value="{{ old('first_order_discount_min_amount', $firstOrderMinAmount ?? '500') }}" min="0">
                    <small class="text-muted">Min order value to apply discount (Default 500).</small>
                    @error('first_order_discount_min_amount') <div class="invalid-feedback">{{ $message }}</div> @enderror
                </div>
            </div>

            <hr>
            <h5 class="mb-3">Minimum Order Value by Distance (KM)</h5>
            <p class="text-muted small">Set the minimum cart value required for delivery based on distance. Use 'Fallback' for distances beyond 10KM.</p>
            
            <div class="row g-3">
                @foreach($fullCriteria ?? [] as $index => $criteria)
                    <div class="col-md-3 col-sm-4">
                        <div class="input-group">
                            <span class="input-group-text" style="width: 80px; justify-content: center;">
                                {{ is_numeric($criteria['distance']) ? $criteria['distance'] . ' KM' : 'Fallback' }}
                            </span>
                            <input type="hidden" name="criteria[{{ $criteria['distance'] }}][distance]" value="{{ $criteria['distance'] }}">
                            <input type="number" step="0.01" class="form-control" name="criteria[{{ $criteria['distance'] }}][min_value]" 
                                   value="{{ $criteria['min_value'] }}" required>
                        </div>
                    </div>
                @endforeach
            </div>

            <div class="mt-4">
                <button type="submit" class="btn btn-primary">Save Settings</button>
            </div>
        </form>
    </div>
</div>
@endsection
