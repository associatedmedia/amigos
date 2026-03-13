@extends('webadmin.layouts.app')

@section('title', 'Application Settings')

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Application Settings</h3>
                </div>
                <div class="card-body">
                    @if (session('success'))
                        <div class="alert alert-success" role="alert">
                            {{ session('success') }}
                        </div>
                    @endif

                    <form action="{{ route('admin.settings.update') }}" method="POST">
                        @csrf
                        <div class="row">
                            <div class="col-md-6">
                                <h5>General Settings</h5>
                                <div class="form-group mb-3">
                                    <label for="is_store_online">Store Status</label>
                                    <select name="is_store_online" id="is_store_online" class="form-control">
                                        <option value="1" {{ old('is_store_online', $isStoreOnline) == '1' ? 'selected' : '' }}>Online (Accepting Orders)</option>
                                        <option value="0" {{ old('is_store_online', $isStoreOnline) == '0' ? 'selected' : '' }}>Offline (Closed)</option>
                                    </select>
                                </div>
                                <div class="form-group mb-3">
                                    <label for="cod_enabled">Cash on Delivery (COD)</label>
                                    <select name="cod_enabled" id="cod_enabled" class="form-control">
                                        <option value="1" {{ old('cod_enabled', $codEnabled) == '1' ? 'selected' : '' }}>Enabled</option>
                                        <option value="0" {{ old('cod_enabled', $codEnabled) == '0' ? 'selected' : '' }}>Disabled</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h5>Minimum Order Criteria (for Delivery)</h5>
                                @foreach ($fullCriteria as $criterion)
                                <div class="form-group row mb-2">
                                    <label for="criteria_{{ $criterion['distance'] }}" class="col-sm-6 col-form-label">
                                        @if ($criterion['distance'] == 'fallback')
                                            For distances > 10 KM
                                        @else
                                            Up to {{ $criterion['distance'] }} KM
                                        @endif
                                    </label>
                                    <div class="col-sm-6">
                                        <div class="input-group">
                                            <span class="input-group-text">₹</span>
                                            <input type="number" class="form-control" id="criteria_{{ $criterion['distance'] }}"
                                                   name="criteria[{{ $criterion['distance'] }}][min_value]"
                                                   value="{{ old('criteria.'.$criterion['distance'].'.min_value', $criterion['min_value']) }}"
                                                   min="0" required>
                                        </div>
                                    </div>
                                </div>
                                @endforeach
                            </div>
                        </div>
                        <hr>
                        <button type="submit" class="btn btn-primary">Save Settings</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection