@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Edit Order Status ID #{{ $orderStatus->id }}</h1>
    <a href="{{ route('admin.order-statuses.index') }}" class="btn btn-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Statuses</a>
</div>

<div class="card shadow-sm border-0">
    <div class="card-body">
        <form action="{{ route('admin.order-statuses.update', $orderStatus->id) }}" method="POST">
            @csrf
            @method('PUT')

            <div class="row">
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Internal Status Code</label>
                    <input type="text" name="status_code" class="form-control" value="{{ old('status_code', $orderStatus->status_code) }}" required>
                    <small class="text-muted">Must be unique, lowercase, and no spaces.</small>
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Display Label</label>
                    <input type="text" name="label" class="form-control" value="{{ old('label', $orderStatus->label) }}" required>
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Step Index</label>
                    <input type="number" name="step_index" class="form-control" value="{{ old('step_index', $orderStatus->step_index) }}" required>
                </div>
            </div>

            <button type="submit" class="btn btn-primary"><i class="bi bi-save"></i> Update Order Status</button>
        </form>
    </div>
</div>
@endsection
