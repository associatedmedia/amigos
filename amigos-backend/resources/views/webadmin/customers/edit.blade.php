@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Edit Customer</h1>
    <a href="{{ route('admin.customers.index') }}" class="btn btn-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Customers</a>
</div>

<div class="card shadow-sm border-0">
    <div class="card-body">
        <form action="{{ route('admin.customers.update', $customer->id) }}" method="POST">
            @csrf
            @method('PUT')
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Full Name</label>
                    <input type="text" name="name" class="form-control" value="{{ old('name', $customer->name) }}" required>
                </div>
                
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Mobile Number</label>
                    <input type="text" name="mobile_no" class="form-control" value="{{ old('mobile_no', $customer->mobile_no) }}" required>
                </div>

                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Email Address</label>
                    <input type="email" name="email" class="form-control" value="{{ old('email', $customer->email) }}">
                </div>

                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Password</label>
                    <input type="password" name="password" class="form-control" placeholder="Leave blank to keep unchanged">
                </div>
                
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Status</label>
                    <select name="is_active" class="form-select">
                        <option value="1" {{ old('is_active', $customer->is_active) ? 'selected' : '' }}>Active</option>
                        <option value="0" {{ old('is_active', $customer->is_active) ? '' : 'selected' }}>Inactive</option>
                    </select>
                </div>
                
                <div class="col-md-12 mb-4">
                    <label class="form-label fw-bold">Address</label>
                    <textarea name="address" class="form-control" rows="3">{{ old('address', $customer->address) }}</textarea>
                </div>
            </div>

            <button type="submit" class="btn btn-primary"><i class="bi bi-save"></i> Update Customer</button>
        </form>
    </div>
</div>
@endsection
