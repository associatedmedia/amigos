@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Add Order Status</h1>
    <a href="{{ route('admin.order-statuses.index') }}" class="btn btn-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Statuses</a>
</div>

<div class="card shadow-sm border-0">
    <div class="card-body">
        <form action="{{ route('admin.order-statuses.store') }}" method="POST">
            @csrf
            
            <div class="row">
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Internal Status Code</label>
                    <input type="text" name="status_code" class="form-control" placeholder="e.g., in_kitchen" value="{{ old('status_code') }}" required>
                    <small class="text-muted">Must be unique, lowercase, and no spaces (use underscores).</small>
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Display Label</label>
                    <input type="text" name="label" class="form-control" placeholder="e.g., Preparing your food" value="{{ old('label') }}" required>
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Step Index</label>
                    <input type="number" name="step_index" class="form-control" placeholder="e.g., 2" value="{{ old('step_index') }}" required>
                    <small class="text-muted">0=Pending, 4=Completed, -1=Cancelled</small>
                </div>
            </div>

            <button type="submit" class="btn btn-primary"><i class="bi bi-save"></i> Save Order Status</button>
        </form>
    </div>
</div>
@endsection
